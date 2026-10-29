/**
 * 숫자 놀이 — 우리가 같이 만든 오리지널 숫자 게임(2026-10-27 사용자: "숫자 놀이라고 해서 하나 더 생성하고 거기선 너랑 나랑 만든 오리지널 숫자 게임").
 * 놀이터(오늘의 놀이에서 배운 놀이 다시 하기)와 따로 — 진도와 상관없이 늘 열려 있고, 수 범위는 만난 친구까지(lib/progress topNumber).
 * 놀이 방식은 우리가 정했다 — 토도수학 자유 모드·사고력 게임이나 넘버블럭스 공식 앱 게임을 옮기지 않는다.
 * 뒤의 아홉은 선물 놀이(2026-10-29 사용자: 녹화해 온 업체 놀이 중 고른 것을 흐름만 따라 우리 그림으로) — 미션 도장을 받을 때마다 하나씩 열린다(curriculum/gifts).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export type OriginalId =
  | "yut"
  | "maker"
  | "shadow"
  | "seesaw"
  | "share"
  | "drum"
  | "eggs"
  | "parts"
  | "more-less"
  | "hide-line"
  | "meal"
  | "num-train"
  | "rocket"
  | "ten-frame"
  | "num-board";

export interface Original {
  id: OriginalId;
  title: string;
  /** 카드 아래 — 이 놀이로 익히는 것(부모가 보는 말) */
  learn: string;
  /** 놀이 화면 제목 옆 그림 — 같은 뜻 그림이 이미 있는 것만(lib/assets UI_ART 의 이모지), 없으면 "" 로 제목만 */
  icon: string;
  tone: "sky" | "butter" | "mint" | "lilac" | "rose" | "peach";
}

export const ORIGINALS: readonly Original[] = [
  // 주사위 산책을 키운 판 놀이(2026-10-27 사용자: 윷놀이 형식을 주사위로, 혼자·둘이·셋이, 캐릭터 고르기) — 가장 큰 놀이라 맨 앞
  { id: "yut", title: "주사위 윷놀이", learn: "주사위 눈 · 한 칸씩 세기", icon: "", tone: "butter" },
  { id: "maker", title: "블록 친구 만들기", learn: "블록 수가 곧 숫자", icon: "🧱", tone: "sky" },
  { id: "shadow", title: "그림자 친구", learn: "모양으로 수 알아보기", icon: "", tone: "lilac" },
  { id: "seesaw", title: "시소", learn: "더 큰 수 · 같은 수", icon: "⚖️", tone: "mint" },
  { id: "share", title: "간식 나누기", learn: "똑같이 나누기", icon: "🍪", tone: "peach" },
  { id: "drum", title: "북소리 세기", learn: "소리로 세기", icon: "", tone: "rose" },
  // 선물 놀이 — 열리는 차례는 curriculum/gifts
  { id: "eggs", title: "알 속 숫자", learn: "빈 곳에 올 수", icon: "🥚", tone: "butter" },
  { id: "parts", title: "몇이랑 몇?", learn: "두 수를 모아 한 수", icon: "👫", tone: "sky" },
  { id: "more-less", title: "하나 더 · 하나 덜", learn: "하나 많게 · 하나 적게", icon: "↕️", tone: "mint" },
  { id: "hide-line", title: "숨은 친구 찾기", learn: "수직선에서 수의 자리", icon: "🔍", tone: "lilac" },
  { id: "meal", title: "식사 시간", learn: "많다 · 적다 · 같다", icon: "🍽️", tone: "peach" },
  { id: "num-train", title: "숫자 열차", learn: "작은 수부터 차례로", icon: "🚂", tone: "rose" },
  { id: "rocket", title: "로켓 발사", learn: "거꾸로 세기", icon: "🚀", tone: "sky" },
  { id: "ten-frame", title: "열 칸 채우기", learn: "열 만들기 · 열과 몇", icon: "🔟", tone: "butter" },
  { id: "num-board", title: "숫자 판", learn: "수의 차례", icon: "🔢", tone: "mint" },
];

export function originalOf(id: string): Original | undefined {
  return ORIGINALS.find((o) => o.id === id);
}
