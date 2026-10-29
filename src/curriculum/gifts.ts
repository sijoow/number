/**
 * 선물 놀이 — 오늘의 미션을 다 해서 도장을 받을 때마다 새 놀이가 하나씩 열린다(2026-10-29 사용자: 미션 랜덤 + 새 놀이 선물).
 * 받은 개수는 도장 받은 날 수(progress.missionDays)로 센다 — 따로 적지 않는다. 그래서 전에 받은 도장도 그만큼 열려 있다.
 * 차례는 쉬운 것부터 — 숫자 놀이와 생각 놀이가 섞여 있다. 원래 있던 놀이는 그대로 늘 열려 있다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import type { OriginalId } from "./originals.ts";
import type { ThinkId } from "./thinks.ts";

export type Gift = { menu: "games"; id: OriginalId } | { menu: "think"; id: ThinkId };

export const GIFTS: readonly Gift[] = [
  { menu: "games", id: "eggs" },
  { menu: "games", id: "parts" },
  { menu: "think", id: "sequence" },
  { menu: "games", id: "more-less" },
  { menu: "games", id: "hide-line" },
  { menu: "games", id: "meal" },
  { menu: "think", id: "matrix" },
  { menu: "games", id: "num-train" },
  { menu: "games", id: "rocket" },
  { menu: "games", id: "ten-frame" },
  { menu: "games", id: "num-board" },
];

/** 선물로 열리는 놀이인가 */
export function isGift(id: string): boolean {
  return GIFTS.some((g) => g.id === id);
}
