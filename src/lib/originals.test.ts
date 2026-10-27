import assert from "node:assert/strict";
import { test } from "node:test";
import { ORIGINALS } from "../curriculum/originals.ts";
import { buildOriginal, drumRounds, makerRounds, seesawRounds, seesawTilt, shadowRounds, shareRounds } from "./originals.ts";
import { seededRng } from "./rounds.ts";

test("숫자 놀이 — 여섯 가지, 진도 기록 열쇠로 쓸 수 있는 id", () => {
  assert.equal(ORIGINALS.length, 6);
  for (const o of ORIGINALS) assert.match(o.id, /^[a-z-]{2,20}$/);
  assert.equal(new Set(ORIGINALS.map((o) => o.id)).size, 6);
});

test("그림자 친구 — 아는 수 안에서, 정답이 보기 안에", () => {
  for (const top of [3, 5, 10, 20]) {
    for (const r of shadowRounds(top, 20, seededRng(top))) {
      assert.ok(r.n >= 1 && r.n <= top);
      assert.ok(r.choices.includes(r.n));
      assert.ok(r.choices.every((c) => c >= 1 && c <= top));
    }
  }
});

test("시소 — 맞히기 둘은 서로 다른 수, 똑같게 둘은 열까지 · 무거운 쪽으로 기운다", () => {
  const rounds = seesawRounds(20, seededRng(4));
  assert.deepEqual(
    rounds.map((r) => r.mode),
    ["guess", "guess", "even", "even"],
  );
  for (const r of rounds) {
    if (r.mode === "guess") assert.notEqual(r.left, r.right);
    assert.ok(r.left >= 1 && r.left <= 10);
  }
  assert.ok(seesawTilt(2, 5) > 0);
  assert.ok(seesawTilt(5, 2) < 0);
  assert.equal(seesawTilt(4, 4), 0);
  assert.equal(seesawTilt(1, 10), 14);
});

test("블록 친구 만들기 — 십까지 서로 다른 친구 넷, 작은 수부터, 네모 모양 친구가 하나는", () => {
  for (const top of [3, 5, 10, 20]) {
    for (let seed = 1; seed < 30; seed++) {
      const r = makerRounds(top, 4, seededRng(seed));
      assert.ok(r.every((n) => n >= 1 && n <= Math.min(10, top)));
      assert.equal(new Set(r).size, r.length);
      assert.deepEqual([...r].sort((a, b) => a - b), r);
      if (top >= 4) assert.ok(r.some((n) => [4, 6, 8, 9].includes(n)), `${top}: ${r}`);
    }
  }
});

test("판 만들기 — 여섯 놀이 모두, 아는 친구가 셋보다 적어도 셋까지", () => {
  for (const o of ORIGINALS) assert.equal(buildOriginal(o.id, 1, seededRng(3)).id, o.id);
  const yut = buildOriginal("yut", 1, seededRng(3));
  assert.ok(yut.id === "yut" && yut.known === 3);
  // 윷놀이 캐릭터는 십까지만(사용자: 너무 많다)
  const many = buildOriginal("yut", 20, seededRng(3));
  assert.ok(many.id === "yut" && many.known === 10);
});

test("간식 나누기 — 쿠키는 친구 수로 똑같이 나뉘고, 한 친구 몫은 1~5", () => {
  for (const top of [3, 5, 9, 20]) {
    for (const r of shareRounds(top, 3, seededRng(top))) {
      assert.equal(r.cookies % r.friends.length, 0);
      const each = r.cookies / r.friends.length;
      assert.ok(each >= 1 && each <= 5);
      assert.equal(new Set(r.friends).size, r.friends.length);
    }
  }
  // 아홉까지 알면 마지막 판은 셋이 나눈다
  assert.equal(shareRounds(9, 3, seededRng(1))[2].friends.length, 3);
});

test("북소리 세기 — 여섯까지만, 정답이 보기 안에", () => {
  for (const r of drumRounds(20, 30, seededRng(2))) {
    assert.ok(r.n >= 1 && r.n <= 6);
    assert.ok(r.choices.includes(r.n));
  }
});
