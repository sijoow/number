/**
 * 놀이 설계도(ActivitySpec) → 실제 판(어떤 수·어떤 물건·보기 순서·놓일 자리).
 * 무작위는 여기서만 쓴다 — 시작 버튼을 누를 때 한 번 섞고, 화면은 받은 판을 그대로 그린다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { addPairs, ARITH_MAX, MAX_NUMBER, range, subtractPairs } from "../curriculum/numbers.ts";
import { SHAPE_COLORS, SHAPES, THINGS, type ShapeId } from "../curriculum/things.ts";
import type { ActivitySpec, DayPlan, NumRange } from "../curriculum/types.ts";

export type Rng = () => number;

/** 씨앗이 같으면 같은 순서 — 테스트와 미리 보기가 쓴다 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickOne<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** 판 안의 자리(%) — 물건·방울을 겹치지 않게 칸을 나눠 놓고 칸 안에서 조금 흔든다 */
export interface Spot {
  x: number;
  y: number;
  /** 살짝 기울기(도) */
  tilt: number;
}

export interface NumRound {
  n: number;
  choices: number[];
  /** 도전 판(오늘의 놀이 마지막 판) — withChallenge */
  challenge?: boolean;
}

export interface ThingRound extends NumRound {
  thing: string;
  spots: Spot[];
}

export interface CompareRound {
  left: number;
  right: number;
  thing: string;
  ask: "more" | "fewer";
  /** 물건 무리로 볼지, 숫자(+ 그 수만큼 블록)로 볼지 */
  show: "things" | "numbers";
  leftSpots: Spot[];
  rightSpots: Spot[];
  /** 도전 판(오늘의 놀이 마지막 판) — withChallenge */
  challenge?: boolean;
}

export interface SeqRound {
  /** 보여 주는 수 — 마지막 칸이 물음표 */
  seq: number[];
  answer: number;
  choices: number[];
  /** 도전 판(오늘의 놀이 마지막 판) — withChallenge */
  challenge?: boolean;
}

export interface ShapeCard {
  /** 보기 구분용 — 같은 모양이 둘일 수도 있어서 */
  key: string;
  shape: ShapeId;
  color: string;
  scale: number;
  rot: number;
}

export interface ShapeRound {
  target: ShapeId;
  choices: ShapeCard[];
}

export interface PatternRound {
  /** 물건 id 줄 — 그 뒤 칸이 물음표 */
  seq: string[];
  answer: string;
  choices: string[];
}

export interface JoinRound {
  a: number;
  b: number;
  choices: number[];
  /** 도전 판(오늘의 놀이 마지막 판) — withChallenge */
  challenge?: boolean;
}

export interface SizeRound {
  shape: ShapeId;
  ask: "bigger" | "smaller";
  /** 왼쪽·오른쪽 — scale 이 큰 쪽이 큰 것 */
  left: { color: string; scale: number };
  right: { color: string; scale: number };
}

export interface ArithRound {
  a: number;
  b: number;
  /** 더하기면 a + b, 빼기면 a − b */
  answer: number;
  choices: number[];
  /** 도전 판(오늘의 놀이 마지막 판) — withChallenge */
  challenge?: boolean;
}

export interface SortRound {
  by: "color" | "size";
  /** 고를 것 — 색이면 SHAPE_COLORS 값, 크기면 "big" · "small" */
  target: string;
  cards: ShapeCard[];
  /** 골라야 하는 카드 key 들 */
  answers: string[];
}

// ── 업체 유아 단계 놀이(2026-10-28) ──

export interface CountUpRound {
  n: number;
  thing: string;
  /** 무리 지어 놓기(섞인 판) — 아니면 한 줄 */
  group: boolean;
  /** 숫자 카드 둘 — 정답과 바로 옆 수, 작은 수가 왼쪽 */
  choices: number[];
}

export interface MatchRound {
  by: "same" | "number";
  /** 위 줄 — 물건 id 또는 숫자("3"). 짝은 같은 열쇠끼리 */
  top: string[];
  /** 아래 줄 — 첫 판은 위와 같은 차례(선이 곧게), 다음 판부터 섞인다 */
  bottom: string[];
}

