import type { ActivityKind } from "@/curriculum/types";

/** 놀이 종류마다 아이 눈에 보이는 아이콘 — 오늘의 놀이 순서 표시 */
export const KIND_ICON: Record<ActivityKind, string> = {
  meet: "👋",
  count: "👆",
  "how-many": "🍎",
  "find-num": "👂",
  build: "🧱",
  trace: "✏️",
  clap: "👏",
  compare: "⚖️",
  "next-num": "➡️",
  shape: "🔺",
  pattern: "🔁",
  join: "🤝",
  size: "📏",
  add: "➕",
  subtract: "➖",
  sort: "🧺",
};

/** 놀이 이름 — 부모 페이지 미리 보기·놀이터와 같은 말 */
export const KIND_LABEL: Record<ActivityKind, string> = {
  meet: "숫자 친구 만나기",
  count: "하나씩 세기",
  "how-many": "몇 개일까?",
  "find-num": "숫자 찾기",
  build: "블록 쌓기",
  trace: "숫자 쓰기",
  clap: "짝짝 손뼉",
  compare: "더 많은 쪽",
  "next-num": "다음 숫자",
  shape: "모양 찾기",
  pattern: "규칙 찾기",
  join: "모아 보기",
  size: "크기 비교",
  add: "더하기",
  subtract: "빼기",
  sort: "모양 나누기",
};
