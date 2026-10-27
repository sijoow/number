/**
 * 숫자 친구들 — 넘버블럭스 친구들(2026-10-27 사용자: 이번엔 그림을 넘버블럭스로, 집에서만 쓰는 앱).
 * 친구 하나 = 그 숫자만큼 블록이라서 친구 자체가 세기 교구다("셋" = 블록 셋).
 *
 * 두 가지 모습(2026-10-27 사용자 결정):
 *   대표 모습(shape)  refs/인물구성도.jpg 처럼 — 4 는 2×2 네모, 6 은 2×3 주사위, 8 은 2×4, 9 는 3×3, 나머지는 한 줄 기둥
 *   기둥 모습(tower)  refs/인물구성2.jpg 처럼 — 모두 한 줄. 블록 쌓기·모아 보기·친구 앨범 「변신」에서 곳곳에 쓴다
 * 그림은 "friend:<n>"(대표) · "friend:<n>:tower"(기둥, 4·6·8·9 만 따로) — 없으면 흰 블록으로 같은 배치의 임시 그림.
 *
 * 이름은 공식 한국어판·카드 소개처럼 한자어 일·이·삼(2026-10-27 사용자 결정, docs/numberblocks-style.md 5·7절) — "안녕! 나는 삼이야."
 * 셀 때는 그대로 하나·둘·셋(curriculum/numbers).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { MAX_NUMBER, range, sinoOf } from "./numbers.ts";

export type FriendForm = "shape" | "tower";

export interface Friend {
  n: number;
  /** 부르는 이름 */
  name: string;
  /** 대표 모습의 블록 열 수 — 1 이면 기둥이 곧 대표 모습 */
  cols: number;
  /** 그림 프롬프트용 생김새 — refs 인물구성도를 보고 채운다(지어내지 않는다) */
  look: string;
  /** 성격 소개 한 줄(아이에게 들려주는 말) */
  intro: string;
}

/**
 * 대표 모습 — 가로 블록 수. 1~10 은 인물구성도, 11~20 은 카드 소개(refs/card-intro)의 모습에 가깝게
 * (15 의 계단 모양처럼 네모가 아닌 친구는 임시 그림만 네모로 — 생성 그림은 카드 모습대로)
 */
const SHAPE_COLS: Record<number, number> = { 4: 2, 6: 2, 8: 2, 9: 3, 11: 2, 12: 3, 13: 2, 14: 2, 15: 5, 16: 4, 17: 2, 18: 2, 19: 2, 20: 2 };
/** 기둥 모습(변신)은 열까지만 — 11~20 은 한 줄로 세우면 너무 길다 */
const TOWER_MAX = 10;

/**
 * 생김새 — docs/numberblocks-style.md(공식·팬 자료 조사 + 인물구성도 확대 관찰, 2026-10-27). 색값은 인물구성2 에서 뽑은 근사값.
 * 블록 배치(네모·기둥)는 여기 넣지 않는다 — 그림 프롬프트가 모습(shape/tower)마다 따로 붙인다(scripts/image-prompts).
 */
const LOOK: Record<number, string> = {
  1: "bright red (#D30C18) cube character with one single big round eye in the middle and a small smile; thin dark red arms and short legs",
  2: "orange (#FE9329) character with round purple glasses and sparkly dance shoes; thin darker orange arms and short legs",
  3: "bright yellow (#E1CE12) character wearing a red three-pointed hat, three small red buttons on the middle cube, orange-rimmed eyes",
  4: "bright green (#41D100) character with square eyes and four little square eyebrows",
  5: "cyan-blue (#2DBDD8) character with one star-shaped eye (its right eye) and a big navy-blue five-finger glove on its left hand",
  6: "indigo-purple (#5729BF) character with white dice dots on its cubes, eyes with three eyelashes each",
  7: "rainbow character: cubes from the bottom up are red, orange, yellow, green, sky blue, indigo, and a violet head cube, with rainbow-coloured stripes sticking up on top of its head and yellow-rimmed eyes",
  8: "pink-magenta (#EB28A0) octopus-like character with eight tentacles (six arms and two legs) and a purple figure-eight shaped eye mask",
  9: "grey character in three shades of grey (darkest row on top, lightest at the bottom) with bold square eyes and long eyebrows, no glasses",
  10: "white character with red edges on every cube, red star-shaped eyes and white five-finger gloves",
  // 11~20 — 카드 소개(refs/card-intro) 그림을 보고 쓴 것. 십(흰 몸 + 빨간 모서리) 위·옆에 그 수의 색 블록이 붙는다
  11: "footballer: ten white cubes with red edges plus one red cube, football boots, sporty and cheerful",
  12: "super rectangle: white cubes with red edges with two orange cubes in the top middle, round glasses",
  13: "mischievous joker: ten white red-edged cubes plus three yellow cubes on the top side, playful purple eyes",
  14: "skater: ten white red-edged cubes with four green cubes on top, rainbow eyebrows, rides a double rainbow skateboard",
  15: "secret agent: a staircase shape of white red-edged cubes (1, 2, 3, 4, 5 cubes per step) with a light blue column at the tall end, dark mask",
  16: "party host: a 4 by 4 square of white red-edged cubes with an indigo bottom row, square eyes",
  17: "artist: ten white red-edged cubes with seven rainbow cubes along the top, paint splotches on its body",
  18: "super rectangle: white red-edged cubes with eight magenta cubes on one side, fast and energetic",
  19: "shape maker: a column of ten white red-edged cubes beside a column of nine grey cubes",
  20: "dancer: two columns of ten pale yellow cubes side by side, a purple top hat and a bow tie, round glasses",
};

