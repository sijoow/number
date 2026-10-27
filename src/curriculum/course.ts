/**
 * 숫자놀이 과정표 — 업체(토도수학) 나이대별 과정의 학습 목표 순서를 따른다(2026-10-27 사용자: "해당 업체 나이대별 커리큘럼을 따라서").
 *   레벨 A(유아) A1~A10 → 레벨 B(유치원 기초) B1~B10. 장 하나 = 학습 목표 하나 — 20장 × 5일 = 100일.
 *   목표와 순서는 업체 공개 교사용 페이지(todoclassroom.com/todomath/curri, docs/HANDOFF.md 4절) 그대로, 나이는 앱스토어 설명(A 유아 · B 유치원 기초).
 *   놀이·화면·캐릭터는 우리 것 — 업체 스테이지의 실제 활동은 공개돼 있지 않고, 앱을 그대로 옮기지 않는다.
 * 하루치 = 그 장 목표 놀이 1~2개 + 앞에서 배운 것 되풀이(업체 원칙: 같은 개념을 여러 놀이로 반복), 10분쯤.
 *   장마다 5일째는 「도장 놀이」(업체의 형성 평가 자리) — 점수 놀이만, 80% 넘으면 그 장 도장.
 *   도장을 못 받으면 연습 놀이 하루 → 도장 놀이 한 번 더. 두 번째도 못 받으면 다음 장으로 간다(부모 페이지에 '다시 볼 장'으로 남는다).
 * 숫자 친구는 세기 목표 장에서 만난다 — A1 에서 1~5, A7 에서 6~10, B1 에서 11~20.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import type { ShapeId } from "./things.ts";
import type { ActivitySpec, Chapter, DayPlan, NumRange } from "./types.ts";

export const DAYS_PER_CHAPTER = 5;
/** 도장 놀이 통과 기준 */
export const PASS_RATE = 0.8;
/** 도장 놀이를 몇 번까지 하나 — 두 번째도 못 받으면 다음 장으로 */
export const STAMP_TRIES = 2;

/** 레벨 이름 — 업체 앱스토어 설명의 나이대 */
export const LEVEL_NAMES = { A: "유아", B: "유치원 기초" } as const;

const r = (a: number, b: number): NumRange => [a, b];
const meet = (n: number): ActivitySpec => ({ kind: "meet", n });
const count = (a: number, b: number, rounds = 3): ActivitySpec => ({ kind: "count", range: r(a, b), rounds });
const howMany = (a: number, b: number, rounds = 4): ActivitySpec => ({ kind: "how-many", range: r(a, b), rounds });
const findNum = (a: number, b: number, rounds = 4): ActivitySpec => ({ kind: "find-num", range: r(a, b), rounds });
const build = (a: number, b: number, rounds = 3): ActivitySpec => ({ kind: "build", range: r(a, b), rounds });
const trace = (...digits: number[]): ActivitySpec => ({ kind: "trace", digits });
const clap = (a: number, b: number, rounds = 3): ActivitySpec => ({ kind: "clap", range: r(a, b), rounds });
const compare = (a: number, b: number, ask: "more" | "fewer" | "mix", rounds = 4): ActivitySpec => ({ kind: "compare", range: r(a, b), rounds, ask });
/** 수 크기 비교 — 물건 대신 숫자(+ 그 수만큼 블록) */
const compareNum = (a: number, b: number, ask: "more" | "fewer" | "mix", rounds = 4): ActivitySpec => ({ kind: "compare", range: r(a, b), rounds, ask, show: "numbers" });
const nextNum = (a: number, b: number, rounds = 4): ActivitySpec => ({ kind: "next-num", range: r(a, b), rounds });
/** 모양 — 크기·색·방향이 달라도(A5 부터) */
const shape = (shapes: ShapeId[], rounds = 4): ActivitySpec => ({ kind: "shape", shapes, rounds });
/** 모양 이름 — 반듯한 기본 모양으로(A2) */
const shapeNames = (shapes: ShapeId[], rounds = 4): ActivitySpec => ({ kind: "shape", shapes, rounds, vary: false });
const pattern = (level: "ab" | "aab" | "abc", rounds = 4): ActivitySpec => ({ kind: "pattern", level, rounds });
const join = (max: number, rounds = 4): ActivitySpec => ({ kind: "join", max, rounds });
const size = (ask: "bigger" | "smaller" | "mix", rounds = 4): ActivitySpec => ({ kind: "size", ask, rounds });
const add = (max: number, rounds = 4): ActivitySpec => ({ kind: "add", max, rounds });
const subtract = (max: number, rounds = 4): ActivitySpec => ({ kind: "subtract", max, rounds });
const sort = (by: "color" | "size" | "mix", rounds = 3): ActivitySpec => ({ kind: "sort", by, rounds });

