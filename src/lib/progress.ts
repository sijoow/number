/**
 * 진도 — 「오늘의 놀이」(장·날·도장) + 놀이터·숫자 친구·하루 기록. 규칙은 우리가 정했다(course.ts 머리말):
 *   · 하루에 한 번(부모가 '하나 더 열기'로 더 열 수 있다, 설정에서 끌 수도 있다)
 *   · 5일째 도장 놀이 — 첫 시도 정답 80% 이상이면 도장. 못 받으면 연습 놀이 하루 → 도장 놀이 한 번 더 → 그래도 못 받으면 다음 장
 *   · 블록(보상) — 놀이 하나 1개 + 하루 끝 3개 + 도장 5개, 놀이터는 놀이마다 하루 첫 판만 1개. 쓰지 않고 쌓인다
 *   · 숫자 친구는 그 친구를 만나는 날(meet 놀이)을 끝내면 친구 앨범에 들어온다
 *   · 재미 장치(2026-10-28 사용자: 하루하루 미션·출석·난이도 — 토도수학의 오늘의 목표·COMPLETE 도장처럼)
 *       출석 기차 — 하루 한 번 출석, 일곱 번이면 기차 출발 + 블록 7개(빠진 날이 있어도 끊기지 않고 이어 탄다)
 *       오늘의 미션 — 셋을 다 하면 COMPLETE 도장 + 블록 3개(무엇을 할지는 lib/missions)
 *       도전 판 — 오늘의 놀이 마지막 판을 처음에 맞히면 블록 1개 더(lib/rounds withChallenge)
 *       블록 탑 — 모은 블록을 탑에 쌓는다. blocks 는 모은 블록 전부, 남은 블록 = blocks − towerPlaced, 10개가 한 층
 * 저장·불러오기는 lib/store.ts(기기) · lib/sync.ts(MongoDB), 여기는 계산만.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { CHAPTERS, chapterOf, DAYS_PER_CHAPTER, dayPlan, PASS_RATE, practicePlan, STAMP_TRIES, TOTAL_DAYS } from "../curriculum/course.ts";
import { MAX_NUMBER } from "../curriculum/numbers.ts";
import type { DayPlan } from "../curriculum/types.ts";

export const BLOCK_PER_ACTIVITY = 1;
export const BLOCK_PER_DAY = 3;
export const BLOCK_STAMP = 5;
export const BLOCK_FREE = 1;
export const TRAIN_CARS = 7;
export const BLOCK_TRAIN = 7;
export const BLOCK_MISSION = 3;
export const BLOCK_CHALLENGE = 1;
export const FLOOR_BLOCKS = 10;
const ATTEND_KEEP = 3000;
const HISTORY_MAX = 400;
const DAILY_KEEP = 120;

export interface DoneRecord {
  key: string;
  chapter: number;
  day: number;
  practice: boolean;
  stamp: boolean;
  /** 끝낸 날 (기기 시간 YYYY-MM-DD) */
  on: string;
  correct: number;
  total: number;
  /** 도장 놀이 날만 true/false */
  passed: boolean | null;
  blocks: number;
  /** 걸린 시간(ms) */
  ms?: number;
}

/** 하루 리포트 한 칸 — 학습 시간·활동 수·모은 블록 (모든 메뉴 합) */
export interface DayStat {
  ms: number;
  acts: number;
  earned: number;
}

/** 놀이터 놀이 하나의 기록 */
export interface GameStat {
  plays: number;
  /** 블록을 준 마지막 날 — 하루 첫 판만 준다 */
  paidOn: string | null;
}