/**
 * 성격 소개 한 줄 — 사용자가 찾은 넘버블록 카드 소개(refs/card-intro, 2026-10-27)의 성격을 4살 눈높이로 줄여 쓴 것.
 * 이름을 넣지 않아서 친구 이름을 바꿔도 그대로 쓴다. 숫자 친구 만나기·친구 앨범에서 인사 다음에 들려준다.
 */
const INTRO: Record<number, string> = {
  1: "나는 제일 작지만 용감해! 뭐든 제일 먼저 해 볼래.",
  2: "나는 짝꿍이 좋아! 둘이서 신나게 춤추자!",
  3: "나는 재주꾼이야! 하나, 둘, 셋, 나를 봐!",
  4: "나는 바위처럼 단단한 네모야! 도움이 필요하면 불러 줘.",
  5: "하이파이브! 손가락 다섯 개를 활짝 펴 볼까?",
  6: "나는 주사위 놀이가 좋아! 같이 굴려 볼래?",
  7: "나는 행운을 가져다줘! 무지개처럼 일곱 가지 색이야.",
  8: "나는 슈퍼 히어로 옥토블록! 팔이 여덟 개야!",
  9: "나는 커다란 네모야! 에취! 재채기하면 가운데 블록이 쏙!",
  10: "나는 로켓으로 변신해! 열, 아홉, 여덟, 발사!",
  11: "나는 축구가 제일 좋아! 같이 공 차자!",
  12: "나는 멋진 직사각형이야! 여러 모양으로 변신해!",
  13: "나는 장난꾸러기야! 같이 웃어 볼래?",
  14: "나는 스케이트보드를 타! 씽씽!",
  15: "나는 계단 모양 비밀요원! 쉿!",
  16: "나는 파티가 좋아! 신나게 놀자!",
  17: "나는 그림 그리기가 좋아! 너를 그려 줄까?",
  18: "나는 엄청 빨라! 빨리빨리 놀자!",
  19: "나는 신기한 모양을 만들어! 깜짝 놀랄걸?",
  20: "나는 춤추는 게 좋아! 같이 춤출래?",
};

export const FRIENDS: readonly Friend[] = range(1, MAX_NUMBER).map((n) => ({ n, name: sinoOf(n), cols: SHAPE_COLS[n] ?? 1, look: LOOK[n] ?? "", intro: INTRO[n] ?? "" }));

export function friendOf(n: number): Friend | undefined {
  return FRIENDS.find((f) => f.n === n);
}

/** 기둥 모습이 대표 모습과 다른 친구(4·6·8·9) — 「변신」할 수 있다 */
export function hasTowerForm(n: number): boolean {
  return n <= TOWER_MAX && (friendOf(n)?.cols ?? 1) > 1;
}

/** 그 모습의 블록 배치 — 열 수(가로)와 한 열의 블록 수(세로) */
export function layoutOf(n: number, form: FriendForm): { cols: number; rows: number } {
  const cols = form === "tower" ? 1 : (friendOf(n)?.cols ?? 1);
  return { cols, rows: Math.ceil(n / cols) };
}

/** 안내 친구 — 인사하고 놀이를 알려 준다. 인물구성도를 보고 바꿀 수 있다(지금은 하나) */
export const GUIDE_FRIEND = 1;

/**
 * 블록 색 — 블록 친구 만들기(숫자 놀이)에서 칸을 채우는 블록(1~10, 인물구성도에서 본 색). 줄마다 다른 친구는 아래 줄부터:
 *   7 은 빨강→보라 무지개, 9 는 연한 회색→짙은 회색, 10 은 흰 블록에 빨간 테두리.
 */
export function blockColor(n: number, row: number): { fill: string; edge?: string } {
  const rainbow = ["#e84a3f", "#f39a2b", "#f5cd36", "#5cbf4f", "#3fb6e3", "#4c6fe0", "#9b59d0"];
  const greys = ["#c9c9cf", "#a3a3ab", "#7d7d86"];
  const one: Record<number, string> = { 1: "#e84a3f", 2: "#f39a2b", 3: "#f5cd36", 4: "#5cbf4f", 5: "#3fb6e3", 6: "#7b55d4", 8: "#e84fae" };
  if (n === 7) return { fill: rainbow[row % rainbow.length] };
  if (n === 9) return { fill: greys[Math.min(row, greys.length - 1)] };
  if (n === 10) return { fill: "#ffffff", edge: "#e84a3f" };
  return { fill: one[n] ?? "#9fd3ea" };
}