const ALL_SHAPES: ShapeId[] = ["circle", "triangle", "square"];

export const CHAPTERS: readonly Chapter[] = [
  // ── 레벨 A · 유아 — 10까지 세고, 도형의 이름을 알기 ──
  {
    no: 1,
    level: "A",
    code: "A1",
    title: "다섯까지 세기",
    goal: "1부터 5까지 물건의 개수를 세요 — 숫자 친구 1~5를 만나요",
    range: r(1, 5),
    meets: [1, 2, 3, 4, 5],
    days: [
      [meet(1), meet(2), count(1, 2), trace(1)],
      [meet(3), count(1, 3), howMany(1, 3), trace(2)],
      [meet(4), count(2, 4), findNum(1, 4), trace(3)],
      [meet(5), count(3, 5), howMany(1, 5), trace(4, 5)],
      [count(1, 5), howMany(1, 5), findNum(1, 5)],
    ],
  },
  {
    no: 2,
    level: "A",
    code: "A2",
    title: "모양 이름",
    goal: "동그라미·세모·네모를 보고 이름을 알아요",
    range: r(1, 5),
    meets: [],
    days: [
      [shapeNames(["circle", "square"]), count(1, 5), findNum(1, 5), trace(1, 2)],
      [shapeNames(["circle", "triangle"]), howMany(1, 5), count(1, 5), trace(3)],
      [shapeNames(ALL_SHAPES), findNum(1, 5), howMany(1, 5), trace(4, 5)],
      [shapeNames(ALL_SHAPES), count(1, 5), findNum(1, 5)],
      [shapeNames(ALL_SHAPES), howMany(1, 5), findNum(1, 5)],
    ],
  },
  {
    no: 3,
    level: "A",
    code: "A3",
    title: "수만큼 나타내기 (1~5)",
    goal: "1부터 5까지 주어진 수만큼 블록을 쌓고 손뼉을 쳐요",
    range: r(1, 5),
    meets: [],
    days: [
      [build(1, 3), clap(1, 3), howMany(1, 5), trace(1, 2)],
      [build(1, 5), clap(1, 5), shapeNames(ALL_SHAPES), trace(3)],
      [build(2, 5), clap(2, 5), findNum(1, 5), trace(4, 5)],
      [build(1, 5), clap(1, 5), count(1, 5)],
      [build(1, 5), clap(1, 5), howMany(1, 5)],
    ],
  },
  {
    no: 4,
    level: "A",
    code: "A4",
    title: "수와 양 (1~5)",
    goal: "1부터 5까지 숫자가 얼마만큼인지 알고, 더 많은 쪽·적은 쪽을 골라요",
    range: r(1, 5),
    meets: [],
    days: [
      [howMany(1, 5), compare(1, 5, "more"), build(1, 5), trace(1, 2, 3)],
      [compare(1, 5, "more"), howMany(1, 5), clap(1, 5), trace(4, 5)],
      [compare(1, 5, "fewer"), nextNum(1, 5), findNum(1, 5)],
      [compare(1, 5, "mix"), howMany(1, 5), nextNum(1, 5), build(1, 5)],
      [compare(1, 5, "mix"), howMany(1, 5), nextNum(1, 5)],
    ],
  },
  {
    no: 5,
    level: "A",
    code: "A5",
    title: "모양 알아보기",
    goal: "크기·색깔·방향이 달라도 이름에 맞는 모양을 골라요",
    range: r(1, 5),
    meets: [],
    days: [
      [shape(ALL_SHAPES), howMany(1, 5), build(1, 5), trace(1, 2)],
      [shape(ALL_SHAPES), compare(1, 5, "mix"), count(1, 5), trace(3, 4, 5)],
      [shape(ALL_SHAPES), findNum(1, 5), clap(1, 5)],
      [shape(ALL_SHAPES), nextNum(1, 5), howMany(1, 5), build(1, 5)],
      [shape(ALL_SHAPES), compare(1, 5, "mix"), findNum(1, 5)],
    ],
  },
  {
    no: 6,
    level: "A",
    code: "A6",
    title: "AB 규칙",
    goal: "사과·바나나·사과·바나나처럼 되풀이되는 규칙(AB)을 찾아 이어요",
    range: r(1, 5),
    meets: [],
    days: [
      [pattern("ab"), howMany(1, 5), shape(ALL_SHAPES), trace(1, 2, 3)],
      [pattern("ab"), compare(1, 5, "mix"), build(1, 5), trace(4, 5)],
      [pattern("ab"), findNum(1, 5), clap(1, 5)],
      [pattern("ab"), nextNum(1, 5), howMany(1, 5), shape(ALL_SHAPES)],
      [pattern("ab"), howMany(1, 5), compare(1, 5, "mix")],
    ],
  },
  {
    no: 7,
    level: "A",
    code: "A7",
    title: "열까지 세기",
    goal: "6부터 10까지 물건의 개수를 세요 — 숫자 친구 6~10을 만나요",
    range: r(1, 10),
    meets: [6, 7, 8, 9, 10],
    days: [
      [meet(6), meet(7), count(4, 7), trace(6, 7)],
      [meet(8), count(5, 8), howMany(3, 8), trace(8)],
      [meet(9), count(6, 9), findNum(1, 9), trace(9)],
      [meet(10), count(7, 10), howMany(5, 10), trace(10)],
      [count(6, 10), howMany(6, 10), findNum(1, 10)],
    ],
  },
  {
    no: 8,
    level: "A",
    code: "A8",
    title: "수만큼 나타내기 (6~10)",
    goal: "6부터 10까지 주어진 수만큼 블록을 쌓고 손뼉을 쳐요",
    range: r(1, 10),
    meets: [],
    days: [
      [build(6, 8), clap(5, 8), howMany(5, 10), trace(6, 7, 8)],
      [build(6, 10), clap(6, 10), count(6, 10), pattern("ab")],
      [build(6, 10), findNum(1, 10), clap(6, 10), trace(9, 10)],
      [build(6, 10), clap(6, 10), howMany(6, 10), shape(ALL_SHAPES)],
      [build(6, 10), clap(6, 10), howMany(6, 10)],
    ],
  },
  {
    no: 9,
    level: "A",
    code: "A9",
    title: "크기 비교",
    goal: "모양 둘을 보고 어느 것이 더 큰지, 더 작은지 알아요",
    range: r(1, 10),
    meets: [],
    days: [
      [size("bigger"), howMany(1, 10), shape(ALL_SHAPES), trace(1, 2, 3)],
      [size("bigger"), build(1, 10), pattern("ab"), trace(4, 5, 6)],
      [size("smaller"), findNum(1, 10), clap(1, 10), trace(7, 8)],
      [size("mix"), nextNum(1, 10), howMany(1, 10), trace(9, 10)],
      [size("mix"), shape(ALL_SHAPES), howMany(1, 10)],
    ],
  },
  {
    no: 10,
    level: "A",
    code: "A10",
    title: "수와 양 (6~10)",
    goal: "6부터 10까지 숫자가 얼마만큼인지 알고 비교해요",
    range: r(1, 10),
    meets: [],
    days: [
      [howMany(6, 10), compare(1, 10, "more"), build(6, 10), trace(6, 7)],
      [compare(1, 10, "more"), howMany(6, 10), nextNum(1, 10), trace(8, 9)],
      [compare(1, 10, "fewer"), nextNum(1, 10), findNum(1, 10), trace(10)],
      [compare(1, 10, "mix"), howMany(1, 10), count(1, 10), size("mix")],
      [compare(1, 10, "mix"), howMany(6, 10), nextNum(1, 10)],
    ],
  },
  // ── 레벨 B · 유치원 기초 — 20까지 수를 알고, 5 이하 더하기·빼기 ──
  {
    no: 11,
    level: "B",
    code: "B1",
    title: "스물까지 세기",
    goal: "11부터 20까지 물건의 개수를 세요 — 숫자 친구 11~20을 만나요",
    range: r(1, 20),
    meets: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    days: [
      [meet(11), meet(12), meet(13), count(10, 13)],
      [meet(14), meet(15), meet(16), count(12, 16)],
      [meet(17), meet(18), count(14, 18), trace(11, 12, 13)],
      [meet(19), meet(20), count(16, 20), findNum(10, 20)],
      [count(11, 20), findNum(11, 20), howMany(1, 10)],
    ],
  },
  {
    no: 12,
    level: "B",
    code: "B2",
    title: "스물까지 차례",
    goal: "11부터 20까지 수가 놓이는 차례를 알아요",
    range: r(1, 20),
    meets: [],
    days: [
      [nextNum(10, 15), findNum(10, 15), count(10, 15), trace(14, 15)],
      [nextNum(10, 20), findNum(10, 20), trace(16, 17)],
      [nextNum(10, 20), count(15, 20), findNum(10, 20), trace(18, 19, 20)],
      [nextNum(1, 20), findNum(10, 20), howMany(1, 10)],
      [nextNum(10, 20), findNum(10, 20), count(11, 20)],
    ],
  },
  {
    no: 13,
    level: "B",
    code: "B3",
    title: "ABC 규칙",
    goal: "사과·바나나·딸기처럼 세 가지가 되풀이되는 규칙(ABC)을 찾아 이어요",
    range: r(1, 20),
    meets: [],
    days: [
      [pattern("abc"), count(11, 20), findNum(10, 20), trace(11, 12)],
      [pattern("abc"), nextNum(10, 20), shape(ALL_SHAPES), trace(13, 14)],
      [pattern("aab"), size("mix"), howMany(1, 10), trace(15, 16)],
      [pattern("abc"), compare(1, 10, "mix"), nextNum(10, 20)],
      [pattern("abc"), nextNum(10, 20), count(11, 20)],
    ],
  },
  {
    no: 14,
    level: "B",
    code: "B4",
    title: "모으기 (5까지)",
    goal: "두 수를 모아 5까지의 수를 만들어요",
    range: r(1, 20),
    meets: [],
    days: [
      [join(3), build(1, 5), count(11, 20), trace(17, 18)],
      [join(4), howMany(1, 5), nextNum(10, 20), trace(19, 20)],
      [join(5), clap(1, 5), pattern("abc")],
      [join(5), compare(1, 10, "mix"), findNum(10, 20)],
      [join(5), howMany(1, 5), nextNum(10, 20)],
    ],
  },
  {
    no: 15,
    level: "B",
    code: "B5",
    title: "더하기 (5까지)",
    goal: "합이 5까지인 더하기를 해요 (2 + 1 = 3)",
    range: r(1, 20),
    meets: [],
    days: [
      [add(3), join(5), count(11, 20)],
      [add(4), build(1, 5), findNum(10, 20), trace(1, 2, 3)],
      [add(5), howMany(1, 10), pattern("abc")],
      [add(5), join(5), nextNum(10, 20), trace(4, 5)],
      [add(5), join(5), howMany(1, 10)],
    ],
  },
  {
    no: 16,
    level: "B",
    code: "B6",
    title: "수와 양 (11~20)",
    goal: "11부터 20까지 숫자가 얼마만큼인지 알아요",
    range: r(1, 20),
    meets: [],
    days: [
      [howMany(11, 15), count(11, 15), add(5), trace(11, 12, 13)],
      [howMany(11, 20), findNum(10, 20), join(5)],
      [howMany(11, 20), nextNum(10, 20), add(5), trace(14, 15, 16)],
      [howMany(11, 20), count(11, 20), pattern("abc")],
      [howMany(11, 20), findNum(11, 20), add(5)],
    ],
  },
  {
    no: 17,
    level: "B",
    code: "B7",
    title: "빼기 (5까지)",
    goal: "5까지의 수에서 빼기를 해요 (3 − 1 = 2)",
    range: r(1, 20),
    meets: [],
    days: [
      [subtract(3), add(5), howMany(11, 20)],
      [subtract(4), join(5), count(11, 20), trace(17, 18)],
      [subtract(5), add(5), nextNum(10, 20)],
      [subtract(5), howMany(11, 20), findNum(10, 20), trace(19, 20)],
      [subtract(5), add(5), howMany(11, 20)],
    ],
  },
  {
    no: 18,
    level: "B",
    code: "B8",
    title: "수만큼 나타내기 (11~20)",
    goal: "11부터 20까지 주어진 수만큼 블록을 쌓아요",
    range: r(1, 20),
    meets: [],
    days: [
      [build(11, 15), clap(10, 13), subtract(5)],
      [build(11, 20), howMany(11, 20), add(5)],
      [build(11, 20), clap(11, 15), subtract(5)],
      [build(11, 20), count(11, 20), nextNum(10, 20)],
      [build(11, 20), clap(11, 15), howMany(11, 20)],
    ],
  },
  {
    no: 19,
    level: "B",
    code: "B9",
    title: "모양 나누기",
    goal: "크기나 색깔에 따라 모양을 나눠요",
    range: r(1, 20),
    meets: [],
    days: [
      [sort("color"), shape(ALL_SHAPES), build(11, 20)],
      [sort("color"), size("mix"), add(5)],
      [sort("size"), subtract(5), howMany(11, 20)],
      [sort("mix"), pattern("abc"), nextNum(10, 20)],
      [sort("mix"), size("mix"), shape(ALL_SHAPES)],
    ],
  },
  {
    no: 20,
    level: "B",
    code: "B10",
    title: "수 크기 비교 (10까지)",
    goal: "10까지의 두 수 중 어느 수가 더 큰지, 작은지 알아요",
    range: r(1, 20),
    meets: [],
    days: [
      [compareNum(1, 10, "more"), howMany(1, 10), add(5)],
      [compareNum(1, 10, "fewer"), subtract(5), sort("mix")],
      [compareNum(1, 10, "mix"), nextNum(1, 20), build(11, 20)],
      [compareNum(1, 10, "mix"), add(5), subtract(5), howMany(11, 20)],
      [compareNum(1, 10, "mix"), add(5), subtract(5)],
    ],
  },
];