export interface FarmRound {
  n: number;
  /** 헛간에 들어가는 동물(물건 id) */
  animal: string;
  /** 카드 둘 — 정답과 바로 옆 수(0 이면 빈 카드), 작은 수가 왼쪽 */
  choices: number[];
}

export interface TallyBoard {
  /** 판의 칸 — 작은 수부터 */
  nums: number[];
  /** 오른쪽에 나오는 숫자 타일 차례 — 셋씩 묶어 그 안에서만 섞는다(거의 작은 수부터) */
  queue: number[];
}

export interface PairCard extends ShapeCard {
  /** 판 안 자리(%) */
  x: number;
  y: number;
}

export interface ShapePairRound {
  cards: PairCard[];
}

export interface DiceRound {
  n: number;
  /** 주사위 눈 보기 */
  choices: number[];
}

export interface ShopRound {
  /** 이름으로 하나(n = 1, 선반엔 서로 다른 물건 셋) — 아니면 수만큼 */
  named: boolean;
  n: number;
  /** 손님이 달라는 물건 */
  thing: string;
  /** 선반의 다른 물건 — 헷갈리게 두어 개 */
  other: string;
  /** 선반 — 달라는 물건은 n 보다 넉넉히 */
  shelf: string[];
  /** 손님 숫자 친구 — 달라는 수와 같은 친구 */
  friend: number;
}

export interface NumberLineRound {
  /** 수직선에 미리 놓인 블록 */
  a: number;
  /** 더 놓아야 할 블록 — 막대 보기(1~4) 중 하나 */
  b: number;
  bars: number[];
}

/** 수직선 밝히기 수직선 끝 — 0 부터 10 까지 */
export const LINE_END = 10;

export type BuiltActivity =
  | { kind: "meet"; n: number }
  | { kind: "count"; rounds: ThingRound[] }
  | { kind: "how-many"; rounds: ThingRound[] }
  | { kind: "find-num"; rounds: NumRound[] }
  | { kind: "build"; rounds: { n: number }[] }
  | { kind: "trace"; digits: number[] }
  | { kind: "clap"; rounds: { n: number }[] }
  | { kind: "compare"; rounds: CompareRound[] }
  | { kind: "next-num"; rounds: SeqRound[] }
  | { kind: "shape"; rounds: ShapeRound[] }
  | { kind: "pattern"; rounds: PatternRound[] }
  | { kind: "join"; rounds: JoinRound[] }
  | { kind: "size"; rounds: SizeRound[] }
  | { kind: "add"; rounds: ArithRound[] }
  | { kind: "subtract"; rounds: ArithRound[] }
  | { kind: "sort"; rounds: SortRound[] }
  | { kind: "count-up"; rounds: CountUpRound[] }
  | { kind: "match"; rounds: MatchRound[] }
  | { kind: "farm"; rounds: FarmRound[] }
  | { kind: "tally"; board: TallyBoard }
  | { kind: "shape-pair"; rounds: ShapePairRound[] }
  | { kind: "dice"; rounds: DiceRound[] }
  | { kind: "shop"; rounds: ShopRound[] }
  | { kind: "number-line"; rounds: NumberLineRound[] };

/** 점수를 세는 놀이인지 — 도장 놀이 날에는 이것만 나온다 */
export function isScored(kind: ActivitySpec["kind"]): boolean {
  return kind !== "meet" && kind !== "trace";
}

function clampRange([a, b]: NumRange): [number, number] {
  const lo = Math.max(1, Math.min(a, b));
  const hi = Math.min(MAX_NUMBER, Math.max(a, b));
  return [lo, hi];
}

/** 판마다 쓸 수 — 범위를 한 바퀴씩 섞어서 돌리고, 같은 수가 연달아 나오지 않게 */
export function numbersFor(r: NumRange, count: number, rng: Rng): number[] {
  const [lo, hi] = clampRange(r);
  const pool = range(lo, hi);
  const out: number[] = [];
  while (out.length < count) {
    let lap = shuffle(pool, rng);
    if (pool.length > 1 && lap[0] === out[out.length - 1]) lap = [...lap.slice(1), lap[0]];
    out.push(...lap);
  }
  return out.slice(0, count);
}

