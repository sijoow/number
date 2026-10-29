/**
 * 아이에게 들려주는 말 — 한곳에 모아 둔다. Typecast(수아) 음성을 미리 구울 때 이 목록을 그대로 뽑아 간다(scripts/voice-lines.mts).
 * 숫자가 들어간 말("블록을 세 개 쌓아 볼까?")은 1~20 마다 한 줄씩 굽는다 — 조합이 스무 개뿐이라 그대로 굽는 게 자연스럽다.
 * 아이 이름(curriculum/child)이 든 말은 이름을 부르는 아이 맞춤 말 — 이름을 바꾸면 다시 굽는다.
 * 칭찬·다시 하기는 한글나라와 같은 문장 — 이미 구운 음성을 그대로 빌려 쓴다(npm run voice:reuse).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { CHILD } from "./child.ts";
import { FRIENDS } from "./friends.ts";
import { addPairs, alsoCalled, ARITH_MAX, hasBatchim, isIt, MAX_NUMBER, modOf, nameOf, range, sinoOf, subtractPairs } from "./numbers.ts";
import { colorName, SHAPE_COLORS, SHAPES, shapeName, THINGS, type ShapeId, type Unit } from "./things.ts";

const { call, nick } = CHILD;

export const LINES = {
  greet: `안녕, ${call}! 오늘도 같이 숫자 놀이 하자!`,
  /** 첫 화면 안내 친구를 누르면 — 차례로 하나씩 */
  hello: [`${call}, 오늘은 어떤 숫자를 만날까?`, `${call}, 같이 세어 볼래?`, `${nick}랑 노는 게 제일 좋아!`, `${call}, 준비됐니? 출발!`],
  sessionStart: `${call}, 오늘의 놀이를 시작해 볼까?`,
  sessionEnd: `오늘의 놀이 끝! ${nick} 정말 잘했어!`,
  doneToday: `오늘 놀이는 끝! ${call}, 내일 또 만나!`,
  stampPass: `도장 쾅! ${nick} 정말 대단해!`,
  stampPractice: "조금 더 연습하고 다시 해 보자!",
  stampMoveOn: "잘했어! 다음 장으로 가 보자!",
  blocks: "블록을 모았어!",
  friendNew: "새 숫자 친구를 만났어!",
  locked: "조금 더 놀면 열려!",

  meetCount: "내 블록을 하나씩 세어 볼래?",
  meetShape: "숫자는 이렇게 생겼어!",
  countTap: "하나씩 눌러서 세어 봐!",
  howMany: "몇 개인지 세어 보고 숫자를 골라 봐!",
  findNum: "잘 듣고 숫자를 찾아 봐!",
  whereIs: "어디 있을까?",
  build: "숫자만큼 블록을 쌓아 볼까?",
  tooMany: "블록이 너무 많아!",
  tooFew: "블록이 모자라!",
  clap: "숫자만큼 짝짝 손뼉을 쳐 봐!",
  trace: "손가락으로 숫자를 따라 써 봐!",
  compareMore: "어느 쪽이 더 많을까?",
  compareFewer: "어느 쪽이 더 적을까?",
  nextNum: "다음에 올 숫자는 뭘까?",
  shape: "같은 모양을 찾아 봐!",
  pattern: "규칙을 찾아서 다음에 올 것을 골라 봐!",
  patternQ: "다음은 뭘까?",
  join: "블록을 모으면 몇 개가 될까?",
  and: "하고",
  joinQ: "모으면 몇 개일까?",
  compareBig: "어느 수가 더 클까?",
  compareSmall: "어느 수가 더 작을까?",
  sizeBigger: "어느 것이 더 클까?",
  sizeSmaller: "어느 것이 더 작을까?",
  add: "더하기를 해 볼까?",
  subtract: "빼기를 해 볼까?",
  sort: "같은 것끼리 골라 모아 볼까?",

  // 숫자 놀이(오리지널, 2026-10-27)
  games: `${call}, 어떤 숫자 놀이를 해 볼까?`,
  // 블록 친구 만들기 — 예시 친구 모양 틀에 일(과 이·삼)을 끌어다 채운다(2026-10-27 사용자)
  maker: "일을 모아서 숫자 친구를 만들어 볼까?",
  makerFill: "일을 넣어서 나를 만들어 줘!",
  makerDrag: "끌어서 칸에 넣어 봐!",
  shadow: "누구 그림자일까?",
  shadowDrag: "친구를 끌어서 그림자 위에 놓아 봐!",
  seesaw: "시소를 타 볼까?",
  // "구와 / 십 중에 / 어느 쪽이 더 무거울까?" → 기운 뒤 "십이 / 블록이 더 많아서 내려갔어!" (2026-10-27 사용자 제안: 두 친구를 말해 주고 이유도)
  heavier: "어느 쪽이 더 무거울까?",
  heavyWhy: "블록이 더 많아서 내려갔어!",
  seesawEven: "블록을 넣어서 똑같게 만들어 볼까?",
  seesawLevel: "똑같아! 시소가 반듯해졌어!",
  // 주사위 윷놀이 — 둘이·셋이(혼자는 상대가 없어 뺐다), 잡히면 처음부터 다시 출발
  // 순서: 몇 명이서 → 내 친구(어떤 친구가 될래?) → 같이 놀 친구(누구랑 놀까?) — 2026-10-27 사용자: 둘이·셋이면 친구도 직접 고르기
  yutHowMany: "몇 명이서 놀까?",
  // 둘이·셋이는 컴퓨터랑(스스로 굴림) 또는 친구랑(사람이 직접, 이름도) — 2026-10-27 사용자
  yutVs: "컴퓨터랑 할까, 친구랑 할까?",
  yutVsModes: ["컴퓨터랑 하기", "친구랑 하기"],
  yutName: "친구 이름을 골라 줘!",
  yutPick: "어떤 친구가 될래?",
  yutMode: "누구랑 놀까?",
  yutModes: ["둘이 하기", "셋이 하기"],
  yutMyTurn: `${nick} 차례! 주사위를 굴려 봐!`,
  yutAgain: "한 번 더!",
  yutShortcut: "지름길이다!",
  yutCatch: "잡았다!",
  yutBack: "처음부터 다시 출발!",
  yutHome: "도착!",
  share: "친구들에게 쿠키를 똑같이 나눠 줄까?",
  shareDrag: "쿠키를 끌어서 친구에게 가져다 줘!",
  shareNot: "어? 똑같지 않아. 다시 나눠 볼까?",
  drum: "친구가 북을 쳐! 몇 번 치는지 잘 들어 봐!",
  drumQ: "몇 번 쳤을까?",

  free: `${call}, 무슨 놀이를 해 볼까?`,
  friends: `${call}, 숫자 친구들을 만나 볼까?`,
  friendLocked: "아직 못 만난 친구야. 오늘의 놀이에서 만나자!",
  transform: "변신!",
  write: `${call}, 어떤 숫자를 써 볼까?`,
  next: "다음!",

  revealHere: "여기 있었네!",
  praise: ["잘했어!", "맞았어!", "최고야!", "우와, 멋지다!", `${nick} 최고야!`, `잘했어, ${call}!`],
  retry: ["다시 해 볼까?", "한 번 더 해 보자!"],
  // 하루하루 재미 장치(2026-10-28 사용자: 일일 미션·출석·난이도 — 토도수학의 오늘의 목표·COMPLETE 도장처럼)
  attendAsk: "출석 체크! 기차를 눌러 봐!",
  trainGo: "기차 출발! 블록 일곱 개 받았어!",
  missions: "오늘의 미션이야! 하나씩 해 볼까?",
  missionStampAsk: "미션을 다 했어! 도장을 눌러 봐!",
  missionAll: "미션 완료! 도장 쾅! 블록 세 개 받았어!",
  // 친구 집 짓기(2026-10-28 블록 탑에서 바뀜) — 짓는 집 안내는 buildAsk(n), 다 지으면 meetBlocks(n) · towerHouse · meetHello(n)
  tower: `${call}, 블록으로 친구 집을 지어 볼까?`,
  towerRule: "숫자 친구는 자기 숫자만큼 블록으로 집을 지어!",
  towerHouse: "집 완성! 친구가 이사 왔어!",
  towerEmpty: "블록이 다 떨어졌어! 놀이를 하면 블록이 생겨.",
  challenge: "도전! 조금 어려운 문제야!",
  challengeWin: "도전 성공! 블록 하나 더!",
  todayFriend: "오늘의 친구야!",

  // 업체 유아 단계 놀이(2026-10-28 사용자: 토도수학 유아 단계 구성요소를 따라서)
  success: "성공!",
  countUp: "하나씩 늘어나요! 몇 개인지 세어 볼까?",
  matchSame: "똑같은 것끼리 선으로 이어 봐!",
  matchNumber: "숫자와 개수가 같은 것끼리 이어 봐!",
  farm: "동물들이 헛간에 들어가요! 몇 마리 들어가는지 잘 봐!",
  farmQ: "헛간에 몇 마리 있을까?",
  farmOpen: "헛간을 열어 볼까?",
  /** 빈 카드(0)를 눌렀을 때 */
  none: "하나도 없어!",
  tally: "막대를 세어 보고 숫자를 칸에 넣어 봐!",
  shapePair: "같은 모양끼리 짝을 지어 봐!",
  dice: "주사위 눈을 세어 볼까?",
  diceQ: "주사위를 찾아서 칸에 넣어 봐!",
  shop: "가게 놀이! 손님이 달라는 만큼 바구니에 담아 줘!",
  shopTooMany: "너무 많아! 몇 개 달라고 했지?",
  shopTooFew: "조금 모자라! 몇 개 달라고 했지?",
  shopOther: "어? 다른 물건이 들어 있어!",
  shopThanks: "고마워! 또 올게!",
  shopNotThis: "그건 아니야! 다시 찾아볼까?",
  numberLine: "블록을 놓아서 수직선을 밝혀 볼까?",
  numberLineCheck: "다 놓았으면 확인을 눌러 봐!",

  // 생각 놀이(업체 「사고력 세상」 Lv.1, 2026-10-28)
  think: `${call}, 생각 놀이를 해 볼까?`,
  map: "모험 지도야! 반짝이는 섬에서 오늘의 놀이를 해 볼까?",
  // 오늘의 길(2026-10-29) — 하루 놀이를 길 위 칸으로 하나씩
  path: "오늘의 길이야! 반짝이는 칸을 눌러 봐!",
  songs: "노래를 들어 볼까? 듣고 싶은 노래를 눌러 봐!",
  pathNext: "잘했어! 다음 칸을 눌러 볼까?",
  mirror: "거울처럼 똑같이 점을 찍어 봐!",
  mirrorCheck: "다 찍었으면 확인을 눌러 봐!",
  mirrorWrong: "어? 조금 달라. 다시 볼까?",
  memoryLook: "잘 봐! 어디 있는지 기억해!",
  memory: "같은 친구 둘을 찾아 봐!",
  whoHid: "친구들을 잘 기억해!",
  whoHidQ: "누가 숨었을까?",
  found: "찾았다!",

  // 선물 놀이(2026-10-29 사용자: 녹화해 온 업체 놀이를 우리 그림으로) — 미션 도장을 받을 때마다 하나씩 열린다
  giftNew: "선물이야! 새 놀이가 열렸어!",
  eggs: "알 속에 숫자 친구가 숨었어!",
  eggsQ: "빈 알에는 어떤 숫자가 들어갈까?",
  parts: "두 친구가 모이면 새 친구로 변신해!",
  partsQ: "누가 와야 할까?",
  moreLess: "블록을 넣고 빼서 숫자를 만들어 봐!",
  hideLine: "수직선에 친구가 숨었어! 어디 숨었는지 눌러 봐!",
  meal: "냠냠 식사 시간! 똑같을 수도 있어!",
  same: "똑같아!",
  numTrain: "작은 수부터 차례로 기차에 태워 줘!",
  trainDepart: "칙칙폭폭 출발!",
  rocket: "로켓을 쏘아 올리자! 연료 블록을 채워 봐!",
  countdown: "이제 거꾸로 세어 볼까?",
  liftoff: "발사!",
  tenFrame: "열 칸을 다 채우면 십으로 변신해!",
  numBoard: "빈칸에 들어갈 숫자를 끌어다 넣어 봐!",
  sequence: "친구들이 차례로 반짝여! 잘 보고 똑같이 눌러 봐!",
  sequenceGo: "이제 눌러 봐!",
  matrix: "줄을 잘 보고 빈칸에 맞는 것을 넣어 봐!",
} as const;

