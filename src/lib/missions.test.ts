import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAPTERS, dayPlan } from "../curriculum/course.ts";
import { GAMES } from "../curriculum/games.ts";
import { ORIGINALS } from "../curriculum/originals.ts";
import { missionState, todayMissions, todayFriend } from "./missions.ts";
import {
  BLOCK_CHALLENGE,
  BLOCK_MISSION,
  BLOCK_TRAIN,
  blocksFor,
  checkIn,
  claimMissions,
  finishGame,
  initialProgress,
  normalizeProgress,
  noteWrite,
  placeBlock,
  restartAt,
  TRAIN_CARS,
  trainOf,
  VILLAGE_BLOCKS,
  villageOf,
  wallet,
  type Progress,
} from "./progress.ts";
import { buildSession, seededRng } from "./rounds.ts";

/** 2026-10-01 부터 n 일째 */
const dayN = (n: number) => `2026-10-${String(n).padStart(2, "0")}`;

test("출석 기차 — 하루 한 번, 일곱째 날 기차 출발 + 블록, 다음 날 새 기차", () => {
  let p = initialProgress();
  for (let d = 1; d <= TRAIN_CARS; d++) {
    const res = checkIn(p, dayN(d));
    assert.equal(res.car, d);
    assert.equal(res.departed, d === TRAIN_CARS);
    p = res.next;
    // 같은 날 두 번은 안 탄다
    assert.equal(checkIn(p, dayN(d)).car, 0);
    assert.deepEqual(trainOf(p, dayN(d)), { count: d, checked: true, train: 1, boarded: d });
  }
  assert.equal(p.blocks, BLOCK_TRAIN);
  // 다음 날 — 빈 새 기차(2호), 빠진 날이 있어도 이어서 탄다
  assert.deepEqual(trainOf(p, dayN(20)), { count: 7, checked: false, train: 2, boarded: 0 });
  const next = checkIn(p, dayN(20));
  assert.equal(next.car, 1);
  assert.deepEqual(trainOf(next.next, dayN(20)), { count: 8, checked: true, train: 2, boarded: 1 });
});

test("친구 집 짓기 — 친구 숫자만큼 블록이 한 집(일 1 · 이 2 · 삼 3 …), 남은 블록만 쓴다", () => {
  let p: Progress = { ...initialProgress(), blocks: 8 };
  const done: number[] = [];
  for (let i = 1; i <= 8; i++) {
    const res = placeBlock(p);
    assert.equal(res.placed, i);
    if (res.houseDone) done.push(res.houseDone);
    p = res.next;
  }
  // 1 → 일, 1+2 = 3 → 이, 1+2+3 = 6 → 삼, 남은 둘은 사 집에
  assert.deepEqual(done, [1, 2, 3]);
  assert.deepEqual(villageOf(p.towerPlaced), { village: 1, built: 3, current: 4, have: 2 });
  assert.equal(wallet(p), 0);
  // 블록이 없으면 그대로
  assert.equal(placeBlock(p).next, p);
  // 이십까지 다 지으면(210개) 새 마을의 일부터
  assert.equal(VILLAGE_BLOCKS, 210);
  assert.deepEqual(villageOf(VILLAGE_BLOCKS - 1), { village: 1, built: 19, current: 20, have: 19 });
  const last = placeBlock({ ...initialProgress(), blocks: VILLAGE_BLOCKS, towerPlaced: VILLAGE_BLOCKS - 1 });
  assert.equal(last.houseDone, 20);
  assert.deepEqual(villageOf(last.placed), { village: 2, built: 0, current: 1, have: 0 });
});