/** 숫자 보기 — 정답 + 범위 안의 다른 수(가까운 수 먼저). 범위가 좁으면 있는 만큼 */
export function numberChoices(target: number, r: NumRange, count: number, rng: Rng): number[] {
  const [lo, hi] = clampRange(r);
  const others = shuffle(
    range(lo, hi).filter((x) => x !== target),
    rng,
  ).sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
  // 가까운 수를 하나는 꼭 넣고, 나머지는 섞는다 — 늘 바로 옆 수만 나오면 너무 쉽게 외운다
  const near = others.slice(0, 1);
  const rest = shuffle(others.slice(1), rng).slice(0, Math.max(0, count - 2));
  return shuffle([target, ...near, ...rest], rng);
}

/** n 개 물건 자리 — 칸을 나눠 겹치지 않게 */
export function spotsFor(n: number, rng: Rng): Spot[] {
  const cols = n <= 3 ? n : n <= 4 ? 2 : n <= 6 ? 3 : n <= 8 ? 4 : 5;
  const rows = Math.ceil(n / cols);
  const cells = shuffle(
    range(0, cols * rows - 1),
    rng,
  ).slice(0, n);
  return cells.map((cell) => {
    const c = cell % cols;
    const row = Math.floor(cell / cols);
    const jx = (rng() - 0.5) * 0.35;
    const jy = (rng() - 0.5) * 0.35;
    return {
      x: Math.min(92, Math.max(8, ((c + 0.5 + jx) / cols) * 100)),
      y: Math.min(90, Math.max(10, ((row + 0.5 + jy) / rows) * 100)),
      tilt: Math.round((rng() - 0.5) * 24),
    };
  });
}

/** 목록을 한 바퀴씩 섞어 가며 count 개 — 판마다 고루 나오게 */
function cycle<T>(items: readonly T[], count: number, rng: Rng): T[] {
  const out: T[] = [];
  while (out.length < count) out.push(...shuffle(items, rng));
  return out.slice(0, count);
}

/** 판마다 다른 물건 */
function thingsFor(count: number, rng: Rng): string[] {
  return cycle(
    THINGS.map((t) => t.id),
    count,
    rng,
  );
}

function compareRounds(spec: Extract<ActivitySpec, { kind: "compare" }>, rng: Rng): CompareRound[] {
  const [lo, hi] = clampRange(spec.range);
  const things = thingsFor(spec.rounds, rng);
  return things.map((thing, i) => {
    const a = lo + Math.floor(rng() * (hi - lo + 1));
    let b = lo + Math.floor(rng() * (hi - lo));
    if (b >= a) b += 1;
    // 범위가 한 수뿐이면 비교할 수 없다 — 이웃 수로
    if (hi === lo) b = Math.min(MAX_NUMBER, a + 1);
    const ask = spec.ask === "mix" ? (i % 2 === 0 ? "more" : "fewer") : spec.ask;
    return { left: a, right: b, thing, ask, show: spec.show ?? "things", leftSpots: spotsFor(a, rng), rightSpots: spotsFor(b, rng) };
  });
}

function seqRounds(spec: Extract<ActivitySpec, { kind: "next-num" }>, rng: Rng): SeqRound[] {
  const [lo, hi] = clampRange(spec.range);
  const len = Math.min(3, Math.max(1, hi - lo));
  // 보여 줄 첫 수 — 정답(첫 수 + len)이 범위 안에 들도록
  const starts = range(lo, Math.max(lo, hi - len));
  const picks = numbersFor([starts[0], starts[starts.length - 1]], spec.rounds, rng);
  return picks.map((s) => {
    const seq = range(s, s + len - 1);
    const answer = s + len;
    return { seq, answer, choices: numberChoices(answer, [lo, Math.max(hi, answer)], 3, rng) };
  });
}

