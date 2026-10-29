import assert from "node:assert/strict";
import { test } from "node:test";
import { THINKS } from "../curriculum/thinks.ts";
import { seededRng } from "./rounds.ts";
import { buildThink, matrixRounds, MIRROR_COLS, MIRROR_ROWS, memoryRounds, mirrorOf, mirrorRounds, sequenceRounds, whoHidRounds } from "./thinks.ts";

test("생각 놀이 — 셋 + 선물 둘, 이름이 겹치지 않고 모두 판을 만든다", () => {
  assert.equal(THINKS.length, 5);
  assert.equal(new Set(THINKS.map((t) => t.id)).size, THINKS.length);
  for (const t of THINKS) assert.equal(buildThink(t.id, 3, seededRng(1)).id, t.id);
});

test("거울 그림 — 비친 자리는 같은 줄, 두 번 비치면 제자리", () => {
  assert.equal(mirrorOf(0), MIRROR_COLS - 1);
  for (let c = 0; c < MIRROR_ROWS * MIRROR_COLS; c++) {
    assert.equal(mirrorOf(mirrorOf(c)), c);
    assert.equal(Math.floor(mirrorOf(c) / MIRROR_COLS), Math.floor(c / MIRROR_COLS));
  }
  const rounds = mirrorRounds(seededRng(4));
  assert.deepEqual(
    rounds.map((r) => r.left.length),
    [2, 3, 4],
  );
  for (const r of rounds) {
    assert.deepEqual(r.answer, r.left.map(mirrorOf).sort((a, b) => a - b));
    assert.equal(new Set(r.left).size, r.left.length);
  }
});

test("짝 맞추기 — 친구마다 카드 두 장, 아는 친구까지", () => {
  for (const top of [1, 3, 5, 10, 20]) {
    for (const r of memoryRounds(top, seededRng(top))) {
      const count = new Map<number, number>();
      for (const n of r.cards) count.set(n, (count.get(n) ?? 0) + 1);
      assert.ok([...count.values()].every((v) => v === 2));
      assert.ok(r.cards.every((n) => n >= 1 && n <= Math.min(10, Math.max(3, top))));
    }
  }
});

test("누가 숨었을까 — 숨은 친구가 보기에 있고, 보기는 서로 다르다", () => {
  for (const top of [3, 4, 10]) {
    for (let s = 0; s < 20; s++) {
      for (const r of whoHidRounds(top, seededRng(s))) {
        assert.ok(r.friends.length >= 2 && r.hidden >= 0 && r.hidden < r.friends.length);
        assert.equal(new Set(r.friends).size, r.friends.length);
        assert.ok(r.choices.includes(r.friends[r.hidden]));
        assert.equal(new Set(r.choices).size, r.choices.length);
        // 무대에 남은 친구 하나와 처음부터 없던 친구 하나(아는 친구가 셋이면 무대 둘 + 없던 친구 하나)
        assert.ok(r.choices.some((n) => r.friends.includes(n) && n !== r.friends[r.hidden]));
        assert.ok(r.choices.some((n) => !r.friends.includes(n)));
      }
    }
  }
});

test("순서 기억하기 — 둘 → 셋 → 넷, 같은 친구는 한 번만, 아는 친구가 셋이면 셋까지", () => {
  const rounds = sequenceRounds(8, seededRng(3));
  assert.deepEqual(
    rounds.map((r) => r.order.length),
    [2, 3, 4],
  );
  for (const r of rounds) {
    assert.equal(new Set(r.order).size, r.order.length);
    assert.ok(r.order.every((i) => i >= 0 && i < r.friends.length));
    assert.ok(r.friends.every((n) => n >= 1 && n <= 8));
  }
  const small = sequenceRounds(3, seededRng(4));
  assert.ok(small.every((r) => r.friends.length === 3 && r.order.length <= 3));
});

test("빈칸 채우기 — 줄은 모양, 칸은 색. 보기 셋 중 정답은 하나", () => {
  for (const r of matrixRounds(seededRng(5))) {
    const n = r.shapes.length;
    assert.equal(r.colors.length, n);
    assert.ok(r.blank >= 0 && r.blank < n * n);
    const want = { shape: r.shapes[Math.floor(r.blank / n)], color: r.colors[r.blank % n] };
    assert.equal(r.choices.filter((c) => c.shape === want.shape && c.color === want.color).length, 1);
    assert.equal(r.choices.length, 3);
    assert.ok(!r.colors.includes("#f5a742"));
  }
});
