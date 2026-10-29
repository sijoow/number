/**
 * 숫자 놀이(오리지널) 판 만들기 — 무작위는 여기서만. 수 범위는 지금 아는 가장 큰 수(top, 3 이상)까지.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { range } from "../curriculum/numbers.ts";
import type { OriginalId } from "../curriculum/originals.ts";
import { numberChoices, numbersFor, shuffle, type Rng } from "./rounds.ts";

/** 한 판 — 카드를 누를 때 한 번 섞어서 만든다(화면은 받은 판을 그대로) */
export type BuiltOriginal =
  | { id: "yut"; known: number }
  | { id: "maker"; rounds: number[] }
  | { id: "shadow"; rounds: ShadowRound[] }
  | { id: "seesaw"; rounds: SeesawRound[] }
  | { id: "share"; rounds: ShareRound[] }
  | { id: "drum"; rounds: DrumRound[]; drummer: number }
  | { id: "eggs"; rounds: EggRound[] }
  | { id: "parts"; rounds: PartsRound[] }
  | { id: "more-less"; game: MoreLessGame }
  | { id: "hide-line"; rounds: HideRound[] }
  | { id: "meal"; rounds: MealRound[] }
  | { id: "num-train"; rounds: TrainRound[] }
  | { id: "rocket"; rounds: number[] }
  | { id: "ten-frame"; rounds: TenRound[] }
  | { id: "num-board"; rounds: BoardRound[] };

export function buildOriginal(id: OriginalId, top: number, rng: Rng): BuiltOriginal {
  const known = Math.max(3, top);
  switch (id) {
    case "yut":
      // 판 규칙은 lib/yut, 주사위는 굴릴 때마다 — 여기선 고를 수 있는 친구 범위만. 십까지(2026-10-27 사용자: 캐릭터가 너무 많다)
      return { id, known: Math.min(10, known) };
    case "maker":
      return { id, rounds: makerRounds(known, 4, rng) };
    case "shadow":
      return { id, rounds: shadowRounds(known, 5, rng) };
    case "seesaw":
      return { id, rounds: seesawRounds(known, rng) };
    case "share":
      return { id, rounds: shareRounds(known, 3, rng) };
    case "drum":
      // 북 치는 친구 — 답(친 횟수)이 친구 모습으로 드러나지 않게 일(1)이 친다
      return { id, rounds: drumRounds(known, 4, rng), drummer: 1 };
    case "eggs":
      return { id, rounds: eggRounds(known, 4, rng) };
    case "parts":
      return { id, rounds: partsRounds(known, 4, rng) };
    case "more-less":
      return { id, game: moreLessGame(known, rng) };
    case "hide-line":
      return { id, rounds: hideRounds(known, rng) };
    case "meal":
      return { id, rounds: mealRounds(known, rng) };
    case "num-train":
      return { id, rounds: trainRounds(known, rng) };
    case "rocket":
      return { id, rounds: rocketRounds(known, rng) };
    case "ten-frame":
      return { id, rounds: tenRounds(known, rng) };
    case "num-board":
      return { id, rounds: boardRounds(known, rng) };
  }
}

/**
 * 블록 친구 만들기 — 블록을 채워 만들 친구(십까지, 서로 다르게, 작은 수부터). 네모 모양 친구(4·6·8·9)가 하나는 들어가게
 * (2026-10-27 사용자: 숫자 눌러 쌓기 말고 예시를 주고 블록을 채우는 형식)
 */
export function makerRounds(top: number, rounds: number, rng: Rng): number[] {
  const pool = range(1, Math.min(10, Math.max(3, top)));
  const picks = shuffle(pool, rng).slice(0, Math.min(rounds, pool.length));
  const square = shuffle(
    [4, 6, 8, 9].filter((n) => pool.includes(n)),
    rng,
  )[0];
  if (square && !picks.some((n) => [4, 6, 8, 9].includes(n))) picks[picks.length - 1] = square;
  return picks.sort((a, b) => a - b);
}

/** 그림자 친구 — 판마다 친구 하나 + 친구 보기 셋(가까운 수를 섞어서 — 모양이 비슷해야 생각한다) */
export interface ShadowRound {
  n: number;
  choices: number[];
}

export function shadowRounds(top: number, rounds: number, rng: Rng): ShadowRound[] {
  const hi = Math.max(3, top);
  return numbersFor([1, hi], rounds, rng).map((n) => ({ n, choices: numberChoices(n, [1, hi], 3, rng) }));
}

/** 시소 — 앞 두 판은 "어느 쪽이 내려갈까?", 뒤 두 판은 오른쪽에 블록을 넣어 "똑같게" */
export type SeesawRound = { mode: "guess"; left: number; right: number } | { mode: "even"; left: number };

