import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAPTERS, dayPlan } from "../curriculum/course.ts";
import { GAMES } from "../curriculum/games.ts";
import { buildActivity, buildSession, FARM_ANIMALS, numberChoices, numbersFor, seededRng, spotsFor } from "./rounds.ts";

test("판마다 쓸 수 — 범위 안, 같은 수가 연달아 나오지 않는다", () => {
  const rng = seededRng(7);
  for (let k = 0; k < 50; k++) {
    const nums = numbersFor([2, 5], 9, rng);
    assert.equal(nums.length, 9);
    assert.ok(nums.every((n) => n >= 2 && n <= 5));
    for (let i = 1; i < nums.length; i++) assert.notEqual(nums[i], nums[i - 1]);
  }
});

test("숫자 보기 — 정답이 꼭 있고 겹치지 않는다", () => {
  const rng = seededRng(3);
  for (let k = 0; k < 100; k++) {
    const target = 1 + (k % 10);
    const c = numberChoices(target, [1, 10], 3, rng);
    assert.equal(c.length, 3);
    assert.ok(c.includes(target));
    assert.equal(new Set(c).size, 3);
  }
  // 범위에 둘뿐이면 보기도 둘
  assert.deepEqual(numberChoices(1, [1, 2], 3, seededRng(1)).sort(), [1, 2]);
});

test("물건 자리 — 개수만큼, 판 안", () => {
  const rng = seededRng(11);
  for (let n = 1; n <= 10; n++) {
    const s = spotsFor(n, rng);
    assert.equal(s.length, n);
    assert.ok(s.every((p) => p.x >= 8 && p.x <= 92 && p.y >= 10 && p.y <= 90));
    assert.equal(new Set(s.map((p) => `${p.x},${p.y}`)).size, n);
  }
});

test("과정표의 모든 날을 판으로 만들 수 있다 — 정답이 보기 안에", () => {
  for (const c of CHAPTERS) {
    for (let d = 1; d <= 5; d++) {
      const plan = dayPlan(c.no, d);
      assert.ok(plan);
      for (const b of buildSession(plan, seededRng(c.no * 10 + d))) {
        switch (b.kind) {
          case "count":
          case "how-many":
            for (const r of b.rounds) {
              assert.ok(r.choices.includes(r.n));
              assert.equal(r.spots.length, r.n);
            }
            break;
          case "find-num":
            for (const r of b.rounds) assert.ok(r.choices.includes(r.n));
            break;
          case "compare":
            for (const r of b.rounds) {
              assert.notEqual(r.left, r.right);
              assert.equal(r.leftSpots.length, r.left);
            }
            break;
          case "next-num":
            for (const r of b.rounds) {
              assert.equal(r.answer, r.seq[r.seq.length - 1] + 1);
              assert.ok(r.choices.includes(r.answer));
            }
            break;
          case "shape":
            for (const r of b.rounds) assert.equal(r.choices.filter((x) => x.shape === r.target).length, 1);
            break;
          case "pattern":
            for (const r of b.rounds) {
              assert.ok(r.choices.includes(r.answer));
              assert.equal(new Set(r.choices).size, r.choices.length);
            }
            break;
          case "join":
            for (const r of b.rounds) {
              assert.ok(r.a >= 1 && r.b >= 1);
              assert.ok(r.choices.includes(r.a + r.b));
            }
            break;
          case "size":
            for (const r of b.rounds) assert.notEqual(r.left.scale, r.right.scale);
            break;
          case "add":
          case "subtract":
            for (const r of b.rounds) {
              assert.equal(r.answer, b.kind === "add" ? r.a + r.b : r.a - r.b);
              assert.ok(r.answer >= 1 && r.choices.includes(r.answer));
            }
            break;
          case "sort":
            for (const r of b.rounds) assert.ok(r.answers.length >= 2 && r.answers.length < r.cards.length);
            break;
          case "count-up":
            b.rounds.forEach((r, i) => {
              assert.ok(r.choices.includes(r.n) && r.choices.length === 2);
              // 차례 판은 하나씩 늘어나고, 섞인 판은 같은 수가 두 번 나오지 않는다
              if (i > 0 && !r.group) assert.equal(r.n, b.rounds[i - 1].n + 1, "하나씩 늘어난다");
              if (r.group) assert.equal(b.rounds.filter((x) => x.n === r.n).length, 1);
            });
            break;
          case "match":
            for (const r of b.rounds) assert.deepEqual([...r.bottom].sort(), [...r.top].sort());
            break;
          case "farm":
          case "dice":
            for (const r of b.rounds) assert.ok(r.choices.includes(r.n) && new Set(r.choices).size === r.choices.length);
            break;
          case "tally":
            assert.deepEqual([...b.board.queue].sort((x, y) => x - y), b.board.nums);
            break;
          case "shape-pair":
            for (const r of b.rounds) for (const c of r.cards) assert.equal(r.cards.filter((x) => x.shape === c.shape).length, 2);
            break;
          case "shop":
            for (const r of b.rounds) {
              if (r.named) assert.ok(r.n === 1 && r.shelf.length === 3 && new Set(r.shelf).size === 3 && r.shelf.includes(r.thing));
              else assert.ok(r.shelf.filter((x) => x === r.thing).length > r.n && r.thing !== r.other);
            }
            break;
          case "number-line":
            for (const r of b.rounds) assert.ok(r.a >= 1 && r.b >= 1 && r.a + r.b <= 10 && r.bars.includes(r.b));
            break;
        }
      }
    }
  }
});

