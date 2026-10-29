import assert from "node:assert/strict";
import { test } from "node:test";
import { DIGIT_H, DIGIT_STROKES, DIGIT_W, lengthsOf, pointAt, strokeDone, strokesOf, TOLERANCE, traceStep, type Pt } from "./strokes.ts";

test("숫자 획 — 0~9 모두 있고, 칸 안에서 촘촘하게 이어진다", () => {
  for (let d = 0; d <= 9; d++) {
    const strokes = DIGIT_STROKES[String(d)];
    assert.ok(strokes && strokes.length >= 1, `${d} 획이 있다`);
    for (const s of strokes) {
      const lens = lengthsOf(s);
      assert.ok(lens[lens.length - 1] > 40, `${d} 획이 너무 짧다`);
      s.forEach(([x, y], i) => {
        assert.ok(x >= 8 && x <= DIGIT_W - 8 && y >= 8 && y <= DIGIT_H - 8, `${d} 의 점 (${x}, ${y}) 이 칸 밖`);
        if (i) assert.ok(Math.hypot(x - s[i - 1][0], y - s[i - 1][1]) < 12, `${d} 의 점 사이가 너무 멀다`);
      });
    }
  }
  // 업체처럼 4·5 는 두 획
  assert.equal(DIGIT_STROKES["4"].length, 2);
  assert.equal(DIGIT_STROKES["5"].length, 2);
  // 두 자리 수는 둘째 숫자를 오른쪽 칸에
  const two = strokesOf("12");
  assert.equal(two.length, 2);
  assert.ok(two[1].every(([x]) => x >= DIGIT_W));
});

test("획 따라 긋기 — 길 위에서만 앞으로, 벗어나거나 뒤로 가거나 건너뛰면 그대로", () => {
  const one = DIGIT_STROKES["1"][0];
  const lens = lengthsOf(one);
  let r = traceStep(one, lens, 0, [52, 30]);
  assert.ok(!r.off && r.s > 10 && r.s < 20, "길 위에서 내려가면 칠해진다");
  const s = r.s;
  r = traceStep(one, lens, s, [52 + TOLERANCE + 8, 40]);
  assert.ok(r.off && r.s === s, "길 밖은 칠해지지 않는다");
  r = traceStep(one, lens, s, [50, 18]);
  assert.equal(r.s, s, "뒤로는 안 간다");
  r = traceStep(one, lens, s, [50, 110]);
  assert.ok(r.off && r.s === s, "한 번에 멀리 건너뛰면 안 된다");
  // 한 바퀴 도는 0 — 시작점 오른쪽(끝 쪽)을 눌러도 거꾸로 돌지 않는다
  const zero = DIGIT_STROKES["0"][0];
  const zl = lengthsOf(zero);
  assert.ok(traceStep(zero, zl, 0, [58, 15]).s < 3);
});

test("획 따라 긋기 — 모든 숫자를 획 차례대로 끝까지 그을 수 있다", () => {
  for (let d = 0; d <= 20; d++) {
    for (const stroke of strokesOf(String(d))) {
      const lens = lengthsOf(stroke);
      let s = 0;
      // 손끝을 조금 흔들며(길 안에서) 획을 따라간다
      for (let k = 0; k <= 400 && !strokeDone(lens, s); k++) {
        const { p, angle } = pointAt(stroke, lens, s + 5);
        const wobble = (k % 2 ? 1 : -1) * 4;
        const finger: Pt = [p[0] - Math.sin(angle) * wobble, p[1] + Math.cos(angle) * wobble];
        const r = traceStep(stroke, lens, s, finger);
        assert.ok(!r.off, `${d} 를 긋다가 길을 벗어났다고 본다`);
        s = r.s;
      }
      assert.ok(strokeDone(lens, s), `${d} 획을 끝까지 못 그었다`);
    }
  }
});