export function seesawRounds(top: number, rng: Rng): SeesawRound[] {
  const hi = Math.min(10, Math.max(3, top));
  const guess = (): SeesawRound => {
    const [left, right] = shuffle(range(1, hi), rng);
    return { mode: "guess", left, right };
  };
  const even = (): SeesawRound => ({ mode: "even", left: 1 + Math.floor(rng() * hi) });
  return [guess(), guess(), even(), even()];
}

/** 시소 기울기(도) — 오른쪽이 무거우면 +(오른쪽이 내려감), 같으면 0 */
export function seesawTilt(left: number, right: number): number {
  return Math.max(-14, Math.min(14, (right - left) * 4));
}

/** 간식 나누기 — 친구 둘(아홉까지 알면 마지막 판은 셋)이 쿠키를 똑같이. 한 친구 몫은 1~5 */
export interface ShareRound {
  /** 나눠 받는 친구(숫자 친구 그림) */
  friends: number[];
  cookies: number;
}

export function shareRounds(top: number, rounds: number, rng: Rng): ShareRound[] {
  const known = Math.min(10, Math.max(3, top));
  return range(1, rounds).map((i) => {
    const kids = known >= 9 && i === rounds ? 3 : 2;
    const each = 1 + Math.floor(rng() * Math.min(5, Math.max(1, Math.floor(known / kids))));
    return { friends: shuffle(range(1, known), rng).slice(0, kids), cookies: kids * each };
  });
}

/** 북소리 세기 — 귀로만 세니까 여섯까지 */
export interface DrumRound {
  n: number;
  choices: number[];
}

export function drumRounds(top: number, rounds: number, rng: Rng): DrumRound[] {
  const hi = Math.min(6, Math.max(3, top));
  return numbersFor([1, hi], rounds, rng).map((n) => ({ n, choices: numberChoices(n, [1, hi], 3, rng) }));
}

// ── 선물 놀이(2026-10-29 사용자: 녹화해 온 업체 놀이를 흐름만 따라 우리 그림으로) ──

/** 알 속 숫자 — 알에 차례로 이어진 수가 적혀 있고 하나가 ?. ? 자리는 판마다 다르게(맨 끝만이 아니라). 아는 수가 셋뿐이면 알 셋 */
export interface EggRound {
  /** 알에 적힌 수(왼쪽부터 차례로) */
  nums: number[];
  /** ? 인 알의 자리 */
  gap: number;
  choices: number[];
}

export function eggRounds(top: number, rounds: number, rng: Rng): EggRound[] {
  const hi = Math.max(3, top);
  const len = Math.min(4, hi);
  const gaps = shuffle(range(0, len - 1), rng);
  return range(0, rounds - 1).map((i) => {
    const start = 1 + Math.floor(rng() * (hi - len + 1));
    const nums = range(start, start + len - 1);
    const gap = gaps[i % gaps.length];
    return { nums, gap, choices: numberChoices(nums[gap], [1, hi], 3, rng) };
  });
}

/** 몇이랑 몇? — 수가 적힌 상자(whole)에 친구 하나(have)가 들어 있다. 나머지가 될 친구(whole − have)를 보기 셋에서 골라 넣는다 */
export interface PartsRound {
  whole: number;
  have: number;
  choices: number[];
}

export function partsRounds(top: number, rounds: number, rng: Rng): PartsRound[] {
  const hi = Math.min(10, Math.max(3, top));
  return numbersFor([2, hi], rounds, rng).map((whole) => {
    const have = 1 + Math.floor(rng() * (whole - 1));
    return { whole, have, choices: numberChoices(whole - have, [1, Math.min(9, hi)], 3, rng) };
  });
}

/** 하나 더 · 하나 덜 — 블록 탑은 그대로 두고 목표 수만 바뀐다. 대개 하나씩, 가끔 둘씩 — 올라갔다 내려갔다 */
export interface MoreLessGame {
  start: number;
  targets: number[];
}

export function moreLessGame(top: number, rng: Rng): MoreLessGame {
  const hi = Math.min(10, Math.max(3, top));
  const start = 1 + Math.floor(rng() * Math.min(3, hi));
  const targets: number[] = [];
  let cur = start;
  let up = true;
  for (let i = 0; i < 5; i++) {
    const step = rng() < 0.7 ? 1 : 2;
    let next = up ? cur + step : cur - step;
    if (next > hi || next < 1) next = up ? cur - step : cur + step;
    next = Math.min(hi, Math.max(1, next));
    if (next === cur) next = cur > 1 ? cur - 1 : cur + 1;
    targets.push(next);
    cur = next;
    // 대개 방향을 바꾼다 — 더하기만, 빼기만 이어지지 않게
    if (rng() < 0.7) up = !up;
  }
  return { start, targets };
}

