/**
 * 오늘의 미션 — 하루 셋(2026-10-28 사용자: 일일 미션 느낌, 업체 커리큘럼처럼 교육 목적으로).
 * 토도수학의 「오늘의 목표」(다 하면 COMPLETE 도장)와 「미션」(학습 목표 연습)을 우리 메뉴로 —
 *   ① 오늘의 놀이   그날의 학습 목표
 *   ②③ 놀이 둘     놀이터·숫자 놀이·생각 놀이 중 두 곳에서 하나씩, 날마다 무작위(2026-10-29 사용자: 미션을 깰 때마다 랜덤으로).
 *                  놀이터는 배운 놀이를 한 번 더 — 앞 장에서 배운 놀이를 먼저(나선형 반복, 오늘 배우는 놀이는 빼고)
 *   새 놀이 선물   도장을 받으면 새 놀이가 하나 열린다(curriculum/gifts). 받은 다음 날부터 사흘은 그 놀이가 ② — 먼저 해 보게
 * 무엇을 할지는 날짜와 오늘 아침 진도로 정한다 — 같은 날은 어느 기기에서나 같은 미션이고, 오늘의 놀이를 해서 진도가 넘어가도 그날 미션은 그대로.
 * 다 했는지는 진도 기록으로 본다 — 따로 적지 않는다. 과정을 다 마쳤으면 ①도 놀이터 놀이.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { gameOpens, GAMES } from "../curriculum/games.ts";
import { GIFTS, isGift, type Gift } from "../curriculum/gifts.ts";
import { ORIGINALS } from "../curriculum/originals.ts";
import { THINKS } from "../curriculum/thinks.ts";
import { currentSession, daysBefore, reached, type Progress } from "./progress.ts";

/** 놀이가 있는 메뉴 — 놀이터 · 숫자 놀이 · 생각 놀이 */
export type PlayMenu = "free" | "games" | "think";

export type Mission =
  | { kind: "lesson"; done: boolean }
  /** fresh — 새로 받은 선물 놀이 */
  | { kind: "play"; menu: PlayMenu; game: string; done: boolean; fresh: boolean };

