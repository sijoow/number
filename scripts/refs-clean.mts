/**
 * 생성용 레퍼런스 만들기 — refs 원본 두 장에서 공식 로고와 남의 워터마크("응군팩토리 :)")만 바탕색으로 덮은 사본.
 *   node scripts/refs-clean.mts   → refs/gen/numberblocks-a.png(인물구성도) · numberblocks-b.png(인물구성2)
 * 생성기가 로고·워터마크 글자를 베끼는 일을 막는다(docs/numberblocks-style.md 4·6절). 원본은 건드리지 않는다.
 * 덮는 칸은 원본 크기(797×512 · 565×405)에서 눈으로 잡은 자리 — 위·아래 바탕을 재서 그 사이를 이어 칠한다.
 */

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
type Box = { left: number; top: number; width: number; height: number };

async function mean(file: string, box: Box): Promise<string> {
  // 잘라 낸 조각을 먼저 버퍼로 — 같은 파이프라인에서 stats() 를 부르면 잘라 내기 전 그림 전체를 잰다
  const piece = await sharp(file).extract(box).png().toBuffer();
  const { channels } = await sharp(piece).stats();
  const [r, g, b] = channels.slice(0, 3).map((c) => Math.round(c.mean));
  return `rgb(${r},${g},${b})`;
}

/** box 를 위 바탕색 → 아래 바탕색으로 이어 칠한 조각 */
async function cover(file: string, box: Box, above: Box, below: Box) {
  const [top, bottom] = [await mean(file, above), await mean(file, below)];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
  return { input: Buffer.from(svg), left: box.left, top: box.top };
}

const out = resolve(root, "refs/gen");
mkdirSync(out, { recursive: true });

// 인물구성도 — 가운데 위 로고
const a = resolve(root, "refs/인물구성도.jpg");
await sharp(a)
  .composite([await cover(a, { left: 236, top: 6, width: 338, height: 168 }, { left: 236, top: 0, width: 338, height: 5 }, { left: 236, top: 176, width: 110, height: 6 })])
  .png()
  .toFile(resolve(out, "numberblocks-a.png"));

// 인물구성2 — 왼쪽 위 로고 + 가운데 위 워터마크
const b = resolve(root, "refs/인물구성2.jpg");
await sharp(b)
  .composite([
    await cover(b, { left: 218, top: 26, width: 240, height: 62 }, { left: 218, top: 18, width: 240, height: 6 }, { left: 218, top: 90, width: 240, height: 6 }),
    await cover(b, { left: 6, top: 44, width: 250, height: 146 }, { left: 6, top: 36, width: 250, height: 6 }, { left: 6, top: 192, width: 180, height: 5 }),
  ])
  .png()
  .toFile(resolve(out, "numberblocks-b.png"));

console.log("→ refs/gen/numberblocks-a.png · numberblocks-b.png");