/** 모양 이름부터 익힐 때(vary false) — 모든 카드가 같은 색·같은 크기·반듯하게. 색으로 맞히지 않고 모양만 보게 */
const PLAIN_SHAPE = { color: "#4fa8e6", scale: 0.9, rot: 0 } as const;

function shapeRounds(spec: Extract<ActivitySpec, { kind: "shape" }>, rng: Rng): ShapeRound[] {
  const all = SHAPES.map((s) => s.id);
  const vary = spec.vary ?? true;
  const targets: ShapeId[] = [];
  while (targets.length < spec.rounds) targets.push(...shuffle(spec.shapes, rng));
  return targets.slice(0, spec.rounds).map((target, i) => {
    const others = shuffle(
      all.filter((s) => s !== target),
      rng,
    ).slice(0, 2);
    const cards = shuffle([target, ...others], rng).map((shape, k) => ({
      key: `${i}-${k}`,
      shape,
      ...(vary
        ? { color: pickOne(SHAPE_COLORS, rng), scale: 0.7 + rng() * 0.35, rot: shape === "circle" ? 0 : Math.round((rng() - 0.5) * 50) }
        : PLAIN_SHAPE),
    }));
    return { target, choices: cards };
  });
}

/** 크기 비교 — 같은 모양 둘, 크기 차이는 또렷하게(1 : 0.55 안팎). 색은 달라도 된다(크기만 본다) */
function sizeRounds(spec: Extract<ActivitySpec, { kind: "size" }>, rng: Rng): SizeRound[] {
  return range(0, spec.rounds - 1).map((i) => {
    const shape = pickOne(SHAPES, rng).id;
    const ask = spec.ask === "mix" ? (i % 2 === 0 ? "bigger" : "smaller") : spec.ask;
    const big = { color: pickOne(SHAPE_COLORS, rng), scale: 0.95 + rng() * 0.05 };
    const small = { color: pickOne(SHAPE_COLORS, rng), scale: 0.5 + rng() * 0.1 };
    return rng() < 0.5 ? { shape, ask, left: big, right: small } : { shape, ask, left: small, right: big };
  });
}

/** 더하기·빼기 — 짝을 고루 돌린다. 범위는 ARITH_MAX 까지(묻는 말을 그만큼만 굽는다) */
function arithRounds(spec: Extract<ActivitySpec, { kind: "add" | "subtract" }>, rng: Rng): ArithRound[] {
  const max = Math.max(2, Math.min(ARITH_MAX, spec.max));
  const add = spec.kind === "add";
  return cycle(add ? addPairs(max) : subtractPairs(max), spec.rounds, rng).map(([a, b]) => {
    const answer = add ? a + b : a - b;
    return { a, b, answer, choices: numberChoices(answer, [1, max], 3, rng) };
  });
}

/** 모양 나누기 — 카드 6장 중 2~4장이 고를 것. 색으로 나눌 땐 크기가, 크기로 나눌 땐 색이 섞여 있다(한 가지만 보고 나누기) */
function sortRounds(spec: Extract<ActivitySpec, { kind: "sort" }>, rng: Rng): SortRound[] {
  const TOTAL = 6;
  return range(0, spec.rounds - 1).map((i) => {
    const by = spec.by === "mix" ? (i % 2 === 0 ? "color" : "size") : spec.by;
    const hits = 2 + Math.floor(rng() * 3);
    const isHit = shuffle(
      range(0, TOTAL - 1).map((k) => k < hits),
      rng,
    );
    let target: string;
    let other: string;
    if (by === "color") {
      // 색 바퀴에서 두 칸 이상 떨어진 색끼리 — 빨강·주황처럼 헷갈리는 짝은 안 나온다
      const t = Math.floor(rng() * SHAPE_COLORS.length);
      target = SHAPE_COLORS[t];
      other = SHAPE_COLORS[(t + 2 + Math.floor(rng() * 3)) % SHAPE_COLORS.length];
    } else {
      target = rng() < 0.5 ? "big" : "small";
      other = target === "big" ? "small" : "big";
    }
    const cards = isHit.map((hit, k) => {
      const shape = pickOne(SHAPES, rng).id;
      const mark = hit ? target : other;
      return {
        key: `${i}-${k}`,
        shape,
        color: by === "color" ? mark : pickOne(SHAPE_COLORS, rng),
        scale: by === "size" ? (mark === "big" ? 1 : 0.5) : 0.65 + rng() * 0.3,
        rot: shape === "circle" ? 0 : Math.round((rng() - 0.5) * 30),
      };
    });
    return { by, target, cards, answers: cards.filter((_, k) => isHit[k]).map((c) => c.key) };
  });
}