test("도전 판 — 오늘의 놀이 날만(도장 날은 그대로), 범위 안의 수", () => {
  for (const c of CHAPTERS) {
    for (let d = 1; d <= 5; d++) {
      const plan = dayPlan(c.no, d);
      if (!plan) continue;
      const built = buildSession(plan, seededRng(c.no * 10 + d));
      built.forEach((b, i) => {
        if (!("rounds" in b)) return;
        const last = b.rounds[b.rounds.length - 1] as { challenge?: boolean };
        if (plan.stamp) assert.ok(!last.challenge, `${c.code} ${d}일 도장 날엔 도전 판이 없다`);
        const spec = plan.activities[i];
        if (!last.challenge || !("range" in spec)) return;
        const [lo, hi] = spec.range;
        const nums = JSON.stringify(b.rounds[b.rounds.length - 1]).match(/"(?:n|left|right|answer)":(\d+)/g) ?? [];
        for (const m of nums) {
          const v = Number(m.split(":")[1]);
          assert.ok(v >= Math.min(lo, hi) && v <= Math.max(lo, hi), `${c.code} ${spec.kind} 도전 판 수 ${v} 가 범위 밖`);
        }
      });
    }
  }
  assert.equal(blocksFor(dayPlan(1, 1)!, { correct: 0, total: 0, activities: 0, bonus: 2 }) - blocksFor(dayPlan(1, 1)!, { correct: 0, total: 0, activities: 0 }), 2 * BLOCK_CHALLENGE);
});

test("오늘의 미션 — 같은 날은 같은 셋, 다 하면 도장 + 블록(하루 한 번)", () => {
  // 3장까지 와서 친구 다섯을 만난 아이
  const base = restartAt(initialProgress(), 3);
  const day = dayN(5);
  const a = todayMissions(base, day);
  assert.deepEqual(a, todayMissions(base, day));
  assert.equal(a.length, 3);
  assert.equal(a[0].kind, "lesson");
  assert.equal(a[1].kind, "free");
  // 복습 놀이는 이미 열린 놀이
  if (a[1].kind === "free") assert.ok(GAMES.some((g) => g.id === (a[1] as { game: string }).game));
  assert.ok(a.every((m) => !m.done));

  // 셋 다 해 본다
  let p: Progress = { ...base, lastPlayedOn: day };
  for (const m of a) {
    if (m.kind === "free" || m.kind === "game") p = finishGame(p, m.game, 1000, day).next;
    if (m.kind === "write") p = noteWrite(p, m.n, day);
  }
  const st = missionState(p, day);
  assert.ok(st.allDone);
  assert.ok(!st.claimed);
  const before = p.blocks;
  const claimed = claimMissions(p, day);
  assert.equal(claimed.next.blocks - before, BLOCK_MISSION);
  assert.ok(missionState(claimed.next, day).claimed);
  assert.equal(claimMissions(claimed.next, day).earned, 0);
});

test("오늘의 미션 — 여러 날에 걸쳐 쓰기·숫자 놀이가 번갈아 나오고, 쓰기는 만난 친구 숫자", () => {
  const p = restartAt(initialProgress(), 8);
  const kinds = new Set<string>();
  for (let d = 1; d <= 28; d++) {
    const third = todayMissions(p, dayN(d))[2];
    kinds.add(third.kind);
    if (third.kind === "write") assert.ok(p.friends.includes(third.n));
    if (third.kind === "game") assert.ok(ORIGINALS.some((o) => o.id === third.game));
  }
  assert.deepEqual([...kinds].sort(), ["game", "write"]);
  // 친구를 아직 안 만났으면 쓰기 대신 숫자 놀이, 오늘의 친구도 없다
  const fresh = initialProgress();
  for (let d = 1; d <= 10; d++) assert.notEqual(todayMissions(fresh, dayN(d))[2].kind, "write");
  assert.equal(todayFriend(fresh, dayN(1)), null);
  assert.ok(p.friends.includes(todayFriend(p, dayN(3)) ?? -1));
});

test("저장 값 검사 — 새 칸(출석·탑·미션·쓰기)을 지키고, 탑은 모은 블록을 넘지 못한다", () => {
  const raw = { ...initialProgress(), blocks: 5, towerPlaced: 9, attend: [dayN(2), "bad", dayN(1), dayN(2)], missionDays: [dayN(1)], wrote: { on: dayN(1), nums: [3, 3, 99] } };
  const p = normalizeProgress(raw);
  assert.deepEqual(p.attend, [dayN(1), dayN(2)]);
  assert.equal(p.towerPlaced, 0);
  assert.deepEqual(p.missionDays, [dayN(1)]);
  assert.deepEqual(p.wrote, { on: dayN(1), nums: [3] });
  // 예전 저장 값(새 칸 없음)도 그대로 열린다
  const old = normalizeProgress({ ...initialProgress(), attend: undefined, towerPlaced: undefined });
  assert.deepEqual(old.attend, []);
  assert.equal(old.towerPlaced, 0);
});