/** 숫자 친구 인사 — "안녕! 나는 셋이야." */
export function meetHello(n: number): string {
  return `안녕! 나는 ${isIt(FRIENDS[n - 1]?.name ?? nameOf(n))}.`;
}

/** 성격 소개 — curriculum/friends 의 intro("나는 재주꾼이야! 하나, 둘, 셋, 나를 봐!") */
export function meetIntro(n: number): string {
  return FRIENDS[n - 1]?.intro ?? "";
}

/** 다 센 뒤 — "셋! 블록이 세 개야." */
export function meetBlocks(n: number): string {
  return `${nameOf(n)}! 블록이 ${modOf(n)} 개야.`;
}

/** 셀 때 말 — 친구 이름이 한자어(삼)라서 "셋이라고도 해." */
export function meetAlso(n: number): string {
  return `${alsoCalled(nameOf(n))} 해.`;
}

/** "블록을 세 개 쌓아 볼까?" */
export function buildAsk(n: number): string {
  return `블록을 ${modOf(n)} 개 쌓아 볼까?`;
}

/** "손뼉을 세 번 쳐 볼까?" */
export function clapAsk(n: number): string {
  return `손뼉을 ${modOf(n)} 번 쳐 볼까?`;
}

/** "모두 몇 개일까?" · "모두 몇 마리일까?" */
export function howManyAsk(unit: Unit): string {
  return `모두 몇 ${unit}일까?`;
}