test("모양 이름(vary false) — 모든 카드가 같은 색·같은 크기·반듯하게, 정답은 하나", () => {
  const b = buildActivity({ kind: "shape", shapes: ["circle", "triangle", "square"], rounds: 20, vary: false }, seededRng(8));
  if (b.kind !== "shape") return assert.fail();
  for (const r of b.rounds) {
    assert.equal(new Set(r.choices.map((x) => `${x.color}/${x.scale}/${x.rot}`)).size, 1);
    assert.equal(r.choices.filter((x) => x.shape === r.target).length, 1);
  }
});

test("크기 비교 — 큰 것은 또렷하게 크고, mix 는 크다·작다를 번갈아", () => {
  const b = buildActivity({ kind: "size", ask: "mix", rounds: 6 }, seededRng(9));
  if (b.kind !== "size") return assert.fail();
  b.rounds.forEach((r, i) => {
    const [big, small] = r.left.scale > r.right.scale ? [r.left, r.right] : [r.right, r.left];
    assert.ok(big.scale >= small.scale * 1.5);
    assert.equal(r.ask, i % 2 === 0 ? "bigger" : "smaller");
  });
});

test("더하기·빼기 — 5 이하, 답은 1 이상이고 보기 안에", () => {
  for (const kind of ["add", "subtract"] as const) {
    const b = buildActivity({ kind, max: 5, rounds: 40 }, seededRng(kind === "add" ? 12 : 13));
    if (b.kind !== kind) return assert.fail();
    for (const r of b.rounds) {
      assert.ok(r.a >= 1 && r.b >= 1);
      if (kind === "add") assert.ok(r.a + r.b <= 5);
      else assert.ok(r.a <= 5 && r.b < r.a);
      assert.ok(r.choices.includes(r.answer));
      assert.ok(r.choices.every((n) => n >= 1 && n <= 5));
      assert.equal(new Set(r.choices).size, r.choices.length);
    }
  }
  // max 를 넘겨 달라고 해도 묻는 말을 구운 범위(5)까지만
  const big = buildActivity({ kind: "add", max: 9, rounds: 30 }, seededRng(14));
  if (big.kind !== "add") return assert.fail();
  assert.ok(big.rounds.every((r) => r.answer <= 5));
});

test("모양 나누기 — 고를 것만 그 색(그 크기)이고, 나머지는 아니다", () => {
  const b = buildActivity({ kind: "sort", by: "mix", rounds: 30 }, seededRng(15));
  if (b.kind !== "sort") return assert.fail();
  for (const r of b.rounds) {
    assert.equal(r.cards.length, 6);
    for (const card of r.cards) {
      const hit = r.answers.includes(card.key);
      if (r.by === "color") assert.equal(card.color === r.target, hit);
      else assert.equal((card.scale === 1 ? "big" : "small") === r.target, hit);
    }
  }
  assert.ok(b.rounds.some((r) => r.by === "color") && b.rounds.some((r) => r.by === "size"));
});

test("수 크기 비교(show numbers) — 판에 그대로 실린다", () => {
  const b = buildActivity({ kind: "compare", range: [1, 10], rounds: 4, ask: "mix", show: "numbers" }, seededRng(16));
  if (b.kind !== "compare") return assert.fail();
  assert.ok(b.rounds.every((r) => r.show === "numbers" && r.left !== r.right));
});

test("규칙 찾기 — 정답이 규칙을 잇는다", () => {
  const ab = buildActivity({ kind: "pattern", level: "ab", rounds: 30 }, seededRng(5));
  assert.equal(ab.kind, "pattern");
  if (ab.kind !== "pattern") return;
  for (const r of ab.rounds) assert.equal(r.answer, r.seq[r.seq.length - 2]);
  const aab = buildActivity({ kind: "pattern", level: "aab", rounds: 30 }, seededRng(6));
  if (aab.kind !== "pattern") return;
  for (const r of aab.rounds) assert.equal(r.answer, r.seq[r.seq.length - 3]);
  const abc = buildActivity({ kind: "pattern", level: "abc", rounds: 30 }, seededRng(7));
  if (abc.kind !== "pattern") return;
  for (const r of abc.rounds) {
    assert.equal(r.answer, r.seq[r.seq.length - 3]);
    assert.ok(r.choices.includes(r.answer));
  }
});

