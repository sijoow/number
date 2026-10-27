/**
 * 놀이터 — 오늘의 놀이에서 만난 놀이를 언제든 다시 한다. 놀이 종류가 처음 나온 날을 지나면 열린다(course.firstSeen).
 * 수 범위는 지금까지 만난 숫자 친구 중 가장 큰 수까지(아직 아무도 안 만났으면 3까지) — 아는 수로만 논다.
 * 그림은 힉스필드 "scene:free:<id>"(카드 장면) — 없으면 이모지.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { firstSeen } from "./course.ts";
import { ARITH_MAX } from "./numbers.ts";
import type { ActivityKind, ActivitySpec } from "./types.ts";

export interface PlayContext {
  /** 지금 아는 가장 큰 수 */
  top: number;
  /** 규칙 찾기 단계 — ABC 를 배운 뒤(B3)면 abc */
  patternLevel: "ab" | "abc";
}

export interface Game {
  id: ActivityKind;
  title: string;
  icon: string;
  tone: "sky" | "butter" | "mint" | "lilac" | "rose" | "peach";
  spec: (c: PlayContext) => ActivitySpec;
}

export const GAMES: readonly Game[] = [
  { id: "count", title: "하나씩 세기", icon: "👆", tone: "sky", spec: ({ top }) => ({ kind: "count", range: [1, top], rounds: 4 }) },
  { id: "how-many", title: "몇 개일까?", icon: "🍎", tone: "rose", spec: ({ top }) => ({ kind: "how-many", range: [1, top], rounds: 5 }) },
  { id: "find-num", title: "숫자 찾기", icon: "👂", tone: "butter", spec: ({ top }) => ({ kind: "find-num", range: [1, top], rounds: 5 }) },
  { id: "build", title: "블록 쌓기", icon: "🧱", tone: "peach", spec: ({ top }) => ({ kind: "build", range: [1, top], rounds: 3 }) },
  { id: "clap", title: "짝짝 손뼉", icon: "👏", tone: "lilac", spec: ({ top }) => ({ kind: "clap", range: [1, top], rounds: 3 }) },
  { id: "compare", title: "더 많은 쪽", icon: "⚖️", tone: "mint", spec: ({ top }) => ({ kind: "compare", range: [1, Math.min(top, 10)], rounds: 5, ask: "mix" }) },
  { id: "next-num", title: "다음 숫자", icon: "➡️", tone: "sky", spec: ({ top }) => ({ kind: "next-num", range: [1, top], rounds: 4 }) },
  { id: "shape", title: "모양 찾기", icon: "🔺", tone: "butter", spec: () => ({ kind: "shape", shapes: ["circle", "triangle", "square"], rounds: 5 }) },
  { id: "pattern", title: "규칙 찾기", icon: "🔁", tone: "rose", spec: ({ patternLevel }) => ({ kind: "pattern", level: patternLevel, rounds: 4 }) },
  { id: "join", title: "모아 보기", icon: "🤝", tone: "mint", spec: ({ top }) => ({ kind: "join", max: Math.min(5, Math.max(2, top)), rounds: 4 }) },
  // 업체 과정을 따라가며 생긴 놀이(2026-10-27) — 과정에서 처음 나온 날(A9·B5·B7·B9)부터 열린다
  { id: "size", title: "크기 비교", icon: "📏", tone: "sky", spec: () => ({ kind: "size", ask: "mix", rounds: 4 }) },
  { id: "add", title: "더하기", icon: "➕", tone: "peach", spec: ({ top }) => ({ kind: "add", max: Math.min(ARITH_MAX, Math.max(2, top)), rounds: 4 }) },
  { id: "subtract", title: "빼기", icon: "➖", tone: "lilac", spec: ({ top }) => ({ kind: "subtract", max: Math.min(ARITH_MAX, Math.max(2, top)), rounds: 4 }) },
  { id: "sort", title: "모양 나누기", icon: "🧺", tone: "butter", spec: () => ({ kind: "sort", by: "mix", rounds: 3 }) },
];

/** 놀이터 카드 아래 "○○까지" — 수를 다루는 놀이만(더하기·빼기·모으기는 5, 더 많은 쪽은 10까지). 모양·규칙·크기·나누기는 없다 */
export function gameReach(id: ActivityKind, top: number): number | null {
  const s = gameOf(id)?.spec({ top, patternLevel: "ab" });
  if (!s) return null;
  if ("range" in s) return s.range[1];
  if (s.kind === "join" || s.kind === "add" || s.kind === "subtract") return s.max;
  return null;
}

export function gameOf(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

/** 이 놀이가 열리는 날 */
export function gameOpens(g: Game): { chapter: number; day: number } {
  return firstSeen(g.id) ?? { chapter: 1, day: 1 };
}
