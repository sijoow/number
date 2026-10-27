/**
 * 더 쓰지 않는 음성 정리 — 말을 고치거나 이름을 바꾸면 예전 문장의 mp3 가 남는다(배포 크기만 늘어난다).
 *   npm run voice:lines && npm run voice:prune
 * scripts/voice-lines.json 에 없는 말을 src/content/voice-manifest.json 에서 빼고,
 * public/voice 안에서 어떤 말도 쓰지 않는 mp3 와 그 노래방 구간(voice-timing.json)을 지운다.
 */

import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const lines = new Set(Object.values((JSON.parse(readFileSync(resolve(root, "scripts/voice-lines.json"), "utf8")) as { groups: Record<string, string[]> }).groups).flat());
const manifestPath = resolve(root, "src/content/voice-manifest.json");
const timingPath = resolve(root, "src/content/voice-timing.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, Record<string, string>>;
const timing = existsSync(timingPath) ? (JSON.parse(readFileSync(timingPath, "utf8")) as Record<string, number[][]>) : {};

// 1) 목록에 없는 말을 manifest 에서 뺀다
const dropped: string[] = [];
for (const files of Object.values(manifest)) {
  for (const text of Object.keys(files)) {
    if (lines.has(text)) continue;
    dropped.push(text);
    delete files[text];
  }
}

// 2) 아무 말도 쓰지 않는 파일 — mp3 와 노래방 구간을 지운다
const inUse = new Set(Object.values(manifest).flatMap((m) => Object.values(m)));
for (const f of Object.keys(timing)) if (!inUse.has(f)) delete timing[f];
let removed = 0;
const voiceDir = resolve(root, "public/voice");
for (const voice of readdirSync(voiceDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const name of readdirSync(resolve(voiceDir, voice.name))) {
    const rel = `voice/${voice.name}/${name}`;
    if (!name.endsWith(".mp3") || inUse.has(rel)) continue;
    unlinkSync(resolve(root, "public", rel));
    removed++;
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(timingPath, JSON.stringify(timing) + "\n");
console.log(`목록에서 뺀 말 ${dropped.length}줄 · 지운 파일 ${removed}개`);
for (const t of dropped.slice(0, 20)) console.log(`  - ${t}`);
