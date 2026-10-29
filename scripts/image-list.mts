/**
 * 힉스필드로 만들 그림 목록 — 지금 임시 그림(흰 블록·숫자·이모지)으로 대신하고 있는 자리들.
 *   npm run image:list   → scripts/image-list.json
 * 그림체는 넘버블럭스(refs/인물구성도.jpg · refs/인물구성2.jpg, 2026-10-27 사용자). 키는 src/content/image-manifest.json 에 그대로 쓰인다(lib/assets):
 *   숫자 친구 "friend:3" · 안내 친구 "guide" · 세는 물건 "thing:apple" · 메뉴 "icon:menu:free" · 놀이터 카드 "scene:free:count" · 바탕 "bg:home"
 * 하온이 얼굴(child:face)은 한글나라 그림을 그대로 빌려 써서 여기 없다.
 */

import { writeFileSync } from "node:fs";
import { FRIENDS, GUIDE_FRIEND, hasTowerForm } from "../src/curriculum/friends.ts";
import { GAMES } from "../src/curriculum/games.ts";
import { MENUS } from "../src/curriculum/menus.ts";
import { THINGS } from "../src/curriculum/things.ts";

export type Kind = "friend" | "guide" | "thing" | "icon" | "scene" | "bg" | "app";
type Entry = { key: string; kind: Kind; now: string; what: string; n?: number; form?: "shape" | "tower" };

// 대표 모습(인물구성도) 10장 + 모습이 다른 4·6·8·9 의 기둥 모습(인물구성2) 4장 — 2026-10-27 사용자: "인물구성도처럼, 인물구성2도 곳곳에"
const friends: Entry[] = [
  ...FRIENDS.map((f) => ({ key: `friend:${f.n}`, kind: "friend" as const, n: f.n, form: "shape" as const, now: "흰 블록(임시)", what: `숫자 친구 ${f.n} — 대표 모습(인물구성도)${f.cols > 1 ? `, ${f.cols}열` : ", 한 줄 기둥"}` })),
  ...FRIENDS.filter((f) => hasTowerForm(f.n)).map((f) => ({ key: `friend:${f.n}:tower`, kind: "friend" as const, n: f.n, form: "tower" as const, now: "흰 블록 기둥(임시)", what: `숫자 친구 ${f.n} — 기둥 모습(인물구성2)` })),
];

const guide: Entry[] = [
  { key: "guide", kind: "guide", n: GUIDE_FRIEND, now: "123 카드", what: `안내 친구(${GUIDE_FRIEND}) — 손 흔들며 인사` },
  { key: "guide:cheer", kind: "guide", n: GUIDE_FRIEND, now: "123 카드", what: `안내 친구(${GUIDE_FRIEND}) — 두 팔 들고 신난 모습` },
  { key: "guide:wow", kind: "guide", n: GUIDE_FRIEND, now: "123 카드", what: `안내 친구(${GUIDE_FRIEND}) — 깜짝 놀란 모습` },
];

const things: Entry[] = THINGS.map((t) => ({ key: `thing:${t.id}`, kind: "thing", now: t.emoji, what: `세는 물건: ${t.name}` }));

