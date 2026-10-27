/**
 * 한글나라에 이미 구운 음성 빌려 오기 — 크레딧을 안 쓴다.
 *   npm run voice:reuse                 (한글나라 폴더 기본 ../todo, 다르면 --from <폴더>)
 * scripts/voice-lines.json 의 말 가운데 한글나라 voice-manifest 에 똑같은 글이 있으면
 *   그 mp3 를 public/voice/<성우>/ 로 복사하고, src/content/voice-manifest.json · voice-timing.json(노래방 구간)에 넣는다.
 * 남은 말(새로 구워야 할 것)의 줄 수·글자 수를 알려 준다 → npm run voice:make -- --voice sua (견적) → 확인 받고 --yes
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const i = process.argv.indexOf("--from");
const from = resolve(root, i >= 0 ? process.argv[i + 1] : "../todo");

type Manifest = Record<string, Record<string, string>>;
const readJson = <T,>(f: string, fallback: T): T => (existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as T) : fallback);

const linesFile = resolve(root, "scripts/voice-lines.json");
if (!existsSync(linesFile)) throw new Error("scripts/voice-lines.json 이 없어요 — npm run voice:lines 먼저");
const lines = Object.values((JSON.parse(readFileSync(linesFile, "utf8")) as { groups: Record<string, string[]> }).groups).flat();

const theirs = readJson<Manifest>(resolve(from, "src/content/voice-manifest.json"), {});
const theirTiming = readJson<Record<string, number[][]>>(resolve(from, "src/content/voice-timing.json"), {});
if (!Object.keys(theirs).length) throw new Error(`한글나라 음성 목록을 못 찾았어요: ${from}`);

const manifestPath = resolve(root, "src/content/voice-manifest.json");
const timingPath = resolve(root, "src/content/voice-timing.json");
const ours = readJson<Manifest>(manifestPath, {});
const timing = readJson<Record<string, number[][]>>(timingPath, {});

let copied = 0;
for (const [voice, files] of Object.entries(theirs)) {
  for (const text of lines) {
    const file = files[text];
    if (!file || ours[voice]?.[text]) continue;
    const src = resolve(from, "public", file);
    if (!existsSync(src)) continue;
    const dst = resolve(root, "public", file);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    ours[voice] ??= {};
    ours[voice][text] = file;
    if (theirTiming[file]) timing[file] = theirTiming[file];
    copied++;
  }
}

writeFileSync(manifestPath, JSON.stringify(ours, null, 2) + "\n");
writeFileSync(timingPath, JSON.stringify(timing) + "\n");
const left = lines.filter((t) => !ours.sua?.[t]);
console.log(`빌려 옴 ${copied}개 (한글나라 ${from})`);
console.log(`수아로 아직 없는 말 ${left.length}줄 · ${left.reduce((n, t) => n + [...t].length, 0)}자 — npm run voice:make -- --voice sua 로 견적`);