export interface Progress {
  v: 1;
  chapter: number;
  /** 그 장에서 다음에 할 날 (1부터) */
  day: number;
  /** 도장을 못 받아서 다음 판이 연습 놀이다 */
  practice: boolean;
  /** 이 장 도장 놀이를 못 받은 횟수 */
  tries: number;
  blocks: number;
  history: DoneRecord[];
  /** 마지막으로 오늘의 놀이를 끝낸 날 */
  lastPlayedOn: string | null;
  /** 부모가 '하나 더 열기'를 누른 날 */
  extraOn: string | null;
  daily: Record<string, DayStat>;
  /** 만난 숫자 친구 */
  friends: number[];
  /** 도장 받은 장 */
  stamps: number[];
  games: Record<string, GameStat>;
  /** 처음으로 무엇이든 한 날 — 스케줄의 '온 지 며칠째' */
  firstOn: string | null;
  /** 출석한 날(출석 기차) — 하루 한 번 */
  attend: string[];
  /** 블록 탑에 쌓은 블록 수 — 남은 블록 = blocks − towerPlaced */
  towerPlaced: number;
  /** 오늘의 미션을 다 해서 COMPLETE 도장을 받은 날 */
  missionDays: string[];
  /** 마지막으로 숫자를 쓴 날과 그날 쓴 숫자 — 쓰기 미션 확인 */
  wrote: { on: string; nums: number[] } | null;
}

/** 숫자놀이만의 설정 — 화면 방향·공부 요일·성우는 한글나라 설정을 따른다(lib/hangul) */
export interface Settings {
  v: 1;
  /** 하루 한 번만 (마스터 아이디는 제한 없음) */
  oneADay: boolean;
  /** 숫자놀이를 시작한 날을 부모가 고쳤으면 그 날 — null 이면 처음 한 날(progress.firstOn) */
  startOn: string | null;
}

export interface SessionRef {
  key: string;
  practice: boolean;
  plan: DayPlan;
}

export interface SessionResult {
  /** 점수 놀이에서 첫 시도에 맞힌 수 */
  correct: number;
  total: number;
  /** 끝낸 놀이 수 — 블록 계산용 */
  activities: number;
  /** 도전 판을 처음에 맞힌 수 — 하나에 블록 1개 */
  bonus?: number;
  ms?: number;
}

export function initialProgress(chapter = 1): Progress {
  return {
    v: 1,
    chapter,
    day: 1,
    practice: false,
    tries: 0,
    blocks: 0,
    history: [],
    lastPlayedOn: null,
    extraOn: null,
    daily: {},
    friends: [],
    stamps: [],
    games: {},
    firstOn: null,
    attend: [],
    towerPlaced: 0,
    missionDays: [],
    wrote: null,
  };
}

export const DEFAULT_SETTINGS: Settings = { v: 1, oneADay: true, startOn: null };

/** 지금 할 하루 — 연습 놀이가 끼어 있으면 그것. 과정을 다 마쳤으면 null */
export function currentSession(p: Progress): SessionRef | null {
  if (p.practice) {
    const plan = practicePlan(p.chapter);
    return plan ? { key: `c${p.chapter}p${p.tries}`, practice: true, plan } : null;
  }
  const plan = dayPlan(p.chapter, p.day);
  return plan ? { key: `c${p.chapter}d${p.day}`, practice: false, plan } : null;
}

export function canPlayToday(p: Progress, s: Settings, today: string): boolean {
  if (!s.oneADay) return true;
  return p.lastPlayedOn !== today || p.extraOn === today;
}

/** 진도가 (chapter, day) 에 닿았는지 — 놀이터가 열리는 기준 */
export function reached(p: Progress, chapter: number, day = 1): boolean {
  return p.chapter > chapter || (p.chapter === chapter && p.day >= day);
}

export function passedOf(plan: DayPlan, r: SessionResult): boolean | null {
  if (!plan.stamp) return null;
  if (r.total === 0) return true;
  return r.correct / r.total >= PASS_RATE;
}

export function blocksFor(plan: DayPlan, r: SessionResult): number {
  return r.activities * BLOCK_PER_ACTIVITY + BLOCK_PER_DAY + (passedOf(plan, r) ? BLOCK_STAMP : 0) + (r.bonus ?? 0) * BLOCK_CHALLENGE;
}

/** 그날 만나는 숫자 친구 */
export function meetsOf(plan: DayPlan): number[] {
  return plan.activities.flatMap((a) => (a.kind === "meet" ? [a.n] : []));
}