const icons: Entry[] = [
  ...MENUS.map((m) => ({ key: `icon:menu:${m.id}`, kind: "icon" as const, now: m.icon, what: `메뉴 아이콘: ${m.title} — 숫자 친구가 그 놀이를 하는 모습` })),
  { key: "icon:block", kind: "icon", now: "블록(SVG)", what: "모으는 블록 하나 — 보상(노란 큐브)" },
  ...(
    [
      ["lock", "🔒", "잠금"],
      ["party", "🎉", "축하"],
      ["sparkle", "✨", "반짝"],
      ["star", "⭐", "별(도장)"],
      ["clap", "👏", "손뼉 치는 손"],
      ["home", "🏠", "집(돌아가기)"],
      ["moon", "🌙", "내일 또(달)"],
      ["crown", "👑", "왕관(마스터)"],
    ] as const
  ).map(([id, now, what]) => ({ key: `icon:ui:${id}`, kind: "icon" as const, now, what })),
  // 놀이 아이콘 — 오늘의 놀이 순서 표시·놀이터 제목(2026-10-27 사용자: OS 이모지가 그림체와 안 맞음).
  // 같은 뜻 그림이 이미 있는 놀이(만나기=안내 친구·몇 개일까=사과·블록 쌓기=블록·숫자 쓰기=연필 친구·손뼉)는 그 그림을 쓴다(lib/assets UI_ART)
  ...(
    [
      ["count", "👆", "하나씩 세기 — a cute hand with the index finger pointing, counting"],
      ["find-num", "👂", "숫자 찾기 — a friendly cartoon ear with small curved sound waves, listening"],
      ["compare", "⚖️", "더 많은 쪽 — a toy balance scale tipping to one side"],
      ["next-num", "➡️", "다음 숫자 — a chunky rounded arrow pointing right"],
      ["shape", "🔺", "모양 찾기 — a red circle, a yellow triangle and a blue square grouped together, chunky toy shapes"],
      ["pattern", "🔁", "규칙 찾기 — a short row of balls alternating red and blue"],
      ["join", "🤝", "모아 보기 — a stack of blue toy cubes and a stack of pink toy cubes pushed together"],
      ["size", "📏", "크기 비교 — a big blue circle next to a small blue circle"],
      ["add", "➕", "더하기 — a chunky rounded plus-sign shaped toy, green"],
      ["subtract", "➖", "빼기 — a chunky rounded minus-sign shaped toy, orange"],
      ["sort", "🧺", "모양 나누기 — a small woven basket holding a few colourful toy shapes"],
      // 업체 유아 단계 놀이(2026-10-29)
      ["count-up", "🔢", "수 세기 기초 — three yellow toy stars in a row with three small dots above them"],
      ["match", "🔗", "짝 연결하기 — two matching red apple cards joined by a short yellow line"],
      ["farm", "🐥", "작은 농장 — a little red barn with a white X on the door"],
      ["tally", "🧮", "숫자 퍼즐 — a small wooden board with tally marks and one wooden number tile"],
      ["shape-pair", "🔷", "도형 맞추기 — a big blue square and a small blue square side by side"],
      ["dice", "🎲", "주사위 찾기 — a chunky white toy die showing three red dots"],
      ["shop", "🛒", "가게 놀이 — a small red shopping basket with a red apple inside"],
      ["number-line", "📐", "수직선 밝히기 — a short number line with three coloured toy cubes on it, glowing"],
    ] as const
  ).map(([id, now, what]) => ({ key: `icon:play:${id}`, kind: "icon" as const, now, what })),
  // 생각 놀이 아이콘(2026-10-29)
  ...(
    [
      ["mirror", "🦋", "거울 그림 — a symmetrical butterfly made of colourful dots, mirrored left and right"],
      ["memory", "🃏", "짝 맞추기 — two face-down cards and one card flipped open showing a red cube"],
      ["who-hid", "🙈", "누가 숨었을까 — a small red stage curtain half open"],
    ] as const
  ).map(([id, now, what]) => ({ key: `icon:think:${id}`, kind: "icon" as const, now, what })),
  // 모험 지도(메뉴 바에는 없고 제목 아이콘으로)
  { key: "icon:menu:map", kind: "icon", now: "🗺️", what: "메뉴 아이콘: 모험 지도 — 숫자 친구가 지도를 펼친 모습" },
];

const scenes: Entry[] = GAMES.map((g) => ({ key: `scene:free:${g.id}`, kind: "scene", now: g.icon, what: `놀이터 카드 장면: ${g.title}` }));

const bgs: Entry[] = [
  { key: "bg:home", kind: "bg", now: "CSS 구름", what: "첫 화면 바탕 — 넘버랜드 언덕과 하늘(가운데는 비워 둠)" },
  { key: "bg:play", kind: "bg", now: "CSS 구름", what: "오늘의 놀이 바탕" },
  { key: "bg:free", kind: "bg", now: "CSS 구름", what: "놀이터 바탕" },
  { key: "bg:friends", kind: "bg", now: "CSS 구름", what: "숫자 친구 앨범 바탕" },
  { key: "bg:write", kind: "bg", now: "CSS 구름", what: "숫자 쓰기 바탕" },
];

const app: Entry[] = [{ key: "app-icon", kind: "app", now: "123 (SVG)", what: "앱 아이콘 — 숫자 친구 1 얼굴 (512×512)" }];

const sections = { friends, guide, things, icons, scenes, bgs, app };
const total = Object.values(sections).reduce((n, s) => n + s.length, 0);
writeFileSync(new URL("./image-list.json", import.meta.url), JSON.stringify({ total, ...sections }, null, 2) + "\n");
console.log(
  `숫자 친구 ${friends.length} · 안내 친구 ${guide.length} · 물건 ${things.length} · 아이콘 ${icons.length} · 놀이터 장면 ${scenes.length} · 바탕 ${bgs.length} · 앱 아이콘 ${app.length} → 합계 ${total}장 → scripts/image-list.json`,
);
