/**
 * 숫자 놀이 — 우리가 같이 만든 오리지널 숫자 게임(2026-10-27 사용자: "숫자 놀이라고 해서 하나 더 생성하고 거기선 너랑 나랑 만든 오리지널 숫자 게임").
 * 놀이터(오늘의 놀이에서 배운 놀이 다시 하기)와 따로 — 진도와 상관없이 늘 열려 있고, 수 범위는 만난 친구까지(lib/progress topNumber).
 * 놀이 방식은 우리가 정했다 — 토도수학 자유 모드·사고력 게임이나 넘버블럭스 공식 앱 게임을 옮기지 않는다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export type OriginalId = "yut" | "maker" | "shadow" | "seesaw" | "share" | "drum";

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
];

export function originalOf(id: string): Original | undefined {
  return ORIGINALS.find((o) => o.id === id);
}