/** "동그라미를 찾아 봐!" — 모양 이름은 모두 받침이 없다 */
export function shapeAsk(id: ShapeId): string {
  return `${SHAPES.find((s) => s.id === id)?.name ?? ""}를 찾아 봐!`;
}

/** 크기 비교에서 누른 것 — "큰 세모" · "작은 세모" */
export function sizeName(id: ShapeId, big: boolean): string {
  return `${big ? "큰" : "작은"} ${shapeName(id)}`;
}

/** "둘 더하기 하나는?" · "하나 더하기 셋은?" */
export function addAsk(a: number, b: number): string {
  const nb = nameOf(b);
  return `${nameOf(a)} 더하기 ${nb}${hasBatchim(nb) ? "은" : "는"}?`;
}

/** "셋 빼기 하나는?" */
export function subtractAsk(a: number, b: number): string {
  const nb = nameOf(b);
  return `${nameOf(a)} 빼기 ${nb}${hasBatchim(nb) ? "은" : "는"}?`;
}

/** 모양 나누기 — "빨간색을 모두 골라 봐!" · "큰 것을 모두 골라 봐!" (target 은 색 값 또는 big·small) */
export function sortAsk(target: string): string {
  if (target === "big") return "큰 것을 모두 골라 봐!";
  if (target === "small") return "작은 것을 모두 골라 봐!";
  return `${colorName(target)}을 모두 골라 봐!`;
}

