/**
 * 한글나라에서 받아오는 아이 정보·설정 — 같은 MongoDB 클러스터의 한글나라 DB(HANGUL_DB, 기본 todohangul)를 읽기만 한다.
 *   users.{아이디}.name               관리자가 만든 아이 계정 이름 (ACCOUNTS 계정은 없음)
 *   progress.{아이디}.settings        voice · orientation · studyDays · startOn
 *   progress.{아이디}.progress.firstOn 한글나라를 처음 한 날
 * 2026-10-27 사용자 결정: 로그인 계정과 아이 정보·설정은 한글나라 것을 받아 쓴다(연결 = 같은 MongoDB 직접).
 * 그래서 화면 방향·공부하는 요일·성우는 숫자놀이에서 바꾸지 않는다 — 한글나라 부모 페이지에서 바꾸면 따라온다.
 * 서버(app/api/family)와 기기(lib/family)가 같이 쓰는 모양·검사. 순수 파일 — node --test 가 그대로 읽는다.
 */

import { DEFAULT_VOICE, isVoiceId, type VoiceId } from "./voices.ts";

export type Orientation = "portrait" | "landscape";

/** 공부하는 요일 기본값 — 매일 */
export const EVERY_DAY: readonly number[] = [0, 1, 2, 3, 4, 5, 6];

export interface Family {
  /** 한글나라 아이 계정 이름 — ACCOUNTS 계정(fe·kid)이면 null */
  name: string | null;
  voice: VoiceId;
  orientation: Orientation;
  /** 0=일 … 6=토 */
  studyDays: number[];
  /** 한글나라를 시작한 날(부모가 고친 날 > 처음 한 날) */
  hangulStartOn: string | null;
  /** 한글나라에 이 아이디 기록이 있었나 — 없으면 아래 값은 모두 기본값 */
  found: boolean;
  /** 마지막으로 받아온 시각(ms) — 0 이면 아직 못 받음 */
  at: number;
}

export const DEFAULT_FAMILY: Family = {
  name: null,
  voice: DEFAULT_VOICE,
  orientation: "portrait",
  studyDays: [...EVERY_DAY],
  hangulStartOn: null,
  found: false,
  at: 0,
};

const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

function studyDaysOf(v: unknown): number[] {
  const days = Array.isArray(v) ? [...new Set(v.filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 6))].sort((a, b) => a - b) : [];
  return days.length ? days : [...EVERY_DAY];
}

/** 한글나라 문서(users·progress) → Family. 서버가 부른다 */
export function familyFromHangul(user: { name?: unknown } | null, doc: { settings?: unknown; progress?: unknown } | null, at: number): Family {
  const s = obj(doc?.settings);
  const p = obj(doc?.progress);
  const name = typeof user?.name === "string" && user.name.trim() ? user.name.trim().slice(0, 30) : null;
  return {
    name,
    voice: isVoiceId(s?.voice) ? s.voice : DEFAULT_FAMILY.voice,
    orientation: s?.orientation === "landscape" ? "landscape" : "portrait",
    studyDays: studyDaysOf(s?.studyDays),
    hangulStartOn: isDay(s?.startOn) ? s.startOn : isDay(p?.firstOn) ? p.firstOn : null,
    found: Boolean(doc || user),
    at,
  };
}

/** 기기에 둔 값·서버가 준 값 검사 — 모양이 틀리면 기본값 */
export function normalizeFamily(raw: unknown): Family {
  const o = obj(raw);
  if (!o) return DEFAULT_FAMILY;
  return {
    name: typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 30) : null,
    voice: isVoiceId(o.voice) ? o.voice : DEFAULT_FAMILY.voice,
    orientation: o.orientation === "landscape" ? "landscape" : "portrait",
    studyDays: studyDaysOf(o.studyDays),
    hangulStartOn: isDay(o.hangulStartOn) ? o.hangulStartOn : null,
    found: o.found === true,
    at: typeof o.at === "number" && Number.isFinite(o.at) ? o.at : 0,
  };
}
