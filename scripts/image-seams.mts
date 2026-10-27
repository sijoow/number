/**
 * 기둥 친구 블록 이음선 찾기 · 블록 끼워 넣기 — 생성기가 긴 기둥(8·9·10)의 블록을 한두 개 적게 그릴 때 쓰는 손질 도구(2026-10-27).
 * 그림을 새로 그리지 않는다: 그 그림 안의 팔다리 없는 블록 한 칸을 그대로 복사해 이음선에 맞춰 끼운다.
 *   node scripts/image-seams.mts <그림.png>                         이음선(블록 경계) y 위치와 블록 수 어림
 *   node scripts/image-seams.mts <그림.png> <저장.png> <y0> <y1> [n]  y0~y1(블록 한 칸) 을 n 번 복사해 y1 아래에 끼운다
 */

import sharp from "sharp";

const [inp, out, y0s, y1s, ns] = process.argv.slice(2);
if (!inp) throw new Error("쓰는 법: node scripts/image-seams.mts <그림.png> [<저장.png> <y0> <y1> [n]]");

const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const alpha = (x: number, y: number) => data[(y * W + x) * 4 + 3];

if (out) {
  const y0 = Number(y0s);
  const y1 = Number(y1s);
  const n = Number(ns ?? 1);
  const h = y1 - y0;
  if (!(h > 0) || y0 < 0 || y1 > H) throw new Error("y0 < y1 이어야 하고 그림 안이어야 해요");
  const outH = H + h * n;
  const buf = Buffer.alloc(W * outH * 4);
  const row = (src: number, dst: number) => data.copy(buf, dst * W * 4, src * W * 4, (src + 1) * W * 4);
  for (let y = 0; y < y1; y++) row(y, y);
  for (let k = 0; k < n; k++) for (let y = y0; y < y1; y++) row(y, y1 + k * h + (y - y0));
  for (let y = y1; y < H; y++) row(y, y + h * n);
  await sharp(buf, { raw: { width: W, height: outH, channels: 4 } }).png().toFile(out);
  console.log(`${inp} → ${out}: ${y0}~${y1}(높이 ${h}) 을 ${n}번 끼움, 새 높이 ${outH}`);
} else {
  // 기둥 몸통 가로 범위 — 단단한 픽셀이 가장 많은 열들(팔·다리는 짧아서 빠진다)
  const colCount = Array.from({ length: W }, (_, x) => {
    let c = 0;
    for (let y = 0; y < H; y++) if (alpha(x, y) > 200) c++;
    return c;
  });
  const max = Math.max(...colCount);
  const xs = colCount.flatMap((c, x) => (c >= max * 0.6 ? [x] : []));
  const left = xs[0];
  const right = xs[xs.length - 1];
  const w = right - left + 1;
  // 밝기 — 몸통 안쪽 15~35% · 65~85% 띠(눈·입은 가운데라 덜 걸린다)
  const bands = [
    [left + Math.round(w * 0.15), left + Math.round(w * 0.35)],
    [left + Math.round(w * 0.65), left + Math.round(w * 0.85)],
  ];
  const L: number[] = [];
  for (let y = 0; y < H; y++) {
    let s = 0;
    let c = 0;
    for (const [a, b] of bands) {
      for (let x = a; x <= b; x++) {
        const i = (y * W + x) * 4;
        if (data[i + 3] <= 200) continue;
        s += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        c++;
      }
    }
    L.push(c > (bands[0][1] - bands[0][0]) ? s / c : Number.NaN);
  }
  // 몸통 세로 범위 — 밝기 띠가 이어지는 가장 긴 구간(머리 위 숫자는 떨어져 있어서 빠진다)
  let best = [0, 0];
  for (let y = 0, start = -1; y <= H; y++) {
    const ok = y < H && !Number.isNaN(L[y]);
    if (ok && start < 0) start = y;
    if (!ok && start >= 0) {
      if (y - start > best[1] - best[0]) best = [start, y];
      start = -1;
    }
  }
  const [top, bottom] = best;
  // 이음선 — 위아래 10px 안에서 가장 어둡고, 둘레 평균보다 6 이상 어두운 줄
  const seams: number[] = [];
  for (let y = top + 10; y < bottom - 10; y++) {
    const win = L.slice(y - 10, y + 11);
    const min = Math.min(...win);
    const avg = win.reduce((a, b) => a + b, 0) / win.length;
    if (L[y] === min && L[y] < avg - 6 && (!seams.length || y - seams[seams.length - 1] > 25)) seams.push(y);
  }
  const gaps = seams.slice(1).map((s, i) => s - seams[i]);
  console.log(`${inp}: 그림 ${W}x${H}, 몸통 x ${left}~${right}, y ${top}~${bottom}`);
  console.log(`이음선 y: ${seams.join(", ")}`);
  console.log(`이음선 사이: ${gaps.join(", ")}`);
}
