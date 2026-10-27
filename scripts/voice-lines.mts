/**
 * Typecast(수아) 음성으로 만들 말 목록 — 앱이 소리 내 읽는 모든 말(curriculum/lines 의 allLineTexts).
 *   안내 말 · 숫자 이름(하나~열) · 숫자가 든 말(블록을 세 개 쌓아 볼까?) · 모양·물건 이름
 * 같은 말은 한 번만. 글자 수 합계는 크레딧 견적용.
 *   npm run voice:lines   → scripts/voice-lines.json
 * 그다음 npm run voice:reuse 로 한글나라에 이미 구운 같은 말을 빌려 오고, 남은 것만 npm run voice:make 로 견적·굽기.
 */

import { writeFileSync } from "node:fs";
import { allLineTexts, LINES } from "../src/curriculum/lines.ts";
import { MAX_NUMBER, nameOf, range } from "../src/curriculum/numbers.ts";
import { SHAPES, THINGS } from "../src/curriculum/things.ts";

const fixed = new Set<string>(Object.values(LINES).flatMap((v) => (typeof v === "string" ? [v] : [...v])));
const numbers = new Set(range(1, MAX_NUMBER).map(nameOf));
const names = new Set([...SHAPES.map((s) => s.name), ...THINGS.map((t) => t.name)]);

const groups: Record<string, string[]> = { "안내 말": [], "숫자 이름": [], "숫자가 든 말": [], "모양·물건 이름": [] };
const seen = new Set<string>();
for (const t of allLineTexts()) {
  if (!t || seen.has(t)) continue;
  seen.add(t);
  const g = fixed.has(t) ? "안내 말" : numbers.has(t) ? "숫자 이름" : names.has(t) ? "모양·물건 이름" : "숫자가 든 말";
  groups[g].push(t);
}

const all = [...seen];
const chars = all.reduce((n, t) => n + [...t].length, 0);
writeFileSync(new URL("./voice-lines.json", import.meta.url), JSON.stringify({ total: all.length, chars, groups }, null, 2) + "\n");
for (const [name, list] of Object.entries(groups)) console.log(`${name}: ${list.length}줄, ${list.reduce((n, t) => n + [...t].length, 0)}자`);
console.log(`합계: ${all.length}줄, ${chars}자 → scripts/voice-lines.json`);
