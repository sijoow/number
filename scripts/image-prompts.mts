/**
 * 힉스필드 프롬프트 — scripts/image-list.json 의 그림마다 모델 설정·레퍼런스·프롬프트·저장 파일을 정한다.
 *   npm run image:list && npm run image:prompts   → scripts/image-prompts.json
 * 모델은 한글나라와 같이 GPT Image 2.5 medium:
 *   친구·안내 친구·물건·아이콘 = 1:1 1k 바탕 투명(장당 0.5크레딧) · 놀이터 장면 = 4:3 1k · 바탕 = 16:9 2k(장당 1크레딧)
 * 레퍼런스는 refs/ 의 인물구성도 두 장(생성할 때 업로드해서 넣는다). 그림체 설명은 docs/numberblocks-style.md(조사)를 따른다.
 * 숫자 친구 생김새는 src/curriculum/friends.ts 의 look — 인물구성도를 보고 채운다(지어내지 않는다).
 * 파일 이름은 모두 영문·숫자 — Cafe24 는 한글 파일 이름을 못 찾는다.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { FRIENDS, layoutOf } from "../src/curriculum/friends.ts";
import { GAMES } from "../src/curriculum/games.ts";
import { THINGS } from "../src/curriculum/things.ts";
import { AS_REF, CHAR, CUTOUT, GAME_SCENE, MENU_SCENE, NO_TEXT, numberAbove, SCENE, STYLE, THING_EN } from "./image-style.mts";

type Params = { model: "gpt_image_2_5"; quality: "medium"; resolution: "1k" | "2k"; aspect_ratio: "1:1" | "4:3" | "16:9"; background: "transparent" | "opaque" };
type Entry = { key: string; kind: "friend" | "guide" | "thing" | "icon" | "scene" | "bg" | "app"; what: string; n?: number; form?: "shape" | "tower" };
type Item = { key: string; file: string; refs: string[]; params: Params; credits: number; prompt: string };

// 생성용 레퍼런스 — 사용자가 준 refs 두 장에서 로고·남의 워터마크만 지운 사본(scripts/refs-clean.mts). 원본은 그대로 둔다
const REFS = ["refs/gen/numberblocks-a.png", "refs/gen/numberblocks-b.png"];
const cutout: Params = { model: "gpt_image_2_5", quality: "medium", resolution: "1k", aspect_ratio: "1:1", background: "transparent" };
const card: Params = { model: "gpt_image_2_5", quality: "medium", resolution: "1k", aspect_ratio: "4:3", background: "opaque" };
const wide: Params = { model: "gpt_image_2_5", quality: "medium", resolution: "2k", aspect_ratio: "16:9", background: "opaque" };
const creditsOf = (p: Params) => (p.resolution === "2k" ? 1 : 0.5);

const list = JSON.parse(readFileSync(new URL("./image-list.json", import.meta.url), "utf8")) as Record<string, Entry[] | number>;
const entries = Object.values(list).filter(Array.isArray).flat() as Entry[];

function friendLook(n: number): string {
  const f = FRIENDS.find((x) => x.n === n);
  return f?.look ? f.look : `the Numberblock with exactly ${n} block${n > 1 ? "s" : ""}, exactly as shown in the reference images (same colour, same face, same accessories)`;
}

/** 블록 배치 — 대표 모습은 인물구성도(첫 레퍼런스), 기둥 모습은 인물구성2(둘째 레퍼런스) */
function formOf(n: number, form: "shape" | "tower"): string {
  const { cols, rows } = layoutOf(n, form);
  if (cols === 1) return `Body is a single vertical column of exactly ${n} block${n > 1 ? "s" : ""}, like ${form === "tower" ? "the second" : "the first"} reference image.`;
  return `Body is a ${cols} wide by ${rows} tall rectangle of exactly ${n} blocks (${cols}×${rows}), exactly like this character in the first reference image.`;
}