/** 날짜 → 수(FNV-1a) — 같은 날은 늘 같은 미션 */
function seedOf(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pickBy = <T>(seed: number, list: readonly T[]): T => list[seed % list.length];

const playedToday = (p: Progress, id: string, today: string) => p.games[id]?.paidOn === today;

/** 받은 선물 놀이(받은 차례대로) — 도장 받은 날 하나에 하나. before 를 주면 그날 앞까지 받은 것만 */
export function giftsOf(p: Progress, before?: string): Gift[] {
  const n = before === undefined ? p.missionDays.length : p.missionDays.filter((d) => d < before).length;
  return GIFTS.slice(0, n);
}

/** 이 놀이가 열려 있나 — 선물 놀이는 받았을 때만(마스터는 다 열림) */
export function giftOpen(p: Progress, id: string, master: boolean): boolean {
  return master || !isGift(id) || giftsOf(p).some((g) => g.id === id);
}

/** 다음에 받을 선물 — 다 받았으면 null */
export function nextGift(p: Progress): Gift | null {
  return GIFTS[giftsOf(p).length] ?? null;
}

/** 도장을 받아서 새로 열린 선물 — 없으면 null */
export function giftNew(before: Progress, after: Progress): Gift | null {
  const a = giftsOf(before).length;
  const b = giftsOf(after).length;
  return b > a ? (GIFTS[b - 1] ?? null) : null;
}

/** 갓 받은 선물을 ② 로 내놓는 날 수 — 받은 다음 날부터 */
const FRESH_DAYS = 3;

/** 갓 받은 선물 — 오늘 앞에 받은 마지막 선물이 사흘 안에 받은 것이면 */
function freshGift(p: Progress, today: string): Gift | null {
  const days = p.missionDays.filter((d) => d < today).sort();
  const got = GIFTS[days.length - 1];
  const on = days[days.length - 1];
  if (!got || !on) return null;
  for (let k = 1; k <= FRESH_DAYS; k++) if (daysBefore(today, k) === on) return got;
  return null;
}

/** 오늘 아침 진도 — 오늘 처음 끝낸 날의 자리. 오늘의 놀이를 해서 진도가 넘어가도 그날 미션이 바뀌지 않게 */
function dawnOf(p: Progress, today: string): Progress {
  const first = p.history.find((h) => h.on === today);
  return first ? { ...p, chapter: first.chapter, day: first.day, practice: first.practice } : p;
}

/** 놀이터에서 할 놀이 — 열린 놀이 중 오늘 배우는 것은 빼고, 앞 장에서 배운 것을 먼저 */
function reviewPool(p: Progress, skip: ReadonlySet<string>): string[] {
  const open = GAMES.filter((g) => {
    const o = gameOpens(g);
    return reached(p, o.chapter, o.day);
  });
  const notToday = open.filter((g) => !skip.has(g.id));
  const earlier = notToday.filter((g) => gameOpens(g).chapter < p.chapter);
  const pool = earlier.length ? earlier : notToday.length ? notToday : open;
  return (pool.length ? pool : GAMES.slice(0, 1)).map((g) => g.id);
}

/** 미션으로 안 내는 놀이 — 주사위 윷놀이는 한 판이 길다(둘이·셋이 판 놀이) */
const NOT_MISSION = new Set<string>(["yut"]);

/** 메뉴마다 미션으로 낼 놀이 — 선물 놀이는 받은 것만 */
function poolOf(menu: PlayMenu, dawn: Progress, skip: ReadonlySet<string>, gifts: readonly Gift[]): string[] {
  if (menu === "free") return reviewPool(dawn, skip);
  const got = (id: string) => !NOT_MISSION.has(id) && (!isGift(id) || gifts.some((g) => g.id === id));
  return (menu === "games" ? ORIGINALS : THINKS).map((g) => g.id).filter(got);
}

/** ②③ 이 나올 두 메뉴 — 날마다 돌아가며(같은 메뉴 둘은 나오지 않는다) */
const PAIRS: readonly (readonly [PlayMenu, PlayMenu])[] = [
  ["free", "games"],
  ["free", "think"],
  ["games", "think"],
  ["games", "free"],
  ["think", "free"],
  ["think", "games"],
];

const MENUS: readonly PlayMenu[] = ["free", "games", "think"];

export function todayMissions(p: Progress, today: string): Mission[] {
  const seed = seedOf(today);
  const dawn = dawnOf(p, today);
  const session = currentSession(dawn);
  const skip = new Set<string>(session?.plan.activities.map((a) => a.kind) ?? []);
  const gifts = giftsOf(p, today);
  const play = (menu: PlayMenu, game: string, fresh = false): Mission => ({ kind: "play", menu, game, done: playedToday(p, game, today), fresh });
  const pickIn = (menu: PlayMenu, salt: number) => pickBy(seed >>> salt, poolOf(menu, dawn, skip, gifts));

  const gift = freshGift(p, today);
  let pair: readonly [Mission, Mission];
  if (gift) {
    const other = pickBy(seed >>> 5, MENUS.filter((m) => m !== gift.menu));
    pair = [play(gift.menu, gift.id, true), play(other, pickIn(other, 9))];
  } else {
    const [a, b] = pickBy(seed >>> 3, PAIRS);
    pair = [play(a, pickIn(a, 7)), play(b, pickIn(b, 13))];
  }

  if (session) return [{ kind: "lesson", done: p.lastPlayedOn === today }, ...pair];
  // 과정을 다 마쳤으면 ①도 놀이터 놀이 — 둘째·셋째와 겹치지 않게
  const taken = pair.map((m) => (m.kind === "play" ? m.game : ""));
  const pool = reviewPool(dawn, skip);
  return [play("free", pool.find((g) => !taken.includes(g)) ?? pool[0]), ...pair];
}

/** 오늘의 친구 — 만난 친구 중 날마다 한 명(첫 화면에 놀러 온다). 아직 아무도 안 만났으면 null */
export function todayFriend(p: Progress, today: string): number | null {
  return p.friends.length ? pickBy(seedOf(today) >>> 11, p.friends) : null;
}

/** 미션 판 — 셋 다 했나, 도장을 받았나 */
export function missionState(p: Progress, today: string): { list: Mission[]; allDone: boolean; claimed: boolean } {
  const list = todayMissions(p, today);
  return { list, allDone: list.every((m) => m.done), claimed: p.missionDays.includes(today) };
}
