import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CHAPTERS, DAYS_PER_CHAPTER, dayPlan, firstPattern, firstSeen, friendsBefore, practicePlan, TOTAL_DAYS } from "./course.ts";
import { FRIENDS, hasTowerForm, layoutOf } from "./friends.ts";
import { GAMES } from "./games.ts";
import { addAsk, allLineTexts, buildAsk, clapAsk, meetAlso, meetBlocks, meetHello, shapeAsk, sizeName, sortAsk, subtractAsk } from "./lines.ts";
import { alsoCalled, countUp, hasBatchim, isIt, MAX_NUMBER, modOf, nameOf, sinoOf } from "./numbers.ts";
import type { ActivitySpec } from "./types.ts";
import { isScored } from "../lib/rounds.ts";

test("숫자 이름 — 셀 때·한자어·매김꼴", () => {
  assert.deepEqual(countUp(5), ["하나", "둘", "셋", "넷", "다섯"]);
  assert.equal(nameOf(10), "열");
  assert.equal(sinoOf(3), "삼");
  assert.equal(modOf(1), "한");
  assert.equal(modOf(4), "네");
  assert.equal(nameOf(20), "스물");
  assert.equal(modOf(20), "스무");
  assert.equal(sinoOf(13), "십삼");
  assert.throws(() => nameOf(21));
});

test("조사 — 받침 따라", () => {
  assert.equal(hasBatchim("셋"), true);
  assert.equal(hasBatchim("하나"), false);
  assert.equal(isIt("하나"), "하나야");
  assert.equal(isIt("둘"), "둘이야");
  assert.equal(alsoCalled("삼"), "삼이라고도");
  assert.equal(alsoCalled("사"), "사라고도");
});

test("숫자가 든 말 — 친구 이름은 한자어(삼), 셀 때는 고유어(셋)", () => {
  assert.equal(meetHello(3), "안녕! 나는 삼이야.");
  assert.equal(meetHello(2), "안녕! 나는 이야.");
  assert.equal(meetHello(10), "안녕! 나는 십이야.");
  assert.equal(meetBlocks(3), "셋! 블록이 세 개야.");
  assert.equal(meetAlso(5), "다섯이라고도 해.");
  assert.equal(meetAlso(3), "셋이라고도 해.");
  assert.equal(buildAsk(2), "블록을 두 개 쌓아 볼까?");
  assert.equal(clapAsk(4), "손뼉을 네 번 쳐 볼까?");
  assert.equal(shapeAsk("triangle"), "세모를 찾아 봐!");
  assert.equal(addAsk(2, 1), "둘 더하기 하나는?");
  assert.equal(addAsk(1, 3), "하나 더하기 셋은?");
  assert.equal(subtractAsk(3, 1), "셋 빼기 하나는?");
  assert.equal(sortAsk("#ef6a6a"), "빨간색을 모두 골라 봐!");
  assert.equal(sortAsk("small"), "작은 것을 모두 골라 봐!");
  assert.equal(sizeName("square", true), "큰 네모");
});

test("과정표 — 업체 레벨 A(유아) A1~A10 → B(유치원 기초) B1~B10, 장마다 5일", () => {
  assert.equal(CHAPTERS.length, 20);
  assert.equal(TOTAL_DAYS, 100);
  CHAPTERS.forEach((c, i) => {
    assert.equal(c.no, i + 1);
    const level = i < 10 ? "A" : "B";
    assert.equal(c.level, level);
    assert.equal(c.code, `${level}${(i % 10) + 1}`);
    assert.equal(c.days.length, DAYS_PER_CHAPTER, `${c.no}장 날 수`);
    c.days.forEach((acts, d) => assert.ok(acts.length >= 3 && acts.length <= 5, `${c.no}장 ${d + 1}일 놀이 수 ${acts.length}`));
  });
});

test("새 학습 목표는 그 장에서 처음 나온다 — A2 모양 이름, A6 AB, A9 크기, B3 ABC, B4 모으기, B5 더하기, B7 빼기, B9 나누기", () => {
  const code = (at: { chapter: number } | null) => (at ? CHAPTERS[at.chapter - 1].code : null);
  assert.equal(code(firstSeen("shape")), "A2");
  assert.equal(code(firstPattern("ab")), "A6");
  assert.equal(code(firstSeen("size")), "A9");
  assert.equal(code(firstPattern("abc")), "B3");
  assert.equal(code(firstSeen("join")), "B4");
  assert.equal(code(firstSeen("add")), "B5");
  assert.equal(code(firstSeen("subtract")), "B7");
  assert.equal(code(firstSeen("sort")), "B9");
  // 수 크기 비교(숫자로)는 B10 에서만
  const numbers = CHAPTERS.filter((c) => c.days.flat().some((a) => a.kind === "compare" && a.show === "numbers")).map((c) => c.code);
  assert.deepEqual(numbers, ["B10"]);
});