/** 숨은 친구 찾기 — 양 끝(0 과 끝 수)만 적힌 수직선 어딘가에 친구가 숨는다. 일곱까지 알면 뒤 두 판은 0~10 */
export interface HideRound {
  end: number;
  n: number;
}

export function hideRounds(top: number, rng: Rng): HideRound[] {
  const ends = top >= 7 ? [5, 5, 10, 10] : [5, 5, 5, 5];
  let last = 0;
  return ends.map((end) => {
    const pool = range(1, end - 1).filter((n) => n !== last);
    last = pool[Math.floor(rng() * pool.length)];
    return { end, n: last };
  });
}

/** 식사 시간 — 두 친구 접시의 먹을 것. 다섯 판 중 둘은 똑같게(업체처럼 「같아요」도 답) */
export interface MealRound {
  friends: [number, number];
  food: string;
  left: number;
  right: number;
}

const MEAL_FOODS = ["strawberry", "apple", "cookie", "banana"] as const;

export function mealRounds(top: number, rng: Rng): MealRound[] {
  const hi = Math.min(6, Math.max(3, top));
  const foods = shuffle(MEAL_FOODS, rng);
  return shuffle([true, true, false, false, false], rng).map((same, i) => {
    const left = 1 + Math.floor(rng() * hi);
    const others = range(1, hi).filter((n) => n !== left);
    const right = same ? left : others[Math.floor(rng() * others.length)];
    const [a, b] = shuffle(range(1, Math.min(10, Math.max(3, top))), rng);
    return { friends: [a, b], food: foods[i % foods.length], left, right };
  });
}

/** 숫자 열차 — 이어진 수의 친구들(셋 → 넷 → 다섯)을 작은 수부터 차례로 기차에 태운다. 승강장에는 섞여 서 있다 */
export interface TrainRound {
  /** 태울 차례(작은 수부터) */
  nums: number[];
  /** 승강장에 선 차례 */
  platform: number[];
}

export function trainRounds(top: number, rng: Rng): TrainRound[] {
  const hi = Math.min(10, Math.max(3, top));
  return [3, 4, 5].map((want) => {
    const len = Math.min(want, hi);
    const start = 1 + Math.floor(rng() * (hi - len + 1));
    const nums = range(start, start + len - 1);
    let platform = shuffle(nums, rng);
    // 이미 차례대로 서 있으면 앞 둘을 바꾼다
    if (platform.every((n, i) => n === nums[i])) platform = [platform[1], platform[0], ...platform.slice(2)];
    return { nums, platform };
  });
}

/** 로켓 발사 — 로켓에 연료 블록을 n 개 채우고 n 부터 거꾸로 세어 발사. 세 판, 작은 수부터(셋 이상, 열까지) */
export function rocketRounds(top: number, rng: Rng): number[] {
  const hi = Math.min(10, Math.max(3, top));
  return numbersFor([Math.min(3, hi), hi], 3, rng).sort((a, b) => a - b);
}

/**
 * 열 칸 채우기 — 열 칸 판(두 줄 × 다섯)에 몇 칸이 차 있고, 나머지를 채우면 십으로 변신. 열하나 넘게 알면 뒤 판은 "열하고 셋은?"
 * (열과 몇 — 십이 오고 블록 몇 개가 더 붙으면 그 친구가 된다)
 */
export type TenRound = { mode: "fill"; pre: number } | { mode: "teen"; extra: number; choices: number[] };

export function tenRounds(top: number, rng: Rng): TenRound[] {
  const teens = top >= 11 ? Math.min(9, top - 10) : 0;
  const pre = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
  if (!teens) return [pre(0, 3), pre(4, 6), pre(7, 8)].map((n) => ({ mode: "fill", pre: n }));
  return [
    { mode: "fill", pre: pre(4, 7) },
    ...numbersFor([1, teens], 3, rng).map((extra): TenRound => ({ mode: "teen", extra, choices: numberChoices(10 + extra, [10, 20], 3, rng) })),
  ];
}

/** 숫자 판 — 1~10(열하나 넘게 알면 1~20) 판에 빈칸 셋, 타일을 끌어다 넣는다. 두 판 — 첫 판 빈칸은 아는 수 안에서 */
export interface BoardRound {
  size: number;
  blanks: number[];
}

export function boardRounds(top: number, rng: Rng): BoardRound[] {
  const size = top >= 11 ? 20 : 10;
  const known = range(2, Math.min(size, Math.max(4, top)));
  return [known, range(2, size)].map((pool) => ({
    size,
    blanks: shuffle(pool, rng)
      .slice(0, 3)
      .sort((a, b) => a - b),
  }));
}
