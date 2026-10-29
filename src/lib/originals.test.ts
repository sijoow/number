import assert from "node:assert/strict";
import { test } from "node:test";
import { GIFTS } from "../curriculum/gifts.ts";
import { ORIGINALS } from "../curriculum/originals.ts";
import { THINKS } from "../curriculum/thinks.ts";
import {
  boardRounds,
  buildOriginal,
  drumRounds,
  eggRounds,
  hideRounds,
  makerRounds,
  mealRounds,
  moreLessGame,
  partsRounds,
  rocketRounds,
  seesawRounds,
  seesawTilt,
  shadowRounds,
  shareRounds,
  tenRounds,
  trainRounds,
} from "./originals.ts";
import { seededRng } from "./rounds.ts";

test("숫자 놀이 — 여섯 + 선물 아홉, 진도 기록 열쇠로 쓸 수 있는 id, 모두 판을 만든다", () => {
  assert.equal(ORIGINALS.length, 15);
  for (const o of ORIGINALS) assert.match(o.id, /^[a-z-]{2,20}$/);
  assert.equal(new Set(ORIGINALS.map((o) => o.id)).size, ORIGINALS.length);
  for (const o of ORIGINALS) for (const top of [3, 5, 10, 20]) assert.equal(buildOriginal(o.id, top, seededRng(top)).id, o.id);
});

test("선물 놀이 — 숫자 놀이·생각 놀이에 있는 것만, 겹치지 않고, 다른 메뉴 놀이와 이름이 겹치지 않는다", () => {
  assert.equal(new Set(GIFTS.map((g) => g.id)).size, GIFTS.length);
  for (const g of GIFTS) assert.ok((g.menu === "games" ? ORIGINALS : THINKS).some((o) => o.id === g.id), g.id);
  const ids = [...ORIGINALS, ...THINKS].map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length);
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

test("알 속 숫자 — 이어진 수, ? 자리가 여러 곳, 정답이 보기 안에", () => {
  for (const top of [3, 4, 7, 20]) {
    const rounds = eggRounds(top, 4, seededRng(top));
    const gaps = new Set(rounds.map((r) => r.gap));
    assert.ok(gaps.size >= 3, "? 가 맨 끝에만 있지 않다");
    for (const r of rounds) {
      assert.equal(r.nums.length, Math.min(4, top));
      r.nums.forEach((n, i) => i && assert.equal(n, r.nums[i - 1] + 1));
      assert.ok(r.nums.every((n) => n >= 1 && n <= top));
      assert.ok(r.choices.includes(r.nums[r.gap]));
      assert.equal(new Set(r.choices).size, r.choices.length);
    }
  }
});

test("몇이랑 몇? — 들어 있는 친구 + 정답 = 상자 수, 정답이 보기 안에", () => {
  for (const top of [3, 6, 10, 20]) {
    for (const r of partsRounds(top, 12, seededRng(top))) {
      assert.ok(r.whole >= 2 && r.whole <= Math.min(10, top));
      assert.ok(r.have >= 1 && r.have < r.whole);
      assert.ok(r.choices.includes(r.whole - r.have));
      assert.ok(r.choices.every((c) => c >= 1 && c <= 9));
    }
  }
});

test("하나 더 · 하나 덜 — 목표는 앞 수와 한두 칸 차이, 위로도 아래로도", () => {
  for (const top of [3, 5, 10]) {
    for (let s = 1; s <= 20; s++) {
      const g = moreLessGame(top, seededRng(s));
      let cur = g.start;
      for (const t of g.targets) {
        assert.ok(t >= 1 && t <= Math.min(10, top));
        assert.ok(Math.abs(t - cur) >= 1 && Math.abs(t - cur) <= 2, cur + " → " + t);
        cur = t;
      }
    }
    const moves = moreLessGame(top, seededRng(9));
    const ups = moves.targets.filter((t, i) => t > (i ? moves.targets[i - 1] : moves.start)).length;
    assert.ok(ups > 0 && ups < moves.targets.length, "올라가기·내려가기가 섞인다");
  }
});

test("숨은 친구 찾기 — 끝 수는 빼고, 같은 자리가 연달아 나오지 않는다", () => {
  for (const top of [3, 7, 20]) {
    const rounds = hideRounds(top, seededRng(top));
    assert.equal(rounds.length, 4);
    rounds.forEach((r, i) => {
      assert.ok(r.n >= 1 && r.n < r.end);
      if (i) assert.notEqual(r.n, rounds[i - 1].n);
    });
    assert.equal(rounds[3].end, top >= 7 ? 10 : 5);
  }
});

test("식사 시간 — 다섯 판 중 둘은 같고, 나머지는 다르다", () => {
  for (const top of [3, 6, 20]) {
    const rounds = mealRounds(top, seededRng(top));
    assert.equal(rounds.filter((r) => r.left === r.right).length, 2);
    for (const r of rounds) {
      assert.ok(r.left >= 1 && r.left <= 6 && r.right >= 1 && r.right <= 6);
      assert.notEqual(r.friends[0], r.friends[1]);
    }
  }
});

test("숫자 열차 — 이어진 수, 승강장은 섞여 있다", () => {
  for (const top of [3, 4, 10]) {
    for (const r of trainRounds(top, seededRng(top))) {
      r.nums.forEach((n, i) => i && assert.equal(n, r.nums[i - 1] + 1));
      assert.deepEqual([...r.platform].sort((a, b) => a - b), r.nums);
      assert.ok(r.platform.some((n, i) => n !== r.nums[i]));
      assert.ok(r.nums[r.nums.length - 1] <= Math.max(3, Math.min(10, top)));
    }
  }
});

test("로켓 발사 — 셋 이상 열 이하, 작은 수부터", () => {
  for (const top of [3, 5, 20]) {
    const rounds = rocketRounds(top, seededRng(top));
    assert.equal(rounds.length, 3);
    assert.deepEqual(rounds, [...rounds].sort((a, b) => a - b));
    assert.ok(rounds.every((n) => n >= 3 && n <= Math.min(10, Math.max(3, top))));
  }
});

test("열 칸 채우기 — 열까지만 알면 채우기 셋, 열하나 넘게 알면 채우기 + 열과 몇", () => {
  const small = tenRounds(8, seededRng(1));
  assert.ok(small.every((r) => r.mode === "fill" && r.pre >= 0 && r.pre < 10));
  const big = tenRounds(14, seededRng(2));
  assert.equal(big[0].mode, "fill");
  for (const r of big.slice(1)) {
    assert.equal(r.mode, "teen");
    if (r.mode !== "teen") continue;
    assert.ok(r.extra >= 1 && r.extra <= 4);
    assert.ok(r.choices.includes(10 + r.extra));
    assert.ok(r.choices.every((c) => c >= 10 && c <= 20));
  }
});

test("숫자 판 — 빈칸 셋(1 은 빼고), 첫 판은 아는 수 안에서", () => {
  for (const top of [3, 6, 15]) {
    const rounds = boardRounds(top, seededRng(top));
    for (const r of rounds) {
      assert.equal(r.size, top >= 11 ? 20 : 10);
      assert.equal(new Set(r.blanks).size, 3);
      assert.ok(r.blanks.every((b) => b >= 2 && b <= r.size));
    }
    assert.ok(rounds[0].blanks.every((b) => b <= Math.max(4, top)));
  }
});
