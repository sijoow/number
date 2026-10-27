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
  | { id: "drum"; rounds: DrumRound[]; drummer: number };

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