function patternRounds(spec: Extract<ActivitySpec, { kind: "pattern" }>, rng: Rng): PatternRound[] {
  const unit = spec.level === "ab" ? [0, 1] : spec.level === "aab" ? [0, 0, 1] : [0, 1, 2];
  const kinds = Math.max(...unit) + 1;
  return range(1, spec.rounds).map(() => {
    const picked = shuffle(
      THINGS.map((t) => t.id),
      rng,
    ).slice(0, kinds + 1);
    const used = picked.slice(0, kinds);
    const extra = picked[kinds];
    // 규칙 두 번 + 조금 — 물음표 자리는 규칙 한 바퀴 안의 아무 곳이나
    const shown = unit.length * 2 + Math.floor(rng() * unit.length);
    const full = range(0, shown).map((i) => used[unit[i % unit.length]]);
    const answer = full[shown];
    const choices = shuffle([...new Set([answer, ...used, extra])], rng).slice(0, 3);
    if (!choices.includes(answer)) choices[0] = answer;
    return { seq: full.slice(0, shown), answer, choices: shuffle(choices, rng) };
  });
}

function joinRounds(spec: Extract<ActivitySpec, { kind: "join" }>, rng: Rng): JoinRound[] {
  const max = Math.max(2, Math.min(MAX_NUMBER, spec.max));
  return range(1, spec.rounds).map(() => {
    const a = 1 + Math.floor(rng() * (max - 1));
    const b = 1 + Math.floor(rng() * (max - a));
    return { a, b, choices: numberChoices(a + b, [1, max], 3, rng) };
  });
}

/** 바로 옆 수 하나 — lo 아래로는 lo − 1 까지(0 은 빈 카드로 쓰는 놀이만), hi 위로는 안 간다(아직 안 배운 수) */
function neighbor(n: number, lo: number, hi: number, rng: Rng): number {
  const cands = [n - 1, n + 1].filter((x) => x >= lo && x <= hi);
  return cands.length ? pickOne(cands, rng) : n + 1;
}

/** 수 세기 기초 — 작은 수부터 하나씩 늘어난다(업체 판 차례 그대로) */
function countUpRounds(spec: Extract<ActivitySpec, { kind: "count-up" }>, rng: Rng): CountUpRound[] {
  const [lo, hi] = clampRange(spec.range);
  const mix = !!spec.mix;
  // 섞인 판은 다섯 판까지(업체 한 놀이 다섯 문제) — 범위를 섞어서
  const nums = mix ? shuffle(range(lo, hi), rng).slice(0, 5) : range(lo, hi);
  const things = thingsFor(nums.length, rng);
  return nums.map((n, i) => ({ n, thing: things[i], group: mix, choices: [n, neighbor(n, Math.max(1, lo - 1), hi, rng)].sort((a, b) => a - b) }));
}

