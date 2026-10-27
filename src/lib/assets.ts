/**
 * 그림 찾기 — 힉스필드로 만든 그림이 있으면 그 주소, 없으면 null(화면은 임시 그림·이모지를 그린다).
 * 목록은 content/image-manifest.json:
 *   숫자 친구   "friend:3"        → "img/friends/3.webp"   (넘버블럭스 친구, 전신, 바탕 투명)
 *   세는 물건   "thing:apple"     → "img/things/apple.webp"
 *   안내 친구   "guide" · "guide:cheer" · "guide:wow"
 *   아이콘      "icon:menu:free"  · 바탕 "bg:home" · 놀이터 카드 "scene:free:count"
 *   (값 끝의 "?v=…" 는 내용 해시 — 그림을 바꿔 올리면 주소가 바뀌어 캐시된 예전 그림이 안 나온다)
 * 값이 https:// 로 시작하면 그 주소 그대로 — 한글나라에 이미 있는 그림(하온이 얼굴 "child:face")을 빌려 쓴다.
 * 그림 파일은 회사 Cafe24 호스팅에 올려 두고(npm run image:upload) 화면에는 그 주소를 바로 쓴다.
 * Cafe24 주소가 없으면(IMG_BASE 빈 값) public/ 의 사본을 쓴다.
 */

import manifest from "@/content/image-manifest.json";

const FILES = manifest as Record<string, string>;
const BASE = process.env.IMG_BASE ?? "";

export function imageOf(key: string): string | null {
  const f = FILES[key];
  if (!f) return null;
  if (/^https?:\/\//.test(f)) return f;
  if (!BASE) return `/${f}`;
  return BASE + f.replace(/^img\//, "");
}

/** 화면에 쓰던 이모지 → 같은 뜻의 그림(있으면) */
const UI_ART: Record<string, string> = {
  "🔒": "icon:ui:lock",
  "🎉": "icon:ui:party",
  "✨": "icon:ui:sparkle",
  "⭐": "icon:ui:star",
  "👏": "icon:ui:clap",
  "🏠": "icon:ui:home",
  "🌙": "icon:ui:moon",
  "👑": "icon:ui:crown",
  // 놀이 아이콘(curriculum/games · play/kindIcon) 중 뜻이 같은 그림이 이미 있는 것 — 나머지(👆👂⚖➡🔺🔁🤝)는 아이콘 그림이 생기면(2026-10-27 사용자: OS 이모지가 그림체와 안 맞음)
  "🧱": "icon:block",
  "✏": "icon:menu:write",
  "🍎": "thing:apple",
  "👋": "guide",
  // 숫자 놀이(오리지널) 제목 옆 — 시소=저울 아이콘, 간식 나누기=쿠키
  "⚖": "icon:play:compare",
  "🍪": "thing:cookie",
};

/** 이모지 자리에 넣을 그림 주소 — 없으면 null(이모지 그대로) */
export function artOf(emoji: string): string | null {
  const key = UI_ART[emoji.replace(/️/g, "")];
  return key ? imageOf(key) : null;
}