const MOOD: Record<string, string> = {
  guide: "waving hello with one hand, big friendly smile",
  "guide:cheer": "both arms up, cheering, very happy",
  "guide:wow": "surprised, mouth open, arms out",
};

function build(e: Entry): Item | null {
  const id = e.key.replace(/^[a-z-]+:/, "").replace(/:/g, "-");
  switch (e.kind) {
    case "friend": {
      const form = e.form ?? "shape";
      const file = form === "tower" ? `img/friends/${e.n}-tower.webp` : `img/friends/${e.n}.webp`;
      return {
        key: e.key,
        file,
        refs: REFS,
        params: cutout,
        credits: 0.5,
        prompt: [STYLE, CHAR, `One character: ${friendLook(e.n!)}. ${formOf(e.n!, form)} Standing, front view, full body, happy.`, numberAbove(e.n!), AS_REF, NO_TEXT, CUTOUT].join(" "),
      };
    }
    case "guide":
      return {
        key: e.key,
        file: `img/guide/${e.key === "guide" ? "happy" : id}.webp`,
        refs: REFS,
        params: cutout,
        credits: 0.5,
        prompt: [STYLE, CHAR, `One character: ${friendLook(e.n!)}, ${MOOD[e.key]}. Full body.`, numberAbove(e.n!), AS_REF, NO_TEXT, CUTOUT].join(" "),
      };
    case "thing": {
      const t = THINGS.find((x) => `thing:${x.id}` === e.key);
      return t ? { key: e.key, file: `img/things/${t.id}.webp`, refs: REFS, params: cutout, credits: 0.5, prompt: [STYLE, `A single ${THING_EN[t.id] ?? t.id}, simple smooth toy-like object, no face, no character.`, NO_TEXT, CUTOUT].join(" ") } : null;
    }
    case "icon": {
      const menu = e.key.startsWith("icon:menu:") ? MENU_SCENE[e.key.slice("icon:menu:".length)] : undefined;
      const body = menu ?? `A small app icon: ${e.what}. Simple object, no character.`;
      return { key: e.key, file: `img/icons/${id}.webp`, refs: REFS, params: cutout, credits: 0.5, prompt: [STYLE, menu ? CHAR : "", body, menu ? AS_REF : "", NO_TEXT, CUTOUT].filter(Boolean).join(" ") };
    }
    case "scene": {
      const g = GAMES.find((x) => `scene:free:${x.id}` === e.key);
      return g ? { key: e.key, file: `img/scenes/free-${g.id}.webp`, refs: REFS, params: card, credits: 0.5, prompt: [STYLE, CHAR, GAME_SCENE[g.id] ?? `Numberblocks playing "${g.title}".`, "Each Numberblock has its small black numeral floating above its head.", AS_REF, SCENE, NO_TEXT].join(" ") } : null;
    }
    case "bg":
      return { key: e.key, file: `img/bg/${id}.webp`, refs: REFS, params: wide, credits: 1, prompt: [STYLE, `A wide background of Numberland: ${e.what}. No characters. Keep the middle area calm and empty so cards can sit on top.`, SCENE, NO_TEXT].join(" ") };
    case "app":
      return { key: e.key, file: "img/app-icon.png", refs: REFS, params: { ...cutout, background: "opaque" }, credits: 0.5, prompt: [STYLE, CHAR, `App icon: the face of ${friendLook(1)}, filling a rounded square, plain soft background.`, AS_REF, NO_TEXT].join(" ") };
  }
}

const items = entries.map(build).filter((x): x is Item => x !== null);
const credits = items.reduce((n, it) => n + creditsOf(it.params), 0);
writeFileSync(new URL("./image-prompts.json", import.meta.url), JSON.stringify({ total: items.length, credits, refs: REFS, items }, null, 2) + "\n");
console.log(`프롬프트 ${items.length}장 · 약 ${credits} 크레딧 → scripts/image-prompts.json (생성은 확인 받은 뒤에만)`);