/** 하루 리포트에 더하고 블록을 쌓는다 — 오래된 날은 DAILY_KEEP 일만 남긴다 */
export function logPlay(p: Progress, today: string, add: Partial<DayStat>): Progress {
  const cur = p.daily[today] ?? { ms: 0, acts: 0, earned: 0 };
  const day: DayStat = { ms: cur.ms + (add.ms ?? 0), acts: cur.acts + (add.acts ?? 0), earned: cur.earned + (add.earned ?? 0) };
  const keys = Object.keys({ ...p.daily, [today]: day }).sort().slice(-DAILY_KEEP);
  const daily: Record<string, DayStat> = {};
  for (const k of keys) daily[k] = k === today ? day : p.daily[k];
  return { ...p, daily, blocks: p.blocks + (add.earned ?? 0), firstOn: p.firstOn ?? today };
}

function nextChapter(p: Progress): Pick<Progress, "chapter" | "day" | "practice" | "tries"> {
  return { chapter: p.chapter + 1, day: 1, practice: false, tries: 0 };
}

/** 하루를 끝냈다 → 다음 진도 + 기록 한 줄 */
export function completeSession(p: Progress, ref: SessionRef, r: SessionResult, today: string): { next: Progress; record: DoneRecord; moved: "day" | "practice" | "stamp" | "chapter" } {
  const passed = passedOf(ref.plan, r);
  const earned = blocksFor(ref.plan, r);
  const record: DoneRecord = {
    key: ref.key,
    chapter: ref.plan.chapter,
    day: ref.plan.day,
    practice: ref.practice,
    stamp: ref.plan.stamp,
    on: today,
    correct: r.correct,
    total: r.total,
    passed,
    blocks: earned,
    ...(r.ms !== undefined ? { ms: r.ms } : {}),
  };

  let place: Pick<Progress, "chapter" | "day" | "practice" | "tries"> = { chapter: p.chapter, day: p.day, practice: p.practice, tries: p.tries };
  let stamps = p.stamps;
  let moved: "day" | "practice" | "stamp" | "chapter";
  if (ref.practice) {
    // 연습 놀이를 마쳤다 — 다음 판은 도장 놀이 한 번 더
    place = { ...place, practice: false };
    moved = "practice";
  } else if (ref.plan.stamp) {
    if (passed) {
      stamps = [...new Set([...p.stamps, p.chapter])].sort((a, b) => a - b);
      place = nextChapter(p);
      moved = "stamp";
    } else if (p.tries + 1 >= STAMP_TRIES) {
      place = nextChapter(p);
      moved = "chapter";
    } else {
      place = { ...place, practice: true, tries: p.tries + 1 };
      moved = "practice";
    }
  } else {
    place = { ...place, day: Math.min(p.day + 1, DAYS_PER_CHAPTER) };
    moved = "day";
  }

  const friends = ref.practice ? p.friends : [...new Set([...p.friends, ...meetsOf(ref.plan)])].sort((a, b) => a - b);
  const next: Progress = {
    ...p,
    ...place,
    stamps,
    friends,
    history: [...p.history, record].slice(-HISTORY_MAX),
    // 오늘 이미 한 번 했다면 이번 판은 '하나 더'를 쓴 것 — 다 썼으니 닫는다
    extraOn: p.lastPlayedOn === today ? null : p.extraOn,
    lastPlayedOn: today,
  };
  return { next: logPlay(next, today, { ms: r.ms ?? 0, acts: r.activities, earned }), record, moved };
}

/** 놀이터 한 판을 끝냈다 — 그 놀이의 오늘 첫 판이면 블록 1개 */
export function finishGame(p: Progress, gameId: string, ms: number, today: string): { next: Progress; earned: number } {
  const cur = p.games[gameId] ?? { plays: 0, paidOn: null };
  const earned = cur.paidOn === today ? 0 : BLOCK_FREE;
  const games = { ...p.games, [gameId]: { plays: cur.plays + 1, paidOn: today } };
  return { next: logPlay({ ...p, games }, today, { ms, acts: 1, earned }), earned };
}

