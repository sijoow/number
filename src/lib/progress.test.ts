import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAPTERS, TOTAL_DAYS } from "../curriculum/course.ts";
import { MAX_NUMBER } from "../curriculum/numbers.ts";
import { familyFromHangul, normalizeFamily } from "./hangul.ts";
import {
  BLOCK_FREE,
  canPlayToday,
  completeSession,
  currentSession,
  DEFAULT_SETTINGS,
  finishGame,
  initialProgress,
  normalizeProgress,
  normalizeSettings,
  progressRate,
  restartAt,
  topNumber,
  type Progress,
} from "./progress.ts";
import { planAhead, streakOf } from "./schedule.ts";

const DAY = "2026-10-27";

/** 지금 판을 정답률 rate 로 끝낸다 */
function play(p: Progress, rate = 1, on = DAY) {
  const ref = currentSession(p);
  assert.ok(ref, "할 판이 있어야");
  const total = 10;
  return completeSession(p, ref, { correct: Math.round(total * rate), total, activities: ref.plan.activities.length }, on);
}

test("처음 — 1장 1일, 친구는 그날 끝내면 들어온다", () => {
  const p = initialProgress();
  const ref = currentSession(p);
  assert.equal(ref?.key, "c1d1");
  const { next, moved } = play(p);
  assert.equal(moved, "day");
  assert.equal(next.day, 2);
  assert.deepEqual(next.friends, [1, 2]);
  assert.equal(next.lastPlayedOn, DAY);
  assert.ok(next.blocks > 0);
  assert.equal(next.firstOn, DAY);
});

test("도장 놀이 통과 → 도장 + 다음 장", () => {
  let p = initialProgress();
  for (let i = 0; i < 4; i++) p = play(p).next;
  assert.equal(currentSession(p)?.plan.stamp, true);
  const { next, moved, record } = play(p, 0.9);
  assert.equal(moved, "stamp");
  assert.equal(record.passed, true);
  assert.deepEqual(next.stamps, [1]);
  assert.equal(next.chapter, 2);
  assert.equal(next.day, 1);
});

test("도장 놀이 실패 → 연습 놀이 → 다시 도장 놀이 → 또 실패면 다음 장(도장 없이)", () => {
  let p = initialProgress();
  for (let i = 0; i < 4; i++) p = play(p).next;
  let r = play(p, 0.5);
  assert.equal(r.moved, "practice");
  assert.equal(r.next.practice, true);
  assert.equal(currentSession(r.next)?.practice, true);
  assert.equal(currentSession(r.next)?.plan.stamp, false);
  r = play(r.next);
  assert.equal(r.next.practice, false);
  assert.equal(currentSession(r.next)?.plan.stamp, true);
  r = play(r.next, 0.5);
  assert.equal(r.moved, "chapter");
  assert.equal(r.next.chapter, 2);
  assert.deepEqual(r.next.stamps, []);
  assert.equal(r.next.tries, 0);
});

test("연습 놀이에서는 친구가 다시 들어오지 않는다 · 기록에 연습이라고 남는다", () => {
  let p = initialProgress();
  for (let i = 0; i < 4; i++) p = play(p).next;
  p = play(p, 0).next;
  const r = play(p);
  assert.equal(r.record.practice, true);
  assert.deepEqual(r.next.friends, [1, 2, 3, 4, 5]);
});

test("하루 한 번 — 하나 더 열기", () => {
  const p = play(initialProgress()).next;
  assert.equal(canPlayToday(p, DEFAULT_SETTINGS, DAY), false);
  assert.equal(canPlayToday({ ...p, extraOn: DAY }, DEFAULT_SETTINGS, DAY), true);
  assert.equal(canPlayToday(p, { ...DEFAULT_SETTINGS, oneADay: false }, DAY), true);
  assert.equal(canPlayToday(p, DEFAULT_SETTINGS, "2026-10-28"), true);
  // 화면 보기 — 정한 방향만 남고, 예전 설정(칸 없음)·잘못된 값은 한글나라 따르기(null)
  assert.equal(normalizeSettings({ ...DEFAULT_SETTINGS, orientation: "landscape" }).orientation, "landscape");
  assert.equal(normalizeSettings({ v: 1, oneADay: false, startOn: null }).orientation, null);
  assert.equal(normalizeSettings({ ...DEFAULT_SETTINGS, orientation: "sideways" }).orientation, null);
  // '하나 더'를 쓰고 나면 닫힌다
  const again = play({ ...p, extraOn: DAY }).next;
  assert.equal(again.extraOn, null);
});

