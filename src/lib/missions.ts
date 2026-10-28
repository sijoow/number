/**
 * 오늘의 미션 — 하루 셋(2026-10-28 사용자: 일일 미션 느낌, 업체 커리큘럼처럼 교육 목적으로).
 * 토도수학의 「오늘의 목표」(다 하면 COMPLETE 도장)와 「미션」(학습 목표 연습)을 우리 메뉴로 —
 *   ① 오늘의 놀이           그날의 학습 목표
 *   ② 복습 놀이(놀이터)      배운 목표를 한 번 더 — 앞 장에서 배운 놀이를 먼저(나선형 반복, 오늘 배운 놀이는 빼고)
 *   ③ 숫자 쓰기 / 숫자 놀이  날마다 번갈아 — 쓰기는 최근에 만난 친구의 숫자, 숫자 놀이는 오리지널 게임 하나
 * 무엇을 할지는 날짜로 정한다(같은 날은 어느 기기에서나 같은 미션). 다 했는지는 진도 기록으로 본다 — 따로 적지 않는다.
 * 과정을 다 마쳤으면 ①은 복습 놀이 하나 더.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { gameOpens, GAMES } from "../curriculum/games.ts";
import { ORIGINALS, type OriginalId } from "../curriculum/originals.ts";
import type { ActivityKind } from "../curriculum/types.ts";
import { currentSession, reached, type Progress } from "./progress.ts";

export type Mission =
  | { kind: "lesson"; done: boolean }
  | { kind: "free"; game: ActivityKind; done: boolean }
  | { kind: "game"; game: OriginalId; done: boolean }
  | { kind: "write"; n: number; done: boolean };

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

/** 복습할 놀이 — 열린 놀이 중 오늘 배우는 것은 빼고, 앞 장에서 배운 것을 먼저 */
function reviewPool(p: Progress, skip: ReadonlySet<string>): ActivityKind[] {
  const open = GAMES.filter((g) => {
    const o = gameOpens(g);
    return reached(p, o.chapter, o.day);
  });
  const notToday = open.filter((g) => !skip.has(g.id));
  const earlier = notToday.filter((g) => gameOpens(g).chapter < p.chapter);
  const pool = earlier.length ? earlier : notToday.length ? notToday : open;
  return (pool.length ? pool : GAMES.slice(0, 1)).map((g) => g.id);
}

export function todayMissions(p: Progress, today: string): Mission[] {
  const seed = seedOf(today);
  const session = currentSession(p);
  const lessonKinds = new Set<string>(session?.plan.activities.map((a) => a.kind) ?? []);
  const pool = reviewPool(p, lessonKinds);
  const review = pickBy(seed, pool);
  const free = (game: ActivityKind): Mission => ({ kind: "free", game, done: playedToday(p, game, today) });

  const first: Mission = session ? { kind: "lesson", done: p.lastPlayedOn === today } : free(pool.find((g) => g !== review) ?? review);
  // 쓰기는 만난 친구가 있어야 — 최근에 만난 친구(마지막 다섯) 중에서
  const recent = p.friends.slice(-5);
  const write = recent.length > 0 && (seed >>> 4) % 2 === 0;
  const third: Mission = write
    ? (() => {
        const n = pickBy(seed >>> 7, recent);
        return { kind: "write", n, done: p.wrote?.on === today && p.wrote.nums.includes(n) };
      })()
    : (() => {
        const game = pickBy(seed >>> 9, ORIGINALS).id;
        return { kind: "game", game, done: playedToday(p, game, today) };
      })();
  return [first, free(review), third];
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