/** 주사위 윷놀이 — "세 칸 가 볼까?" (주사위는 1~6) */
export function stepAsk(n: number): string {
  return `${modOf(n)} 칸 가 볼까?`;
}

/** 주사위 윷놀이 — 한 칸씩 갈 때마다 "한 칸, 두 칸, 세 칸"(2026-10-27 사용자) */
export function stepCount(n: number): string {
  return `${modOf(n)} 칸`;
}

/** 주사위 윷놀이 — "삼 차례!" (같이 노는 숫자 친구) */
export function turnOf(n: number): string {
  return `${sinoOf(n)} 차례!`;
}

/** 주사위 윷놀이 — "일등!" (셋이 하기까지) */
export function rankOf(n: number): string {
  return `${sinoOf(n)}등!`;
}

/** 주사위 윷놀이 「친구랑 하기」 — 눌러서 고르는 이름(이 이름들은 미리 굽는다. 직접 쓴 이름은 기기 음성) */
export const FAMILY_NAMES = ["엄마", "아빠", "언니", "오빠", "누나", "형", "할머니", "할아버지"] as const;

/** "엄마 차례! 주사위를 굴려 봐!" */
export function humanTurn(name: string): string {
  return `${name} 차례! 주사위를 굴려 봐!`;
}

/** "엄마 도착!" */
export function humanHome(name: string): string {
  return `${name} 도착!`;
}

/** 시소 — 친구 이름 + 와/과: "구와" · "십과" (시소는 열까지) */
export function withAnd(n: number): string {
  const s = sinoOf(n);
  return `${s}${hasBatchim(s) ? "과" : "와"}`;
}

/** 시소 — "십 중에" */
export function amongOf(n: number): string {
  return `${sinoOf(n)} 중에`;
}