/** 짝 연결하기 — 같은 물건 넷, 또는 숫자 넷(범위가 좁으면 있는 만큼) */
function matchRounds(spec: Extract<ActivitySpec, { kind: "match" }>, rng: Rng): MatchRound[] {
  return range(0, spec.rounds - 1).map((i) => {
    let top: string[];
    if (spec.by === "same") {
      top = shuffle(
        THINGS.map((t) => t.id),
        rng,
      ).slice(0, 4);
    } else {
      const [lo, hi] = clampRange(spec.nums ?? [1, 5]);
      top = shuffle(range(lo, hi), rng)
        .slice(0, 4)
        .map(String);
    }
    let bottom = i === 0 ? [...top] : shuffle(top, rng);
    // 섞은 판인데 차례가 그대로면 한 칸 돌린다 — 선이 엇갈려야 잘 보고 잇는다
    if (i > 0 && bottom.every((k, j) => k === top[j])) bottom = [...bottom.slice(1), bottom[0]];
    return { by: spec.by, top, bottom };
  });
}

/** 작은 농장 동물 — 판마다 바뀐다(업체 농장처럼 양·소·돼지·닭, 2026-10-29). 그림은 curriculum/things */
export const FARM_ANIMALS = ["sheep", "cow", "pig", "chick"] as const;

/** 작은 농장 — 헛간에 들어가는 동물 수. 카드 둘 중 하나는 0(빈 헛간)일 수도 있다 */
function farmRounds(spec: Extract<ActivitySpec, { kind: "farm" }>, rng: Rng): FarmRound[] {
  const [lo, hi] = clampRange(spec.range);
  const animals = cycle([...FARM_ANIMALS], spec.rounds, rng);
  return numbersFor([lo, hi], spec.rounds, rng).map((n, i) => ({ n, animal: animals[i], choices: [n, neighbor(n, 0, hi, rng)].sort((a, b) => a - b) }));
}

/** 숫자 퍼즐 — 칸은 작은 수부터, 타일은 셋씩 묶어 그 안에서만 섞는다(4살이 처음부터 끝까지 헤매지 않게) */
function tallyBoard(spec: Extract<ActivitySpec, { kind: "tally" }>, rng: Rng): TallyBoard {
  const [lo, hi] = clampRange(spec.range);
  const nums = range(lo, hi);
  const queue: number[] = [];
  for (let i = 0; i < nums.length; i += 3) queue.push(...shuffle(nums.slice(i, i + 3), rng));
  return { nums, queue };
}

/** 도형 맞추기 — 첫 판은 두 짝, 다음 판부터 세 짝. 짝끼리 크기가 또렷이 다르고 색·돌림도 다를 수 있다(A5) */
function shapePairRounds(spec: Extract<ActivitySpec, { kind: "shape-pair" }>, rng: Rng): ShapePairRound[] {
  return range(0, spec.rounds - 1).map((i) => {
    const shapes = shuffle(
      SHAPES.map((s) => s.id),
      rng,
    ).slice(0, i === 0 ? 2 : 3);
    const cards = shuffle(
      shapes.flatMap((shape) =>
        [0.95, 0.55 + rng() * 0.1].map((scale) => ({ shape, color: pickOne(SHAPE_COLORS, rng), scale, rot: shape === "circle" ? 0 : Math.round((rng() - 0.5) * 40) })),
      ),
      rng,
    );
    const spots = spotsFor(cards.length, rng);
    return { cards: cards.map((c, k) => ({ ...c, key: `${i}-${k}`, x: spots[k].x, y: spots[k].y })) };
  });
}

/** 주사위 찾기 — 작은 수부터 차례로, 주사위는 6까지. 보기는 셋(아는 수가 적으면 셋까지는 보여 준다) */
function diceRounds(spec: Extract<ActivitySpec, { kind: "dice" }>, rng: Rng): DiceRound[] {
  const [lo, hi] = clampRange(spec.range);
  const top = Math.min(6, hi);
  return range(Math.min(lo, top), top).map((n) => ({ n, choices: numberChoices(n, [1, Math.min(6, Math.max(3, top))], 3, rng) }));
}

