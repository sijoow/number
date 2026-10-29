/**
 * 생각 놀이 판 만들기 — 무작위는 여기서만. 친구는 지금 아는 가장 큰 수(top)까지, 열까지만(친구가 많으면 카드가 작아진다).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { range } from "../curriculum/numbers.ts";
import type { ThinkId } from "../curriculum/thinks.ts";
import { SHAPE_COLORS, SHAPES, type ShapeId } from "../curriculum/things.ts";
import { shuffle, type Rng } from "./rounds.ts";

export type BuiltThink =
  | { id: "mirror"; rounds: MirrorRound[] }
  | { id: "memory"; rounds: MemoryRound[] }
  | { id: "who-hid"; rounds: WhoHidRound[] }
  | { id: "sequence"; rounds: SequenceRound[] }
  | { id: "matrix"; rounds: MatrixRound[] };

export function buildThink(id: ThinkId, top: number, rng: Rng): BuiltThink {
  switch (id) {
    case "mirror":
      return { id, rounds: mirrorRounds(rng) };
    case "memory":
      return { id, rounds: memoryRounds(top, rng) };
    case "who-hid":
      return { id, rounds: whoHidRounds(top, rng) };
    case "sequence":
      return { id, rounds: sequenceRounds(top, rng) };
    case "matrix":
      return { id, rounds: matrixRounds(rng) };
  }
}

/** 거울 그림 한쪽 판 — 세 줄 × 세 칸(업체 Lv.1 처럼 작게) */
export const MIRROR_ROWS = 3;
export const MIRROR_COLS = 3;

export interface MirrorRound {
  color: string;
  /** 왼쪽에 찍혀 있는 칸(줄 × 칸 차례 번호) */
  left: number[];
  /** 오른쪽에 찍어야 할 칸 — 가운데 선에 비친 자리 */
  answer: number[];
}

/** 가운데 선에 비친 칸 — 같은 줄, 가운데에서 같은 거리 */
export function mirrorOf(cell: number): number {
  const row = Math.floor(cell / MIRROR_COLS);
  const col = cell % MIRROR_COLS;
  return row * MIRROR_COLS + (MIRROR_COLS - 1 - col);
}

/** 점 둘 → 셋 → 넷. 판마다 색이 다르다 */
export function mirrorRounds(rng: Rng): MirrorRound[] {
  const colors = shuffle(SHAPE_COLORS, rng);
  return [2, 3, 4].map((dots, i) => {
    const left = shuffle(range(0, MIRROR_ROWS * MIRROR_COLS - 1), rng)
      .slice(0, dots)
      .sort((a, b) => a - b);
    return { color: colors[i % colors.length], left, answer: left.map(mirrorOf).sort((a, b) => a - b) };
  });
}

export interface MemoryRound {
  /** 카드 — 숫자 친구 번호가 둘씩, 섞인 차례 */
  cards: number[];
}

/** 짝 맞추기 — 두 짝 → 세 짝 → 네 짝(아는 친구가 적으면 그만큼) */
export function memoryRounds(top: number, rng: Rng): MemoryRound[] {
  const known = Math.min(10, Math.max(3, top));
  return [2, 3, 4].map((pairs) => {
    const friends = shuffle(range(1, known), rng).slice(0, Math.min(pairs, known));
    return { cards: shuffle([...friends, ...friends], rng) };
  });
}

export interface WhoHidRound {
  /** 무대에 선 친구(왼쪽부터) */
  friends: number[];
  /** 숨는 친구의 자리 */
  hidden: number;
  /** 보기 셋 — 숨은 친구 · 아직 무대에 있는 친구 · 처음부터 없던 친구(기억해야 고른다) */
  choices: number[];
}

/** 누가 숨었을까 — 셋 → 셋 → 넷. 아는 친구가 적으면 무대 친구를 줄여서 「없던 친구」 보기를 남긴다 */
export function whoHidRounds(top: number, rng: Rng): WhoHidRound[] {
  const known = Math.min(10, Math.max(3, top));
  return [3, 3, 4].map((size) => {
    const shown = Math.max(2, Math.min(size, known - 1));
    const pool = shuffle(range(1, known), rng);
    const friends = pool.slice(0, shown);
    const outsider = pool[shown];
    const hidden = Math.floor(rng() * shown);
    const stay = shuffle(
      friends.filter((_, i) => i !== hidden),
      rng,
    )[0];
    return { friends, hidden, choices: shuffle([friends[hidden], stay, ...(outsider ? [outsider] : [])], rng) };
  });
}

/** 순서 기억하기 — 친구 넷(아는 친구가 셋이면 셋)이 차례로 반짝이고, 같은 차례로 누른다. 둘 → 셋 → 넷(같은 친구는 한 번만) */
export interface SequenceRound {
  friends: number[];
  /** 반짝이는 차례 — 친구 자리 번호 */
  order: number[];
}

export function sequenceRounds(top: number, rng: Rng): SequenceRound[] {
  const known = Math.min(10, Math.max(3, top));
  const pads = Math.min(4, known);
  return [2, 3, 4].map((len) => ({
    friends: shuffle(range(1, known), rng).slice(0, pads),
    order: shuffle(range(0, pads - 1), rng).slice(0, Math.min(len, pads)),
  }));
}

/** 빈칸 채우기 — 줄마다 모양이, 칸마다 색이 같은 판(두 줄 × 두 칸 둘 → 세 줄 × 세 칸). 빈칸에 맞는 것을 보기 셋에서 */
export interface MatrixPiece {
  shape: ShapeId;
  color: string;
}

export interface MatrixRound {
  /** 줄마다 모양(위부터) */
  shapes: ShapeId[];
  /** 칸마다 색(왼쪽부터) */
  colors: string[];
  /** 빈칸 — 줄 × 칸 차례 번호 */
  blank: number;
  /** 보기 셋 — 정답 · 모양만 맞는 것 · 색만 맞는 것 */
  choices: MatrixPiece[];
}

/** 판에 쓸 색 — 주황은 빨강·노랑과 헷갈려서 뺀다 */
const MATRIX_COLORS = SHAPE_COLORS.filter((c) => c !== "#f5a742");

export function matrixRounds(rng: Rng): MatrixRound[] {
  return [2, 2, 3].map((n) => {
    const shapes = shuffle(
      SHAPES.map((s) => s.id),
      rng,
    ).slice(0, n);
    const colors = shuffle(MATRIX_COLORS, rng).slice(0, n);
    const blank = Math.floor(rng() * n * n);
    const row = Math.floor(blank / n);
    const col = blank % n;
    const right: MatrixPiece = { shape: shapes[row], color: colors[col] };
    const otherColor = colors.find((_, i) => i !== col) ?? colors[0];
    const otherShape = shapes.find((_, i) => i !== row) ?? shapes[0];
    return { shapes, colors, blank, choices: shuffle([right, { shape: right.shape, color: otherColor }, { shape: otherShape, color: right.color }], rng) };
  });
}
