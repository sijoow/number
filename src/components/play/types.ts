/** 놀이 하나를 마쳤을 때 — 점수 놀이는 첫 시도에 맞힌 수, 나머지는 0/0 */
export interface ActivityResult {
  correct: number;
  total: number;
  /** 도전 판을 처음에 맞혔으면 1 — 오늘의 놀이에서 블록 하나 더 */
  bonus?: number;
}

export type OnDone = (r: ActivityResult) => void;