/** 출석 기차 지금 모습 — count 지금까지 출석한 날 수, boarded 지금 기차에 탄 친구 수(오늘 일곱째가 탔으면 7 그대로 — 다음 날 새 기차) */
export function trainOf(p: Progress, today: string): { count: number; checked: boolean; train: number; boarded: number } {
  const count = p.attend.length;
  const checked = p.attend.includes(today);
  const full = count > 0 && count % TRAIN_CARS === 0 && checked;
  return { count, checked, train: full ? count / TRAIN_CARS : Math.floor(count / TRAIN_CARS) + 1, boarded: full ? TRAIN_CARS : count % TRAIN_CARS };
}

/** 출석 — 오늘 처음이면 다음 칸(1~7)에 친구가 타고, 일곱째 칸이면 기차 출발 + 블록 */
export function checkIn(p: Progress, today: string): { next: Progress; car: number; departed: boolean; earned: number } {
  if (p.attend.includes(today)) return { next: p, car: 0, departed: false, earned: 0 };
  const car = (p.attend.length % TRAIN_CARS) + 1;
  const departed = car === TRAIN_CARS;
  const earned = departed ? BLOCK_TRAIN : 0;
  const next: Progress = { ...p, attend: [...p.attend, today].sort().slice(-ATTEND_KEEP), firstOn: p.firstOn ?? today };
  return { next: earned ? logPlay(next, today, { earned }) : next, car, departed, earned };
}

/** 남은 블록 — 탑에 쌓은 만큼 빠진다 */
export function wallet(p: Progress): number {
  return Math.max(0, p.blocks - p.towerPlaced);
}

/** 블록 탑에 하나 쌓기 — floorDone 은 방금 다 지은 층(1부터), 아니면 0 */
export function placeBlock(p: Progress): { next: Progress; placed: number; floorDone: number } {
  if (wallet(p) <= 0) return { next: p, placed: p.towerPlaced, floorDone: 0 };
  const placed = p.towerPlaced + 1;
  return { next: { ...p, towerPlaced: placed }, placed, floorDone: placed % FLOOR_BLOCKS === 0 ? placed / FLOOR_BLOCKS : 0 };
}

/** 숫자 하나를 다 썼다 — 쓰기 미션 확인용(그날 쓴 숫자만 남긴다) */
export function noteWrite(p: Progress, n: number, today: string): Progress {
  const nums = p.wrote?.on === today ? [...new Set([...p.wrote.nums, n])].sort((a, b) => a - b) : [n];
  return { ...p, wrote: { on: today, nums } };
}

/** 오늘의 미션을 다 했다 — COMPLETE 도장(하루 한 번) + 블록 */
export function claimMissions(p: Progress, today: string): { next: Progress; earned: number } {
  if (p.missionDays.includes(today)) return { next: p, earned: 0 };
  const missionDays = [...p.missionDays, today].sort().slice(-HISTORY_MAX);
  return { next: logPlay({ ...p, missionDays }, today, { earned: BLOCK_MISSION }), earned: BLOCK_MISSION };
}

/** 지금 아는 가장 큰 수 — 만난 친구 중 가장 큰 수, 아무도 안 만났으면 3 */
export function topNumber(p: Progress): number {
  return Math.min(MAX_NUMBER, Math.max(3, ...p.friends));
}

/** 진도율 — 기본 날(장 수 × 5일) 중 마친 날. 연습 놀이는 세지 않는다 */
export function progressRate(p: Progress): { done: number; total: number; rate: number } {
  const done = Math.min(TOTAL_DAYS, (Math.min(p.chapter, CHAPTERS.length + 1) - 1) * DAYS_PER_CHAPTER + (p.chapter > CHAPTERS.length ? 0 : p.day - 1));
  return { done, total: TOTAL_DAYS, rate: TOTAL_DAYS ? done / TOTAL_DAYS : 0 };
}

/** 부모가 시작 장을 바꾸면 오늘의 놀이 진도만 새로 — 블록·기록·친구·도장은 남긴다. 앞 장 친구는 만난 것으로 */
export function restartAt(p: Progress, chapter: number): Progress {
  const before = CHAPTERS.filter((c) => c.no < chapter).flatMap((c) => [...c.meets]);
  return { ...p, chapter, day: 1, practice: false, tries: 0, lastPlayedOn: null, extraOn: null, friends: [...new Set([...p.friends, ...before])].sort((a, b) => a - b) };
}

