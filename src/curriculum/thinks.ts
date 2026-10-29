/**
 * 생각 놀이 — 업체 「사고력 세상」 Lv.1 처럼 수 말고 생각하는 힘(모양·공간, 기억)을 기르는 놀이(2026-10-28 사용자: 토도수학 유아 단계 구성요소를 따라서).
 * 업체 놀이 중 4살에게 맞는 것만 골라 우리 그림(넘버블럭스 친구)으로 — 데칼코마니 → 거울 그림, 짝 맞추기(카드 뒤집기), 바닷속 친구들 → 누가 숨었을까.
 * 진도와 상관없이 늘 열려 있다. 친구는 만난 친구까지(lib/progress topNumber).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export type ThinkId = "mirror" | "memory" | "who-hid" | "sequence" | "matrix";

export interface Think {
  id: ThinkId;
  title: string;
  /** 카드 아래 — 이 놀이로 기르는 것(부모가 보는 말) */
  learn: string;
  /** 그림이 없을 때 대신 보일 이모지 */
  icon: string;
  tone: "sky" | "butter" | "mint" | "lilac" | "rose" | "peach";
}

export const THINKS: readonly Think[] = [
  { id: "mirror", title: "거울 그림", learn: "반으로 접은 듯 똑같이", icon: "🦋", tone: "sky" },
  { id: "memory", title: "짝 맞추기", learn: "어디 있었는지 기억하기", icon: "🃏", tone: "butter" },
  { id: "who-hid", title: "누가 숨었을까?", learn: "누가 있었는지 기억하기", icon: "🙈", tone: "mint" },
  // 선물 놀이(2026-10-29 사용자: 업체 「순서 기억하기」·「매트릭스」를 우리 그림으로) — 열리는 차례는 curriculum/gifts
  { id: "sequence", title: "순서 기억하기", learn: "본 차례대로 기억하기", icon: "💡", tone: "lilac" },
  { id: "matrix", title: "빈칸 채우기", learn: "가로줄 · 세로줄 규칙", icon: "🔳", tone: "peach" },
];

export function thinkOf(id: string): Think | undefined {
  return THINKS.find((t) => t.id === id);
}
