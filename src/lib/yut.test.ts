import assert from "node:assert/strict";
import { test } from "node:test";
import { atStart, finished, ROUTES, sameSpot, START, stationOf, STATIONS, stepsLeft, walk } from "./yut.ts";

test("윷판 — 둘레 20칸 + 대각선 8칸 + 가운데, 모두 판 안", () => {
  assert.equal(Object.keys(STATIONS).length, 29);
  for (const s of Object.values(STATIONS)) assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100);
  // 모든 길의 칸이 판에 있다
  for (const r of Object.values(ROUTES)) for (const st of r) assert.ok(st === "end" || STATIONS[st], st);
});

test("한 바퀴 — 지름길 없이 20칸이면 도착, 끝을 넘어도 도착", () => {
  let p = START;
  // 4 + 4 … 모서리(5·10)에 딱 멈추지 않게 4씩
  p = walk(p, 4).next; // o4
  p = walk(p, 4).next; // o8
  assert.equal(stationOf(p), "o8");
  p = walk(p, 4).next; // o12
  p = walk(p, 4).next; // o16
  const last = walk(p, 6);
  assert.ok(finished(last.next));
  assert.deepEqual(last.path, ["o17", "o18", "o19", "end"]);
});

test("지름길 — 오른쪽 위에 딱 멈추면 가운데로, 가운데에 딱 멈추면 도착 쪽으로", () => {
  const corner = walk(START, 5);
  assert.equal(stationOf(corner.next), "o5");
  assert.equal(corner.next.route, "viaA");
  assert.ok(corner.shortcut);
  const center = walk(corner.next, 3);
  assert.deepEqual(center.path, ["a1", "a2", "c"]);
  assert.equal(center.next.route, "fromC");
  const home = walk(center.next, 3);
  assert.deepEqual(home.path, ["b3", "b4", "end"]);
  assert.ok(finished(home.next));
  // 모서리를 지나가기만 하면 둘레 그대로
  const pass = walk(START, 6);
  assert.equal(pass.next.route, "outer");
  assert.equal(stationOf(pass.next), "o6");
  assert.ok(!pass.shortcut);
});

test("왼쪽 위 모서리에 딱 멈추면 가운데를 지나 도착으로 — 남은 칸이 줄어든다", () => {
  let p = walk(START, 4).next; // o4
  p = walk(p, 6).next; // o10 — 지름길
  assert.equal(p.route, "viaB");
  assert.equal(stepsLeft(p), 6);
  assert.equal(stepsLeft(START), 20);
});

test("잡기 — 같은 칸에 멈추면 잡는다(출발 칸·도착은 아니다)", () => {
  const a = walk(START, 3).next;
  const b = walk(START, 3).next;
  assert.ok(sameSpot(a, b));
  assert.ok(!sameSpot(START, START));
  assert.ok(atStart(START));
  // 지름길 위에서도 같은 칸이면 잡는다 — 가운데는 길이 달라도 같은 칸
  const viaA = walk(walk(START, 5).next, 3).next; // c (fromC)
  const viaB = walk(walk(walk(START, 4).next, 6).next, 3).next; // o10 → b1 b2 c
  assert.equal(stationOf(viaA), "c");
  assert.equal(stationOf(viaB), "c");
  assert.ok(sameSpot(viaA, viaB));
});
