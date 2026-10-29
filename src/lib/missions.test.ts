import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAPTERS, dayPlan } from "../curriculum/course.ts";
import { GIFTS, isGift } from "../curriculum/gifts.ts";
import { giftNew, giftOpen, giftsOf, missionState, nextGift, todayMissions, todayFriend } from "./missions.ts";
import {
  BLOCK_CHALLENGE,
  BLOCK_MISSION,
  BLOCK_TRAIN,
  blocksFor,
  checkIn,
  claimMissions,
  completeSession,
  currentSession,
  finishGame,
  initialProgress,
  normalizeProgress,
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
  // ②③ 은 서로 다른 메뉴의 놀이
  const [, b, c] = a;
  assert.ok(b.kind === "play" && c.kind === "play" && b.menu !== c.menu);
  assert.ok(a.every((m) => !m.done));

  // 셋 다 해 본다
  let p: Progress = { ...base, lastPlayedOn: day };
  for (const m of a) {
    if (m.kind === "play") p = finishGame(p, m.game, 1000, day).next;
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

test("오늘의 미션 — ②③ 은 놀이터·숫자 놀이·생각 놀이에서 날마다 돌아가며, 선물 놀이는 받은 것만", () => {
  const p = restartAt(initialProgress(), 8);
  const menus = new Set<string>();
  for (let d = 1; d <= 28; d++) {
    for (const m of todayMissions(p, dayN(d)).slice(1)) {
      assert.equal(m.kind, "play");
      if (m.kind !== "play") continue;
      menus.add(m.menu);
      assert.ok(!isGift(m.game), `${m.game}: 받지 않은 선물 놀이`);
      assert.notEqual(m.game, "yut");
    }
  }
  assert.deepEqual([...menus].sort(), ["free", "games", "think"]);
  // 친구를 아직 안 만났으면 오늘의 친구가 없다
  const fresh = initialProgress();
  assert.equal(todayFriend(fresh, dayN(1)), null);
  assert.ok(p.friends.includes(todayFriend(p, dayN(3)) ?? -1));
});

test("오늘의 미션 — 오늘의 놀이를 해서 진도가 넘어가도 그날 미션은 그대로", () => {
  const base = restartAt(initialProgress(), 3);
  const day = dayN(5);
  const a = todayMissions(base, day);
  const ref = currentSession(base);
  assert.ok(ref);
  const after = completeSession(base, ref, { correct: 3, total: 3, activities: ref.plan.activities.length }, day).next;
  const b = todayMissions(after, day);
  assert.deepEqual(b.slice(1), a.slice(1));
  assert.deepEqual(b[0], { kind: "lesson", done: true });
});

test("새 놀이 선물 — 도장 하나에 하나씩 차례로 열리고, 받은 다음 날부터 사흘은 ② 가 그 놀이", () => {
  let p = restartAt(initialProgress(), 3);
  assert.deepEqual(giftsOf(p), []);
  assert.deepEqual(nextGift(p), GIFTS[0]);
  assert.ok(!giftOpen(p, GIFTS[0].id, false));
  assert.ok(giftOpen(p, GIFTS[0].id, true), "마스터는 다 열림");
  assert.ok(giftOpen(p, "mirror", false), "원래 있던 놀이는 늘 열림");
  const day = dayN(5);
  const before = p;
  p = claimMissions(p, day).next;
  assert.deepEqual(giftNew(before, p), GIFTS[0]);
  assert.equal(giftNew(p, p), null);
  assert.ok(giftOpen(p, GIFTS[0].id, false));
  // 받은 날은 미션이 그대로(도장 판이 다시 비지 않게)
  assert.deepEqual(todayMissions(p, day), todayMissions(before, day));
  for (const k of [1, 2, 3]) {
    const m = todayMissions(p, dayN(5 + k))[1];
    assert.ok(m.kind === "play" && m.game === GIFTS[0].id && m.fresh, `${k}일 뒤 ② 는 새 놀이`);
  }
  const later = todayMissions(p, dayN(9))[1];
  assert.ok(later.kind === "play" && !later.fresh);
  p = claimMissions(p, dayN(6)).next;
  assert.deepEqual(giftsOf(p), GIFTS.slice(0, 2));
  // 다 받으면 더 없다
  const all = { ...p, missionDays: Array.from({ length: GIFTS.length + 2 }, (_, i) => dayN(i + 1)) };
  assert.equal(nextGift(all), null);
  assert.equal(giftsOf(all).length, GIFTS.length);
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