/** 가게 놀이 — 셀 때 "개"로 세는 물건만(병아리·물고기를 사고팔지는 않는다) */
function shopRounds(spec: Extract<ActivitySpec, { kind: "shop" }>, rng: Rng): ShopRound[] {
  const goods = THINGS.filter((t) => t.unit === "개").map((t) => t.id);
  const nums = numbersFor(spec.range, spec.rounds, rng);
  const picks = cycle(goods, spec.rounds, rng);
  return nums.map((n, i) => {
    const thing = picks[i];
    if (spec.ask === "name") {
      // 이름으로 하나 — 선반엔 서로 다른 물건 셋, 손님은 범위 안 숫자 친구
      const others = shuffle(
        goods.filter((g) => g !== thing),
        rng,
      ).slice(0, 2);
      return { named: true, n: 1, thing, other: others[0], shelf: shuffle([thing, ...others], rng), friend: n };
    }
    const other = pickOne(
      goods.filter((g) => g !== thing),
      rng,
    );
    const extra = n <= 3 ? 1 : 2;
    const shelf = shuffle([...Array<string>(n + extra).fill(thing), other, other], rng);
    return { named: false, n, thing, other, shelf, friend: n };
  });
}

/** 수직선 밝히기 — 더할 블록은 막대 보기(1~4) 안에서, 합은 max(10 까지) 이하 */
function numberLineRounds(spec: Extract<ActivitySpec, { kind: "number-line" }>, rng: Rng): NumberLineRound[] {
  const max = Math.max(2, Math.min(LINE_END, spec.max));
  const pairs = addPairs(max).filter(([, b]) => b <= 4);
  return cycle(pairs, spec.rounds, rng).map(([a, b]) => ({ a, b, bars: shuffle([1, 2, 3, 4], rng) }));
}

export function buildActivity(spec: ActivitySpec, rng: Rng): BuiltActivity {
  switch (spec.kind) {
    case "meet":
      return { kind: "meet", n: spec.n };
    case "count":
    case "how-many": {
      const nums = numbersFor(spec.range, spec.rounds, rng);
      const things = thingsFor(spec.rounds, rng);
      return { kind: spec.kind, rounds: nums.map((n, i) => ({ n, thing: things[i], spots: spotsFor(n, rng), choices: numberChoices(n, spec.range, 3, rng) })) };
    }
    case "find-num":
      return { kind: "find-num", rounds: numbersFor(spec.range, spec.rounds, rng).map((n) => ({ n, choices: numberChoices(n, spec.range, 3, rng) })) };
    case "build":
      return { kind: "build", rounds: numbersFor(spec.range, spec.rounds, rng).map((n) => ({ n })) };
    case "trace":
      return { kind: "trace", digits: [...spec.digits] };
    case "clap":
      return { kind: "clap", rounds: numbersFor(spec.range, spec.rounds, rng).map((n) => ({ n })) };
    case "compare":
      return { kind: "compare", rounds: compareRounds(spec, rng) };
    case "next-num":
      return { kind: "next-num", rounds: seqRounds(spec, rng) };
    case "shape":
      return { kind: "shape", rounds: shapeRounds(spec, rng) };
    case "pattern":
      return { kind: "pattern", rounds: patternRounds(spec, rng) };
    case "join":
      return { kind: "join", rounds: joinRounds(spec, rng) };
    case "size":
      return { kind: "size", rounds: sizeRounds(spec, rng) };
    case "add":
      return { kind: "add", rounds: arithRounds(spec, rng) };
    case "subtract":
      return { kind: "subtract", rounds: arithRounds(spec, rng) };
    case "sort":
      return { kind: "sort", rounds: sortRounds(spec, rng) };
    case "count-up":
      return { kind: "count-up", rounds: countUpRounds(spec, rng) };
    case "match":
      return { kind: "match", rounds: matchRounds(spec, rng) };
    case "farm":
      return { kind: "farm", rounds: farmRounds(spec, rng) };
    case "tally":
      return { kind: "tally", board: tallyBoard(spec, rng) };
    case "shape-pair":
      return { kind: "shape-pair", rounds: shapePairRounds(spec, rng) };
    case "dice":
      return { kind: "dice", rounds: diceRounds(spec, rng) };
    case "shop":
      return { kind: "shop", rounds: shopRounds(spec, rng) };
    case "number-line":
      return { kind: "number-line", rounds: numberLineRounds(spec, rng) };
  }
}