/** 시소 — 친구 이름 + 이/가: "십이" · "구가" */
export function heavyIs(n: number): string {
  const s = sinoOf(n);
  return `${s}${hasBatchim(s) ? "이" : "가"}`;
}

/** 간식 나누기 — "둘씩 똑같아!" (한 친구 몫은 1~5) */
export function shareEach(n: number): string {
  return `${nameOf(n)}씩 똑같아!`;
}

/** 가게 놀이(이름으로 하나) — "딸기를 주세요!" */
export function shopName(name: string): string {
  return `${name}${hasBatchim(name) ? "을" : "를"} 주세요!`;
}

/** 가게 놀이 — 물건 이름 뒤에 "세 개 주세요!" (가게 물건은 "개"로 센다, 열까지) */
export function shopAsk(n: number): string {
  return `${modOf(n)} 개 주세요!`;
}

/** 수직선 밝히기 — "셋까지 가려면 블록이 몇 개 더 있어야 할까?" (목표 2~10) */
export function lineAsk(t: number): string {
  return `${nameOf(t)}까지 가려면 블록이 몇 개 더 있어야 할까?`;
}

/** 몇이랑 몇? · 하나 더 하나 덜 — "셋을 만들어 봐!" (열까지) */
export function makeAsk(n: number): string {
  const name = nameOf(n);
  return `${name}${hasBatchim(name) ? "을" : "를"} 만들어 봐!`;
}

/** 출석 기차 몇째 칸 — "오늘은 넷째 날! 사가 탔어!" (car 1~7) */
export function attendBoard(car: number): string {
  const ord = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째", "일곱째"][car - 1] ?? `${car}번째`;
  const who = sinoOf(car);
  return `오늘은 ${ord} 날! ${who}${hasBatchim(who) ? "이" : "가"} 탔어!`;
}

/** 모든 말을 한 줄씩 — 음성 파일 목록을 뽑을 때 쓴다 */
export function allLineTexts(): string[] {
  const fixed = Object.values(LINES).flatMap((v) => (typeof v === "string" ? [v] : [...v]));
  const nums = range(1, MAX_NUMBER);
  return [
    ...fixed,
    ...nums.map(nameOf),
    // 숫자 친구 이름(일·이·삼) — 만나기에서 숫자 모양을 보여 줄 때 "삼!"
    ...nums.map(sinoOf),
    ...nums.flatMap((n) => [meetHello(n), meetIntro(n), meetBlocks(n), meetAlso(n), buildAsk(n), clapAsk(n)]).filter(Boolean),
    howManyAsk("개"),
    howManyAsk("마리"),
    ...SHAPES.map((s) => s.name),
    ...SHAPES.map((s) => shapeAsk(s.id)),
    ...THINGS.map((t) => t.name),
    // 레벨 A9·B5·B7·B9 놀이(2026-10-27 업체 과정 따라가기)
    ...SHAPES.flatMap((s) => [sizeName(s.id, true), sizeName(s.id, false)]),
    ...addPairs(ARITH_MAX).map(([a, b]) => addAsk(a, b)),
    ...subtractPairs(ARITH_MAX).map(([a, b]) => subtractAsk(a, b)),
    ...["big", "small", ...SHAPE_COLORS].map(sortAsk),
    // 숫자 놀이(오리지널) — 주사위 1~6, 한 친구 몫 1~5
    ...range(1, 6).flatMap((n) => [stepAsk(n), stepCount(n)]),
    ...range(1, MAX_NUMBER).map(turnOf),
    ...range(1, 3).map(rankOf),
    ...FAMILY_NAMES.flatMap((name) => [name, humanTurn(name), humanHome(name)]),
    ...range(1, 5).map(shareEach),
    ...range(1, 10).flatMap((n) => [withAnd(n), amongOf(n), heavyIs(n)]),
    // 출석 기차 일곱 칸
    ...range(1, 7).map(attendBoard),
    // 가게 놀이(열까지) · 수직선 밝히기(목표 2~10)
    ...range(1, 10).map(shopAsk),
    ...THINGS.filter((t) => t.unit === "개").map((t) => shopName(t.name)),
    ...range(2, 10).map(lineAsk),
    // 선물 놀이 — 몇이랑 몇?(상자 수 2~10) · 하나 더 하나 덜(목표 1~10)
    ...range(1, 10).map(makeAsk),
  ];
}
