/**
 * 힉스필드 결과를 내려받아 앱에 넣는다.
 *   npm run image:install -- drafts/2026-10-27
 * <폴더>/results.json { "그림 키": "결과 URL" } 을 읽어
 *   원본 PNG  → <폴더>/png/<파일>.png   (gitignore — 다시 줄일 때 쓴다, 이미 받은 건 건너뜀)
 *   앱용 그림 → public/<파일>            (친구·물건·아이콘 512px WebP 투명, 놀이터 장면 768px, 바탕 1920px, 앱 아이콘 512·192 PNG)
 *   src/content/image-manifest.json 에 넣는다 — 값 끝에 ?v=내용해시(Cafe24 앞단 캐시 2시간·브라우저 7일 때문)
 * 그다음 npm run image:upload 로 Cafe24 에 올린다.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const dir = resolve(root, process.argv[2] ?? "");
if (!process.argv[2] || !existsSync(resolve(dir, "results.json"))) throw new Error("쓰는 법: npm run image:install -- <results.json 이 있는 폴더>");

type Item = { key: string; file: string };
const { items } = JSON.parse(readFileSync(resolve(root, "scripts/image-prompts.json"), "utf8")) as { items: Item[] };
const fileOf = new Map(items.map((it) => [it.key, it.file]));
const results = JSON.parse(readFileSync(resolve(dir, "results.json"), "utf8")) as Record<string, string>;
const manifestPath = resolve(root, "src/content/image-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, string>;

const ensureDir = (f: string) => mkdirSync(dirname(f), { recursive: true });

async function download(url: string, to: string) {
  if (existsSync(to)) return;
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      ensureDir(to);
      writeFileSync(to, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (e) {
      if (i >= 2) throw e;
    }
  }
}

/**
 * 투명 둘레 정리 — 힉스필드 투명 배경은 가끔 몸 둘레에 하얀 안개(반투명 픽셀)가 번진다(한글나라에서도 겪음, 2026-10-27 칠에서 다시).
 * 단단한 부분(알파 200 이상)에서 2px 안쪽만 남기고 그 밖의 반투명은 지운다 — 가장자리 부드러움은 그대로.
 */
async function defringe(src: string): Promise<Buffer> {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const R = 2;
  const keep = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 200) continue;
      for (let dy = -R; dy <= R; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < w) keep[yy * w + xx] = 1;
        }
      }
    }
  }
  for (let i = 0; i < w * h; i++) if (!keep[i]) data[i * 4 + 3] = 0;
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

/** 원본 PNG → 앱용 파일. 크기는 쓰는 자리에 맞춘다(투명 그림은 둘레 정리 먼저) */
async function shrink(src: string, file: string) {
  const out = resolve(root, "public", file);
  ensureDir(out);
  const transparent = !file.startsWith("img/bg/") && !file.startsWith("img/scenes/") && file !== "img/app-icon.png";
  const img = sharp(transparent ? await defringe(src) : src);
  if (file === "img/app-icon.png") {
    await img.resize(512, 512).png({ compressionLevel: 9 }).toFile(out);
    await sharp(src).resize(192, 192).png({ compressionLevel: 9 }).toFile(resolve(root, "public/img/app-icon-192.png"));
    return;
  } else if (file.startsWith("img/bg/")) {
    await img.resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 84 }).toFile(out);
  } else if (file.startsWith("img/scenes/")) {
    await img.resize(768, 768, { fit: "inside" }).webp({ quality: 86 }).toFile(out);
  } else {
    await img.resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88, alphaQuality: 100 }).toFile(out);
  }
}

let done = 0;
const missing: string[] = [];
for (const [key, url] of Object.entries(results)) {
  const file = fileOf.get(key);
  if (!file) {
    missing.push(key);
    continue;
  }
  const png = resolve(dir, "png", file.replace(/\.\w+$/, ".png"));
  await download(url, png);
  await shrink(png, file);
  manifest[key] = file;
  done++;
}

// 주소 끝에 내용 해시를 붙인다(?v=…) — 같은 주소로 바꿔 올려도 새 그림이 바로 보이게. 한글나라에서 빌려 온 https 주소는 그대로
for (const [key, f] of Object.entries(manifest)) {
  if (/^https?:\/\//.test(f)) continue;
  const path = f.split("?")[0];
  const local = resolve(root, "public", path);
  if (existsSync(local)) manifest[key] = `${path}?v=${createHash("sha1").update(readFileSync(local)).digest("hex").slice(0, 8)}`;
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + "\n");
console.log(`넣음 ${done}장 · manifest ${Object.keys(sorted).length}개 키${missing.length ? ` · 모르는 키 ${missing.join(", ")}` : ""}`);
