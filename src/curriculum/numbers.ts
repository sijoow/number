/**
 * 숫자 읽는 말 — 아이에게 들려주는 숫자 이름은 모두 여기서 만든다.
 *   셀 때·숫자 이름     하나 둘 셋 … 열 (고유어 — 4살이 집에서 세는 말)
 *   한자어              일 이 삼 … 십 (숫자 친구 만나기에서 "삼이라고도 해"로만 살짝)
 *   물건 앞에 붙을 때   한 개 · 두 개 · 세 마리 · 네 번 (매김꼴)
 * 정한 것(2026-10-27 사용자): 숫자 친구 이름은 공식 한국어판·카드처럼 한자어 "일·이·삼"(curriculum/friends),
 *   셀 때·몇 개인지·숫자 찾기는 "하나·둘·셋". 숫자 친구 만나기에서 두 읽기를 같이 들려준다("삼! 셋이라고도 해.", SAY_BOTH_IN_MEET).
 *   문장은 모두 이 함수들을 거친다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

/** 이 앱이 다루는 가장 큰 수 — 1~10 에 이어 11~20(2026-10-27 사용자: 카드 소개의 20까지 친구들). 넓히면 아래 표를 늘린다 */
export const MAX_NUMBER = 20;

const NATIVE = [
  "영", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열",
  "열하나", "열둘", "열셋", "열넷", "열다섯", "열여섯", "열일곱", "열여덟", "열아홉", "스물",
] as const;
const NATIVE_MOD = [
  "영", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열",
  "열한", "열두", "열세", "열네", "열다섯", "열여섯", "열일곱", "열여덟", "열아홉", "스무",
] as const;
const SINO = [
  "영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십",
  "십일", "십이", "십삼", "십사", "십오", "십육", "십칠", "십팔", "십구", "이십",
] as const;

/** 숫자 친구 만나기에서 숫자의 두 읽기를 같이 들려줄지 — 이름(삼)과 셀 때 말(셋) */
export const SAY_BOTH_IN_MEET = true;

function check(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > MAX_NUMBER) throw new Error(`숫자 범위 밖: ${n}`);
  return n;
}

/** 셀 때·숫자 이름 — 3 → "셋" */
export function nameOf(n: number): string {
  return NATIVE[check(n)];
}

/** 한자어 — 3 → "삼" */
export function sinoOf(n: number): string {
  return SINO[check(n)];
}

/** 물건 앞 — 3 → "세" ("세 개", "세 번") */
export function modOf(n: number): string {
  return NATIVE_MOD[check(n)];
}

/** 받침이 있나 — 조사(이야/야, 은/는, 이라고/라고)를 고를 때 */
export function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

/** "셋이야" · "하나야" */
export function isIt(word: string): string {
  return `${word}${hasBatchim(word) ? "이야" : "야"}`;
}

/** "삼이라고도" · "사라고도" */
export function alsoCalled(word: string): string {
  return `${word}${hasBatchim(word) ? "이라고도" : "라고도"}`;
}

/** 하나부터 n 까지 세는 말 — ["하나", "둘", "셋"] */
export function countUp(n: number): string[] {
  return Array.from({ length: check(n) }, (_, i) => nameOf(i + 1));
}

/** from 부터 to 까지 수 */
export function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/** 더하기·빼기는 5 이하(업체 B5·B7) — 묻는 말("둘 더하기 하나는?")을 이 범위만큼 미리 굽는다. 넓히면 음성도 다시 */
export const ARITH_MAX = 5;

/** 합이 max 이하인 더하기 짝 [a, b] (둘 다 1 이상) */
export function addPairs(max: number): [number, number][] {
  return range(1, max - 1).flatMap((a) => range(1, max - a).map((b): [number, number] => [a, b]));
}

/** 빼어지는 수가 max 이하인 빼기 짝 [a, b] — 답(a − b)은 1 이상(0 은 아직 안 배운다) */
export function subtractPairs(max: number): [number, number][] {
  return range(2, max).flatMap((a) => range(1, a - 1).map((b): [number, number] => [a, b]));
}
