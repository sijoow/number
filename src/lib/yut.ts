/**
 * 주사위 윷놀이 — 윷판(둘레 20칸 + 대각선 지름길)을 주사위로(2026-10-27 사용자: "윷놀이 형식을 주사위로", 혼자·둘이·셋이, NPC 와 같이).
 *   출발·도착 = 오른쪽 아래 모서리. 오른쪽 위 → 왼쪽 위 → 왼쪽 아래 → 오른쪽 아래로 한 바퀴(시계 반대 방향).
 *   지름길 — 오른쪽 위 모서리에 딱 멈추면 가운데를 지나 왼쪽 아래로, 왼쪽 위 모서리에 딱 멈추면 가운데를 지나 도착으로,
 *            가운데에 딱 멈추면 도착 쪽으로(윷놀이 그대로).
 *   잡기 — 다른 말이 있는 칸에 멈추면 그 말은 처음부터 다시 출발, 잡은 쪽은 한 번 더(윷놀이 그대로).
 *   한 번 더 — 주사위 6. 도착은 끝 칸을 넘어도 된다(아이가 딱 맞출 필요 없게).
 * 말은 사람마다 하나. 순수 파일 — node --test 가 그대로 읽는다.
 */

import { range } from "../curriculum/numbers.ts";

export type Station = string;

/** 칸 자리(판 안 %) — 둘레는 한 변에 다섯 칸, 대각선은 모서리와 가운데 사이에 두 칸씩 */
export const STATIONS: Record<Station, { x: number; y: number; big?: boolean }> = (() => {
  const s: Record<Station, { x: number; y: number; big?: boolean }> = {};
  const lo = 8;
  const hi = 92;
  const step = (hi - lo) / 5;
  for (let i = 0; i < 20; i++) {
    const side = Math.floor(i / 5);
    const k = i % 5;
    const [x, y] =
      side === 0 ? [hi, hi - k * step] : side === 1 ? [hi - k * step, lo] : side === 2 ? [lo, lo + k * step] : [lo + k * step, hi];
    s[`o${i}`] = { x, y, big: k === 0 };
  }
  // 두 점 사이 t 만큼 — 대각선 칸은 모서리와 가운데 사이를 셋으로 나눈 자리
  const between = (from: [number, number], to: [number, number], t: number) => ({ x: from[0] + (to[0] - from[0]) * t, y: from[1] + (to[1] - from[1]) * t });
  const C: [number, number] = [50, 50];
  // 대각선 A: 오른쪽 위(o5) → a1 → a2 → 가운데 → a3 → a4 → 왼쪽 아래(o15)
  s.a1 = between([hi, lo], C, 1 / 3);
  s.a2 = between([hi, lo], C, 2 / 3);
  s.a3 = between(C, [lo, hi], 1 / 3);
  s.a4 = between(C, [lo, hi], 2 / 3);
  // 대각선 B: 왼쪽 위(o10) → b1 → b2 → 가운데 → b3 → b4 → 오른쪽 아래(도착)
  s.b1 = between([lo, lo], C, 1 / 3);
  s.b2 = between([lo, lo], C, 2 / 3);
  s.b3 = between(C, [hi, hi], 1 / 3);
  s.b4 = between(C, [hi, hi], 2 / 3);
  s.c = { x: 50, y: 50, big: true };
  return s;
})();

/** 길 — 말은 지금 길에서 몇째 칸인지로 다닌다. "end" 는 도착 */
export const ROUTES = {
  outer: [...range(0, 19).map((i) => `o${i}`), "end"],
  /** 오른쪽 위 모서리에서 지름길 */
  viaA: ["o5", "a1", "a2", "c", "a3", "a4", "o15", "o16", "o17", "o18", "o19", "end"],
  /** 왼쪽 위 모서리에서 지름길 */
  viaB: ["o10", "b1", "b2", "c", "b3", "b4", "end"],
  /** 가운데에 딱 멈춘 뒤 — 도착 쪽으로 */
  fromC: ["c", "b3", "b4", "end"],
} as const;

export type RouteId = keyof typeof ROUTES;

export interface Piece {
  route: RouteId;
  at: number;
}

export const START: Piece = { route: "outer", at: 0 };

export function stationOf(p: Piece): Station {
  return ROUTES[p.route][p.at];
}

/** 아직 출발 안 했나(출발 칸에 서 있음) */
export function atStart(p: Piece): boolean {
  return p.route === "outer" && p.at === 0;
}

export function finished(p: Piece): boolean {
  return stationOf(p) === "end";
}

/** k 칸 가기 — 지나가는 칸들(한 칸씩 셀 때 쓴다)과 멈춘 뒤의 말(지름길이면 길이 바뀐다) */
export function walk(p: Piece, k: number): { path: Station[]; next: Piece; shortcut: boolean } {
  const route = ROUTES[p.route];
  const end = Math.min(route.length - 1, p.at + k);
  const path = route.slice(p.at + 1, end + 1) as Station[];
  let next: Piece = { route: p.route, at: end };
  const stop = route[end];
  let shortcut = false;
  if (p.route === "outer" && stop === "o5") next = { route: "viaA", at: 0 };
  else if (p.route === "outer" && stop === "o10") next = { route: "viaB", at: 0 };
  else if (p.route === "viaA" && stop === "c") next = { route: "fromC", at: 0 };
  if (next.route !== p.route) shortcut = true;
  return { path, next, shortcut };
}

/** 같은 칸에 멈췄나 — 출발 칸·도착은 잡지 않는다 */
export function sameSpot(a: Piece, b: Piece): boolean {
  if (atStart(a) || atStart(b) || finished(a) || finished(b)) return false;
  return stationOf(a) === stationOf(b);
}

/** 남은 칸 수(가장 짧은 길로) — 판 위 순서를 보여 줄 때(누가 앞섰나) */
export function stepsLeft(p: Piece): number {
  return ROUTES[p.route].length - 1 - p.at;
}