/** 장이 다 끝났나 */
export function courseDone(p: Progress): boolean {
  return !chapterOf(p.chapter);
}

/** 기기 날짜(YYYY-MM-DD) — 하루 한 번 규칙의 '하루' */
export function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' 의 n일 전 (기기 날짜 기준) */
export function daysBefore(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return localDay(new Date(y, m - 1, d - n));
}

const isInt = (n: unknown, min: number, max: number): n is number => typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
export const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const nums = (v: unknown, min: number, max: number): number[] =>
  Array.isArray(v) ? [...new Set(v.filter((n): n is number => isInt(n, min, max)))].sort((a, b) => a - b) : [];

/** 저장소에서 꺼낸 값 검사 — 모양이 틀리면 처음부터 (아이 앱이 깨진 값으로 멈추면 안 된다) */
export function normalizeProgress(raw: unknown): Progress {
  const base = initialProgress();
  const o = obj(raw);
  if (!o) return base;
  // 마지막 장을 다 마치면 chapter 가 장 수 + 1 에 머문다 — 그것도 맞는 값
  const chapter = isInt(o.chapter, 1, CHAPTERS.length + 1) ? o.chapter : base.chapter;
  const day = isInt(o.day, 1, DAYS_PER_CHAPTER) ? o.day : 1;

  const daily: Record<string, DayStat> = {};
  for (const [k, v] of Object.entries(obj(o.daily) ?? {})) {
    const d = obj(v);
    if (!isDay(k) || !d) continue;
    daily[k] = { ms: isInt(d.ms, 0, 86_400_000) ? d.ms : 0, acts: isInt(d.acts, 0, 100_000) ? d.acts : 0, earned: isInt(d.earned, 0, 100_000) ? d.earned : 0 };
  }

  const games: Record<string, GameStat> = {};
  for (const [k, v] of Object.entries(obj(o.games) ?? {})) {
    const g = obj(v);
    if (!g || !/^[a-z-]{2,20}$/.test(k)) continue;
    games[k] = { plays: isInt(g.plays, 0, 1_000_000) ? g.plays : 0, paidOn: isDay(g.paidOn) ? g.paidOn : null };
  }

  const history = Array.isArray(o.history) ? (o.history.filter((h) => h && typeof h === "object") as DoneRecord[]).slice(-HISTORY_MAX) : [];
  const days = (v: unknown, keep: number): string[] => (Array.isArray(v) ? [...new Set(v.filter(isDay))].sort().slice(-keep) : []);
  const blocks = isInt(o.blocks, 0, 10_000_000) ? o.blocks : 0;
  const w = obj(o.wrote);
  const seen = [...history.map((h) => h.on), ...Object.keys(daily)].filter(isDay).sort();

  return {
    v: 1,
    chapter,
    day,
    practice: o.practice === true && chapter <= CHAPTERS.length,
    tries: isInt(o.tries, 0, STAMP_TRIES) ? o.tries : 0,
    blocks,
    history,
    lastPlayedOn: isDay(o.lastPlayedOn) ? o.lastPlayedOn : null,
    extraOn: isDay(o.extraOn) ? o.extraOn : null,
    daily,
    friends: nums(o.friends, 1, MAX_NUMBER),
    stamps: nums(o.stamps, 1, CHAPTERS.length),
    games,
    firstOn: isDay(o.firstOn) ? o.firstOn : (seen[0] ?? null),
    attend: days(o.attend, ATTEND_KEEP),
    towerPlaced: isInt(o.towerPlaced, 0, blocks) ? o.towerPlaced : 0,
    missionDays: days(o.missionDays, HISTORY_MAX),
    wrote: w && isDay(w.on) ? { on: w.on, nums: nums(w.nums, 1, MAX_NUMBER) } : null,
  };
}

export function normalizeSettings(raw: unknown): Settings {
  const o = obj(raw);
  if (!o) return DEFAULT_SETTINGS;
  return {
    v: 1,
    oneADay: typeof o.oneADay === "boolean" ? o.oneADay : DEFAULT_SETTINGS.oneADay,
    startOn: isDay(o.startOn) ? o.startOn : null,
  };
}