/** 마지막 판만 바꿔 끼운다 */
function lastAs<R>(rounds: readonly R[], make: (last: R) => R): R[] {
  const last = rounds[rounds.length - 1];
  return last === undefined ? [...rounds] : [...rounds.slice(0, -1), make(last)];
}

/**
 * 도전 판 — 오늘의 놀이(도장 날 말고)에서 수를 다루는 놀이의 마지막 판을 한 단계 어렵게(2026-10-28 사용자: 하루하루 난이도가 오르는 느낌).
 * 범위 밖 수는 쓰지 않는다 — 그 범위의 가장 큰 수, 가장 헷갈리는 짝(바로 옆 수), 보기 하나 더. 처음에 맞히면 블록 1개 더(lib/progress).
 * 모양·규칙·크기·나누기와 블록 쌓기·손뼉·쓰기·만나기는 그대로.
 */
export function withChallenge(spec: ActivitySpec, built: BuiltActivity, rng: Rng): BuiltActivity {
  if ((built.kind === "count" || built.kind === "how-many") && "range" in spec) {
    const [, hi] = clampRange(spec.range);
    return { ...built, rounds: lastAs(built.rounds, (r) => ({ ...r, n: hi, spots: spotsFor(hi, rng), choices: numberChoices(hi, spec.range, 3, rng), challenge: true })) };
  }
  if (built.kind === "find-num" && "range" in spec) {
    const [, hi] = clampRange(spec.range);
    return { ...built, rounds: lastAs(built.rounds, () => ({ n: hi, choices: numberChoices(hi, spec.range, 4, rng), challenge: true })) };
  }
  if (built.kind === "compare" && spec.kind === "compare") {
    const [lo, hi] = clampRange(spec.range);
    if (hi - lo < 1) return built;
    // 바로 옆 수끼리 — 눈으로 언뜻 봐서는 모른다, 세어 봐야 한다
    const [left, right] = rng() < 0.5 ? [hi, hi - 1] : [hi - 1, hi];
    return { ...built, rounds: lastAs(built.rounds, (r) => ({ ...r, left, right, leftSpots: spotsFor(left, rng), rightSpots: spotsFor(right, rng), challenge: true })) };
  }
  if (built.kind === "next-num" && spec.kind === "next-num") {
    const [lo, hi] = clampRange(spec.range);
    return {
      ...built,
      rounds: lastAs(built.rounds, (r) => {
        const start = hi - r.seq.length;
        if (start < lo) return r;
        return { seq: range(start, hi - 1), answer: hi, choices: numberChoices(hi, [lo, hi], 3, rng), challenge: true };
      }),
    };
  }
  if (built.kind === "join" && spec.kind === "join") {
    const max = Math.max(2, Math.min(MAX_NUMBER, spec.max));
    const a = 1 + Math.floor(rng() * (max - 1));
    return { ...built, rounds: lastAs(built.rounds, () => ({ a, b: max - a, choices: numberChoices(max, [1, max], 3, rng), challenge: true })) };
  }
  if ((built.kind === "add" || built.kind === "subtract") && (spec.kind === "add" || spec.kind === "subtract")) {
    const max = Math.max(2, Math.min(ARITH_MAX, spec.max));
    const k = 1 + Math.floor(rng() * (max - 1));
    // 더하기는 합이 가장 큰 수, 빼기는 가장 큰 수에서 빼기
    const [a, b, answer] = built.kind === "add" ? [k, max - k, max] : [max, k, max - k];
    return { ...built, rounds: lastAs(built.rounds, () => ({ a, b, answer, choices: numberChoices(answer, [1, max], 3, rng), challenge: true })) };
  }
  return built;
}

/** 하루치 놀이 — 도장 놀이 날(형성 평가)은 그대로 재고, 다른 날은 마지막 판이 도전 판 */
export function buildSession(plan: DayPlan, rng: Rng): BuiltActivity[] {
  return plan.activities.map((a) => {
    const built = buildActivity(a, rng);
    return plan.stamp ? built : withChallenge(a, built, rng);
  });
}