export const TOTAL_DAYS = CHAPTERS.length * DAYS_PER_CHAPTER;

export function chapterOf(no: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.no === no);
}

export function isStampDay(day: number): boolean {
  return day === DAYS_PER_CHAPTER;
}

function dayTitle(c: Chapter, day: number): string {
  if (isStampDay(day)) return "도장 놀이";
  return `${c.title} ${day}일째`;
}

/** 그날 하루치 — 없는 장·날이면 null */
export function dayPlan(chapter: number, day: number): DayPlan | null {
  const c = chapterOf(chapter);
  const acts = c?.days[day - 1];
  if (!c || !acts) return null;
  return { chapter, day, title: dayTitle(c, day), stamp: isStampDay(day), activities: [...acts] };
}

/** 연습 놀이 — 도장을 못 받았을 때 하루. 도장 놀이와 같은 놀이를 힌트가 있는 보통 판으로 */
export function practicePlan(chapter: number): DayPlan | null {
  const stamp = dayPlan(chapter, DAYS_PER_CHAPTER);
  if (!stamp) return null;
  return { ...stamp, title: "연습 놀이", stamp: false };
}

/** 이 장까지 만난 숫자 친구 — 장 시작 전이면 그 앞 장까지 */
export function friendsBefore(chapter: number): number[] {
  return CHAPTERS.filter((c) => c.no < chapter).flatMap((c) => [...c.meets]);
}

/** 조건에 맞는 놀이가 처음 나오는 날 */
function firstDay(match: (a: ActivitySpec) => boolean): { chapter: number; day: number } | null {
  for (const c of CHAPTERS) {
    for (let i = 0; i < c.days.length; i++) if (c.days[i].some(match)) return { chapter: c.no, day: i + 1 };
  }
  return null;
}

/** 놀이 종류가 처음 나오는 날 — 놀이터가 이 날부터 열린다 */
export function firstSeen(kind: ActivitySpec["kind"]): { chapter: number; day: number } | null {
  return firstDay((a) => a.kind === kind);
}

/** 규칙 찾기 단계가 처음 나오는 날 — 놀이터 규칙 찾기가 이 날부터 그 단계로(ABC 는 B3) */
export function firstPattern(level: "ab" | "aab" | "abc"): { chapter: number; day: number } | null {
  return firstDay((a) => a.kind === "pattern" && a.level === level);
}
