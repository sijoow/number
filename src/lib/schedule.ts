/**
 * 아이 스케줄 — 부모 페이지 「하온이 스케줄」: 시작한 날·며칠째·공부한 날·연속·달력·앞으로의 놀이.
 * 공부하는 요일은 한글나라 설정을 따른다(lib/hangul) — 두 앱이 같은 요일로 계획을 짠다.
 * 앞으로의 계획은 공부하는 요일마다 오늘의 놀이 하루씩, 도장 놀이는 모두 통과한다고 보고 짠다(연습 놀이가 붙으면 그만큼 밀린다).
 * 날짜는 모두 기기 날짜 'YYYY-MM-DD'(progress.localDay 와 같은 모양).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { CHAPTERS, chapterOf, DAYS_PER_CHAPTER, isStampDay } from "../curriculum/course.ts";
import { EVERY_DAY } from "./hangul.ts";
import { daysBefore, localDay, type Progress, type Settings } from "./progress.ts";

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function partsOf(day: string): [number, number, number] {
  const [y, m, d] = day.split("-").map(Number);
  return [y, m, d];
}

/** 요일 (0=일 … 6=토) */
export function weekdayOf(day: string): number {
  const [y, m, d] = partsOf(day);
  return new Date(y, m - 1, d).getDay();
}

export function addDays(day: string, n: number): string {
  return daysBefore(day, -n);
}

/** from 에서 to 까지 며칠 (같은 날이면 0, to 가 앞이면 음수) */
export function dayDiff(from: string, to: string): number {
  const [y1, m1, d1] = partsOf(from);
  const [y2, m2, d2] = partsOf(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** "10/27(화)" */
export function shortDate(day: string): string {
  const [, m, d] = partsOf(day);
  return `${m}/${d}(${WEEKDAYS[weekdayOf(day)]})`;
}

/** "2026년 10월 15일(목)" */
export function longDate(day: string): string {
  const [y, m, d] = partsOf(day);
  return `${y}년 ${m}월 ${d}일(${WEEKDAYS[weekdayOf(day)]})`;
}

/** 공부한 날 — 오늘의 놀이를 한 날 / 무엇이든 한 날(놀이터·숫자 친구·숫자 쓰기 포함) */
export function studyLog(p: Progress): { adventure: Set<string>; played: Set<string> } {
  const adventure = new Set(p.history.map((r) => r.on).filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)));
  const played = new Set(adventure);
  for (const [d, s] of Object.entries(p.daily)) if (s.ms > 0 || s.acts > 0) played.add(d);
  return { adventure, played };
}

/** 시작한 날 — 부모가 정한 날 > 처음 한 날 > 오늘 */
export function startDay(p: Progress, s: Settings, today: string): string {
  return s.startOn ?? p.firstOn ?? today;
}

export function isStudyDay(day: string, studyDays: readonly number[]): boolean {
  return studyDays.includes(weekdayOf(day));
}

/**
 * 연속으로 공부한 날 — 오늘까지(오늘 아직 안 했으면 어제까지, 오늘은 아직 안 끝났으니까).
 * 쉬는 요일은 건너뛴다(쉬어도 끊기지 않고, 그날 했으면 하루로 센다).
 */
export function streakOf(played: ReadonlySet<string>, today: string, studyDays: readonly number[]): number {
  let n = 0;
  let d = played.has(today) ? today : addDays(today, -1);
  for (let i = 0; i < 1000; i++, d = addDays(d, -1)) {
    if (played.has(d)) n++;
    else if (isStudyDay(d, studyDays)) break;
  }
  return n;
}

export interface PlannedDay {
  on: string;
  chapter: number;
  day: number;
  /** 연습 놀이 날 */
  practice: boolean;
  /** 장 끝 도장 놀이 날 */
  stamp: boolean;
  title: string;
}

/**
 * 앞으로의 놀이 — 공부하는 요일마다 하루씩, 최대 count 개(과정이 끝나면 거기까지).
 * 오늘 놀이를 이미 했으면(그리고 '하나 더'가 안 열렸으면) 내일부터.
 */
export function planAhead(p: Progress, studyDays: readonly number[], today: string, count: number): PlannedDay[] {
  const out: PlannedDay[] = [];
  const days = studyDays.length ? studyDays : EVERY_DAY;
  const doneToday = p.lastPlayedOn === today && p.extraOn !== today;
  let on = doneToday ? addDays(today, 1) : today;
  let { chapter, day, practice } = p;
  while (out.length < count && chapter <= CHAPTERS.length) {
    while (!isStudyDay(on, days)) on = addDays(on, 1);
    const title = chapterOf(chapter)?.title ?? "";
    if (practice) {
      out.push({ on, chapter, day: DAYS_PER_CHAPTER, practice: true, stamp: false, title });
      practice = false;
    } else {
      out.push({ on, chapter, day, practice: false, stamp: isStampDay(day), title });
      if (isStampDay(day)) {
        chapter += 1;
        day = 1;
      } else day += 1;
    }
    on = addDays(on, 1);
  }
  return out;
}

/** 달력 한 달 — 일요일부터 한 주씩, 빈칸은 null. month 는 1~12 */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const lead = new Date(year, month - 1, 1).getDay();
  const last = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: last }, (_, i) => localDay(new Date(year, month - 1, i + 1)))];
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** 이름 뒤에 '가'·'는'을 바로 붙일 수 있게 — 받침이 있으면 '이'를 붙인다(하온 → 하온이, 지수 → 지수) */
export function nickOf(name: string): string {
  const last = name.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return name.trim();
  return code % 28 === 0 ? name.trim() : `${name.trim()}이`;
}