test("업체 유아 단계 놀이 — 판 규칙", () => {
  // 수 세기 기초: 범위 끝 수는 아직 안 배운 수(범위 위)를 짝으로 쓰지 않는다
  const up = buildActivity({ kind: "count-up", range: [1, 5] }, seededRng(21));
  if (up.kind !== "count-up") return assert.fail();
  assert.deepEqual(
    up.rounds.map((r) => r.n),
    [1, 2, 3, 4, 5],
  );
  assert.ok(up.rounds.every((r) => r.choices.every((n) => n >= 1 && n <= 5) && !r.group));
  // 섞인 판: 범위 안 수가 한 번씩, 차례대로는 아니고, 무리 지어
  const mix = buildActivity({ kind: "count-up", range: [1, 5], mix: true }, seededRng(23));
  if (mix.kind !== "count-up") return assert.fail();
  assert.deepEqual([...mix.rounds.map((r) => r.n)].sort(), [1, 2, 3, 4, 5]);
  assert.notDeepEqual(
    mix.rounds.map((r) => r.n),
    [1, 2, 3, 4, 5],
  );
  assert.ok(mix.rounds.every((r) => r.group));
  // 짝 연결하기: 첫 판은 같은 차례, 다음 판은 섞인다
  const m = buildActivity({ kind: "match", by: "same", rounds: 3 }, seededRng(22));
  if (m.kind !== "match") return assert.fail();
  assert.deepEqual(m.rounds[0].bottom, m.rounds[0].top);
  assert.ok(m.rounds.slice(1).every((r) => r.bottom.some((k, j) => k !== r.top[j])));
  // 작은 농장: 카드는 정답과 바로 옆 수(0 까지), 범위 위로는 안 간다
  const f = buildActivity({ kind: "farm", range: [1, 3], rounds: 30 }, seededRng(23));
  if (f.kind !== "farm") return assert.fail();
  assert.ok(f.rounds.every((r) => r.choices.every((k) => k >= 0 && k <= 3 && Math.abs(k - r.n) <= 1)));
  // 동물은 판마다 바뀐다 — 양·소·돼지·병아리가 다 나온다
  assert.deepEqual([...new Set(f.rounds.map((r) => r.animal))].sort(), [...FARM_ANIMALS].sort());
  // 주사위 찾기: 6 까지만, 작은 수부터
  const d = buildActivity({ kind: "dice", range: [1, 10] }, seededRng(24));
  if (d.kind !== "dice") return assert.fail();
  assert.deepEqual(
    d.rounds.map((r) => r.n),
    [1, 2, 3, 4, 5, 6],
  );
  assert.ok(d.rounds.every((r) => r.choices.every((k) => k >= 1 && k <= 6)));
  // 가게 놀이: "개"로 세는 물건만
  const s = buildActivity({ kind: "shop", range: [1, 10], rounds: 40 }, seededRng(25));
  if (s.kind !== "shop") return assert.fail();
  assert.ok(s.rounds.every((r) => !["fish", "chick", "butterfly"].includes(r.thing) && r.friend === r.n && !r.named));
  // 이름으로 하나: 선반엔 서로 다른 물건 셋, 손님은 범위 안 친구
  const sn = buildActivity({ kind: "shop", range: [1, 5], rounds: 20, ask: "name" }, seededRng(27));
  if (sn.kind !== "shop") return assert.fail();
  assert.ok(sn.rounds.every((r) => r.named && r.n === 1 && new Set(r.shelf).size === 3 && r.friend >= 1 && r.friend <= 5));
  // 수직선 밝히기: 더할 블록은 막대(1~4) 안에서
  const l = buildActivity({ kind: "number-line", max: 3, rounds: 10 }, seededRng(26));
  if (l.kind !== "number-line") return assert.fail();
  assert.ok(l.rounds.every((r) => r.a + r.b <= 3 && r.b <= 4));
});

test("놀이터 놀이 — 아는 수 범위로 판이 만들어진다", () => {
  for (const g of GAMES) {
    for (const top of [3, 5, 10]) {
      const b = buildActivity(g.spec({ top, patternLevel: "ab" }), seededRng(top));
      assert.equal(b.kind, g.id);
    }
  }
});
