/**
 * 세는 물건 — 세기·몇 개일까·더 많은 쪽·규칙 찾기 판에 놓이는 것들.
 * 그림은 힉스필드 "thing:<id>"(넘버블럭스 그림체, 바탕 투명) — 아직 없으면 이모지로 보인다(components/Art).
 * unit 은 셀 때 붙는 말("사과 세 개", "물고기 세 마리").
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export type Unit = "개" | "마리";

export interface Thing {
  id: string;
  name: string;
  emoji: string;
  unit: Unit;
}

export const THINGS: readonly Thing[] = [
  { id: "apple", name: "사과", emoji: "🍎", unit: "개" },
  { id: "strawberry", name: "딸기", emoji: "🍓", unit: "개" },
  { id: "banana", name: "바나나", emoji: "🍌", unit: "개" },
  { id: "cookie", name: "쿠키", emoji: "🍪", unit: "개" },
  { id: "balloon", name: "풍선", emoji: "🎈", unit: "개" },
  { id: "star", name: "별", emoji: "⭐", unit: "개" },
  { id: "ball", name: "공", emoji: "⚽", unit: "개" },
  { id: "car", name: "자동차", emoji: "🚗", unit: "개" },
  { id: "flower", name: "꽃", emoji: "🌸", unit: "개" },
  { id: "fish", name: "물고기", emoji: "🐟", unit: "마리" },
  { id: "chick", name: "병아리", emoji: "🐥", unit: "마리" },
  { id: "butterfly", name: "나비", emoji: "🦋", unit: "마리" },
  // 작은 농장 동물(2026-10-29 — 업체 농장처럼 판마다 동물이 바뀐다)
  { id: "sheep", name: "양", emoji: "🐑", unit: "마리" },
  { id: "cow", name: "소", emoji: "🐄", unit: "마리" },
  { id: "pig", name: "돼지", emoji: "🐷", unit: "마리" },
];

const BY_ID = new Map(THINGS.map((t) => [t.id, t]));

export function thingOf(id: string): Thing {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`모르는 물건: ${id}`);
  return t;
}

/** 모양 — 동그라미·세모·네모. 그림은 SVG 로 그린다(크기·색·돌림을 바꿔도 같은 모양인지 보는 놀이라서) */
export type ShapeId = "circle" | "triangle" | "square";

export const SHAPES: readonly { id: ShapeId; name: string }[] = [
  { id: "circle", name: "동그라미" },
  { id: "triangle", name: "세모" },
  { id: "square", name: "네모" },
];

export function shapeName(id: ShapeId): string {
  return SHAPES.find((s) => s.id === id)?.name ?? id;
}

/** 모양 색 — 같은 모양이라도 색이 달라도 같다는 걸 보여 준다. 색 바퀴 차례(빨강→보라) — 모양 나누기는 두 칸 이상 떨어진 색끼리 짝짓는다 */
export const SHAPE_COLORS = ["#ef6a6a", "#f5a742", "#f2cf3b", "#5cc489", "#4fa8e6", "#9a80e2"] as const;

/** 색 이름 — 모양 나누기("빨간색을 모두 골라 봐!"). SHAPE_COLORS 와 같은 차례 */
const COLOR_NAMES = ["빨간색", "주황색", "노란색", "초록색", "파란색", "보라색"] as const;

export function colorName(hex: string): string {
  const i = SHAPE_COLORS.indexOf(hex as (typeof SHAPE_COLORS)[number]);
  if (i < 0) throw new Error(`모르는 색: ${hex}`);
  return COLOR_NAMES[i];
}
