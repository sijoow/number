/**
 * 첫 화면 아래 메뉴 — 아이가 바로 알아듣는 말로. 메뉴 화면 제목(ModeShell)도 이 이름을 쓴다.
 * 그림은 힉스필드 "icon:menu:<id>"(넘버블럭스 친구가 그 놀이를 하는 모습) — 없으면 이모지.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export type MenuId = "free" | "games" | "friends" | "write" | "tower";

export interface Menu {
  id: MenuId;
  href: string;
  title: string;
  /** 그림이 없을 때 대신 보일 이모지 */
  icon: string;
  tone: "sky" | "butter" | "mint" | "lilac" | "rose" | "peach";
}

export const MENUS: Menu[] = [
  { id: "free", href: "/free", title: "놀이터", icon: "🎮", tone: "sky" },
  // 우리가 같이 만든 오리지널 숫자 게임(2026-10-27 사용자) — curriculum/originals
  { id: "games", href: "/games", title: "숫자 놀이", icon: "🎲", tone: "lilac" },
  { id: "friends", href: "/friends", title: "숫자 친구", icon: "🧱", tone: "butter" },
  { id: "write", href: "/write", title: "숫자 쓰기", icon: "✏️", tone: "mint" },
  // 모은 블록으로 탑 쌓기(2026-10-28 사용자) — 그림은 블록 아이콘(lib/assets UI_ART 🧱)
  { id: "tower", href: "/tower", title: "블록 탑", icon: "🧱", tone: "peach" },
];

export function menuOf(id: MenuId): Menu {
  return MENUS.find((m) => m.id === id) ?? MENUS[0];
}