test("과정을 끝까지 — 마지막 날 뒤엔 할 판이 없다", () => {
  let p = initialProgress();
  let n = 0;
  while (currentSession(p) && n < 200) {
    p = play(p).next;
    n++;
  }
  assert.equal(n, TOTAL_DAYS);
  assert.equal(p.chapter, CHAPTERS.length + 1);
  assert.equal(progressRate(p).rate, 1);
  assert.deepEqual(p.friends, Array.from({ length: MAX_NUMBER }, (_, i) => i + 1));
  assert.equal(p.stamps.length, CHAPTERS.length);
  assert.equal(topNumber(p), MAX_NUMBER);
});

test("놀이터 — 놀이마다 하루 첫 판만 블록", () => {
  let p = initialProgress();
  let r = finishGame(p, "count", 60_000, DAY);
  assert.equal(r.earned, BLOCK_FREE);
  p = r.next;
  r = finishGame(p, "count", 60_000, DAY);
  assert.equal(r.earned, 0);
  assert.equal(r.next.games.count.plays, 2);
  assert.equal(finishGame(r.next, "build", 1000, DAY).earned, BLOCK_FREE);
  assert.equal(finishGame(r.next, "count", 1000, "2026-10-28").earned, BLOCK_FREE);
});

test("시작 장 바꾸기 — 앞 장 친구는 만난 것으로", () => {
  const p = restartAt(initialProgress(), 3);
  assert.equal(p.chapter, 3);
  assert.deepEqual(p.friends, [1, 2, 3, 4, 5]);
  assert.equal(topNumber(p), 5);
});

test("깨진 값은 처음부터 — 모양 검사", () => {
  assert.deepEqual(normalizeProgress(null), initialProgress());
  const n = normalizeProgress({ chapter: 99, day: -1, friends: [3, 3, 21, 1], stamps: ["x", 2], blocks: 7, games: { count: { plays: 2, paidOn: DAY }, "BAD KEY": {} } });
  assert.equal(n.chapter, 1);
  assert.equal(n.day, 1);
  assert.deepEqual(n.friends, [1, 3]);
  assert.deepEqual(n.stamps, [2]);
  assert.equal(n.blocks, 7);
  assert.deepEqual(Object.keys(n.games), ["count"]);
});

test("한글나라 설정 받기 — 없는 값은 기본값", () => {
  const f = familyFromHangul({ name: " 하온 " }, { settings: { voice: "sua", orientation: "landscape", studyDays: [5, 1, 1, 9], startOn: "2026-10-20" }, progress: { firstOn: "2026-10-15" } }, 1);
  assert.equal(f.name, "하온");
  assert.equal(f.orientation, "landscape");
  assert.deepEqual(f.studyDays, [1, 5]);
  assert.equal(f.hangulStartOn, "2026-10-20");
  assert.equal(f.found, true);
  const empty = familyFromHangul(null, null, 1);
  assert.equal(empty.found, false);
  assert.equal(empty.orientation, "portrait");
  assert.equal(empty.studyDays.length, 7);
  assert.deepEqual(normalizeFamily(f), f);
});

test("스케줄 — 공부 요일마다 하루씩, 도장 날 표시", () => {
  const p = initialProgress();
  // 2026-10-27 은 화요일 — 월·수·금만 공부하면 수요일부터
  const plan = planAhead(p, [1, 3, 5], DAY, 6);
  assert.deepEqual(
    plan.map((d) => d.on),
    ["2026-10-28", "2026-10-30", "2026-11-02", "2026-11-04", "2026-11-06", "2026-11-09"],
  );
  assert.equal(plan[4].stamp, true);
  assert.equal(plan[5].chapter, 2);
  assert.equal(streakOf(new Set(["2026-10-26", "2026-10-27"]), DAY, [0, 1, 2, 3, 4, 5, 6]), 2);
});
