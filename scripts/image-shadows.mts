/**
 * 그림자 친구 그림 — 숫자 친구 대표 그림(public/img/friends/<n>.webp)을 까맣게 칠한 실루엣(2026-10-27 숫자 놀이).
 * 새로 그리지 않는다 — 있는 그림의 알파(모양)만 쓴다. 머리 위 숫자는 답이 보이니까 지운다:
 *   ① 몸(가장 큰 덩어리)에서 떨어진 덩어리 중 몸의 3% 미만이거나 통째로 몸보다 위에 있는 것 — 숫자 글자·티끌(대부분 여기서 지워진다)
 *   ② 그래도 몸에 붙어 남은 검은 글자(7 은 흰 테두리 숫자가 머리카락에 붙어 있다) — 머리의 넓은 부분보다 위에 있는
 *      새까맣고 가는 획 덩어리 + 둘레의 흰·회색 테두리. 머리 안의 눈썹·눈동자는 그 줄보다 아래라서 남는다
 *   node scripts/image-shadows.mts   → public/img/shadows/<n>.webp + image-manifest "shadow:<n>"(?v 내용 해시)
 *   그다음 npm run image:upload
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { MAX_NUMBER, range } from "../src/curriculum/numbers.ts";

const root = resolve(import.meta.dirname, "..");
const manifestPath = resolve(root, "src/content/image-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, string>;
/** 그림자 색 — 글씨색(ink)과 같은 짙은 남보라 */
const INK = [62, 58, 82];
/** 가장자리 부드러움 — 남길 픽셀에서 이만큼 안쪽의 반투명까지 살린다 */
const EDGE = 2;
/** 글자 둘레 흰 테두리까지 지울 폭 */
const RIM = 6;

for (const n of range(1, MAX_NUMBER)) {
  const { data, info } = await sharp(resolve(root, "public/img/friends", `${n}.webp`))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const at = (i: number) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
  const opaque = (i: number) => data[i * 4 + 3] > 100;
  const plain = (i: number) => {
    const [r, g, b] = at(i);
    return Math.max(r, g, b) - Math.min(r, g, b) < 40;
  };
  // 숫자 글자는 거의 새까맣다(밝기 40 안팎) — 9·19 의 짙은 회색 블록(60~75)은 빼야 해서 50 아래만
  const black = (i: number) => {
    const [r, g, b] = at(i);
    return opaque(i) && plain(i) && 0.299 * r + 0.587 * g + 0.114 * b < 50;
  };
  const neighbors = (p: number) => {
    const x = p % w;
    return [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w].filter((q) => q >= 0 && q < w * h);
  };
  /** 조건에 맞는 픽셀끼리 덩어리로 — [덩어리 번호 칸, 덩어리마다 {크기, 위, 아래, 왼, 오른}] */
  const components = (ok: (i: number) => boolean) => {
    const label = new Int32Array(w * h).fill(-1);
    const boxes: { size: number; top: number; bottom: number; left: number; right: number }[] = [];
    for (let i = 0; i < w * h; i++) {
      if (!ok(i) || label[i] >= 0) continue;
      const id = boxes.length;
      const box = { size: 0, top: h, bottom: 0, left: w, right: 0 };
      const stack = [i];
      label[i] = id;
      while (stack.length) {
        const p = stack.pop()!;
        const x = p % w;
        const y = Math.floor(p / w);
        box.size++;
        box.top = Math.min(box.top, y);
        box.bottom = Math.max(box.bottom, y);
        box.left = Math.min(box.left, x);
        box.right = Math.max(box.right, x);
        for (const q of neighbors(p)) {
          if (label[q] >= 0 || !ok(q)) continue;
          label[q] = id;
          stack.push(q);
        }
      }
      boxes.push(box);
    }
    return { label, boxes };
  };

  // ① 떨어진 덩어리
  const parts = components(opaque);
  const body = parts.boxes.reduce((best, b, k) => (b.size > parts.boxes[best].size ? k : best), 0);
  const B = parts.boxes[body];
  const keepPart = parts.boxes.map((b, k) => k === body || (b.size >= B.size * 0.03 && b.bottom >= B.top));
  const kept = (i: number) => parts.label[i] >= 0 && keepPart[parts.label[i]];

  // ② 머리의 넓은 부분이 시작하는 줄 — 몸 너비가 가장 넓을 때의 40%를 처음 넘는 줄(머리카락·왕관 같은 가는 것은 그 위)
  const widths = range(0, h - 1).map((y) => {
    let c = 0;
    for (let x = 0; x < w; x++) if (kept(y * w + x)) c++;
    return c;
  });
  const widest = Math.max(...widths);
  const headTop = widths.findIndex((c) => c >= widest * 0.4);
  const erased = new Uint8Array(w * h);
  let letters = 0;
  const glyphs = components((i) => kept(i) && black(i));
  glyphs.boxes.forEach((g) => {
    const fill = g.size / ((g.bottom - g.top + 1) * (g.right - g.left + 1));
    if (g.bottom >= headTop || fill >= 0.6) return;
    letters++;
    for (let y = Math.max(0, g.top - RIM); y <= Math.min(h - 1, g.bottom + RIM); y++) {
      for (let x = Math.max(0, g.left - RIM); x <= Math.min(w - 1, g.right + RIM); x++) {
        const q = y * w + x;
        if (y < headTop && opaque(q) && plain(q)) erased[q] = 1;
      }
    }
  });

  // 남길 픽셀 + EDGE px 안쪽 반투명 → 그림자 색으로
  const keep = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!kept(i) || erased[i]) continue;
    const x = i % w;
    const y = Math.floor(i / w);
    for (let dy = -EDGE; dy <= EDGE; dy++) {
      for (let dx = -EDGE; dx <= EDGE; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < w && yy >= 0 && yy < h && !erased[yy * w + xx]) keep[yy * w + xx] = 1;
      }
    }
  }
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = INK[0];
    out[i * 4 + 1] = INK[1];
    out[i * 4 + 2] = INK[2];
    out[i * 4 + 3] = keep[i] ? data[i * 4 + 3] : 0;
  }

  const file = `img/shadows/${n}.webp`;
  const dest = resolve(root, "public", file);
  mkdirSync(dirname(dest), { recursive: true });
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(dest);
  manifest[`shadow:${n}`] = `${file}?v=${createHash("sha1").update(readFileSync(dest)).digest("hex").slice(0, 8)}`;
  console.log(`${n}: 떨어진 덩어리 지움 ${keepPart.filter((k) => !k).length} · 붙은 검은 글자 지움 ${letters}`);
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + "\n");
console.log(`그림자 ${MAX_NUMBER}장 → public/img/shadows · manifest ${Object.keys(sorted).length}개 키`);