test("도장 놀이 날은 점수 놀이만", () => {
  for (const c of CHAPTERS) {
    const stamp = dayPlan(c.no, DAYS_PER_CHAPTER);
    assert.ok(stamp?.stamp);
    for (const a of stamp.activities) assert.ok(isScored(a.kind), `${c.no}장 도장 놀이에 ${a.kind}`);
    const practice = practicePlan(c.no);
    assert.equal(practice?.stamp, false);
    assert.deepEqual(practice?.activities, stamp.activities);
  }
});

test("숫자 친구 1~20 을 한 번씩, 차례대로 만난다", () => {
  const met: number[] = [];
  for (const c of CHAPTERS) {
    const inDays = c.days.flat().flatMap((a) => (a.kind === "meet" ? [a.n] : []));
    assert.deepEqual(inDays, [...c.meets], `${c.no}장 meets 와 만나기 놀이가 같아야`);
    met.push(...inDays);
  }
  assert.deepEqual(met, FRIENDS.map((f) => f.n));
  assert.deepEqual(friendsBefore(3), [1, 2, 3, 4, 5]);
});

test("놀이마다 아직 안 만난 수를 쓰지 않는다", () => {
  const known = new Set<number>();
  const top = (a: ActivitySpec): number => {
    if ("range" in a) return a.range[1];
    if (a.kind === "trace") return Math.max(...a.digits);
    if (a.kind === "join" || a.kind === "add" || a.kind === "subtract" || a.kind === "number-line") return a.max;
    if (a.kind === "match") return a.nums?.[1] ?? 0;
    if (a.kind === "meet") return a.n;
    return 0;
  };
  for (const c of CHAPTERS) {
    c.days.forEach((acts, d) => {
      for (const a of acts) {
        if (a.kind === "meet") known.add(a.n);
        const max = known.size ? Math.max(...known) : 0;
        assert.ok(top(a) <= max, `${c.no}장 ${d + 1}일 ${a.kind}: ${top(a)} > 아는 수 ${max}`);
        if ("range" in a) assert.ok(a.range[0] >= 1 && a.range[0] <= a.range[1] && a.range[1] <= MAX_NUMBER);
      }
    });
  }
});

test("숫자 친구 모습 — 대표(인물구성도)는 4·6·8·9 가 네모, 기둥(인물구성2)은 모두 한 줄", () => {
  assert.deepEqual(layoutOf(4, "shape"), { cols: 2, rows: 2 });
  assert.deepEqual(layoutOf(6, "shape"), { cols: 2, rows: 3 });
  assert.deepEqual(layoutOf(8, "shape"), { cols: 2, rows: 4 });
  assert.deepEqual(layoutOf(9, "shape"), { cols: 3, rows: 3 });
  assert.deepEqual(layoutOf(7, "shape"), { cols: 1, rows: 7 });
  assert.deepEqual(layoutOf(9, "tower"), { cols: 1, rows: 9 });
  assert.deepEqual(FRIENDS.filter((f) => hasTowerForm(f.n)).map((f) => f.n), [4, 6, 8, 9]);
});

test("숫자 친구 그림 — 1~20 대표 모습과 기둥 모습(4·6·8·9)이 모두 들어 있다", () => {
  const manifest = JSON.parse(readFileSync(new URL("../content/image-manifest.json", import.meta.url), "utf8")) as Record<string, string>;
  for (const f of FRIENDS) {
    assert.ok(manifest[`friend:${f.n}`], `friend:${f.n} 그림이 없다`);
    if (hasTowerForm(f.n)) assert.ok(manifest[`friend:${f.n}:tower`], `friend:${f.n}:tower 그림이 없다`);
  }
});

test("놀이터 놀이는 모두 과정 안에서 처음 나온 날이 있다", () => {
  for (const g of GAMES) assert.ok(firstSeen(g.id), `${g.id} 는 과정에 없다`);
});

test("들려주는 말 — 빈 줄·겹침 없이 뽑힌다", () => {
  const all = allLineTexts();
  assert.ok(all.every((t) => t.trim().length > 0));
  assert.ok(all.includes("하나") && all.includes("열"));
  assert.ok(all.includes(buildAsk(MAX_NUMBER)));
});
