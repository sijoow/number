/**
 * 노래 이름 — 파일 이름에서 보이는 이름을 만들고(확장자·트랙 번호·가수 이름 떼기), 이름이 숫자 하나면 그 숫자 친구를 카드 그림으로
 * (2026-10-29 사용자: 유튜브 「넘버블럭스 - 한국」 노래 목록 「일」 「오」 「영」 … 처럼).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { MAX_NUMBER, nameOf, range, sinoOf } from "../curriculum/numbers.ts";

const ARTIST = "(?:넘버블럭스|넘버블록스|numberblocks)(?:\\s*-\\s*(?:한국|topic))*";

/** "01. 일.mp3" · "01 - 일.mp3" · "넘버블럭스 - 일.mp3" · "일 - 넘버블럭스 - 한국.m4a" → "일" */
export function cleanTitle(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").trim();
  const t = base
    .replace(/^\s*\d{1,3}\s*(?:[.)]|\s-\s|_)\s*/, "")
    .replace(/^0\d\s+/, "")
    .replace(new RegExp(`^${ARTIST}\\s*[-–:]\\s*`, "i"), "")
    .replace(new RegExp(`\\s*[-–]\\s*${ARTIST}\\s*$`, "i"), "")
    .replace(new RegExp(`\\s*[(\\[]${ARTIST}[)\\]]\\s*$`, "i"), "")
    .trim();
  return t || base || "노래";
}

/** 이름이 숫자 하나면 그 수(0~20) — "일" · "십이" · "영" · "셋" · "3". 아니면 null */
export function numberOfTitle(title: string): number | null {
  const t = title.trim();
  const n = range(0, MAX_NUMBER).find((k) => t === sinoOf(k) || t === nameOf(k));
  if (n !== undefined) return n;
  const m = /^(\d{1,2})$/.exec(t);
  return m && Number(m[1]) <= MAX_NUMBER ? Number(m[1]) : null;
}

/** 재생 시간 — 225 → "3:45". 모르면 "" */
export function clockOf(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
