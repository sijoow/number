"use client";

import type { CSSProperties } from "react";

/*
 * 숫자 놀이에서 쓰는 단순한 물건 — 주사위·북·시소 받침. 모양이 단순해서 SVG 로 그린다(캐릭터는 그리지 않는다 — 친구는 늘 생성 그림).
 */

/** 주사위 눈 자리(0~1) — 보통 주사위와 같은 배치 */
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.26, 0.26],
    [0.5, 0.5],
    [0.74, 0.74],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.26, 0.26],
    [0.74, 0.26],
    [0.5, 0.5],
    [0.26, 0.74],
    [0.74, 0.74],
  ],
  6: [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.76],
    [0.72, 0.76],
  ],
};

/** 주사위 한 면 — 하얀 둥근 네모에 빨간 눈 */
export function Die({ face, size, className = "", style }: { face: number; size: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className={`shrink-0 ${className}`} style={{ width: size, height: size, ...style }} aria-label={`주사위 ${face}`} role="img">
      <rect x="4" y="4" width="92" height="92" rx="20" fill="#ffffff" stroke="rgb(62 58 82 / 0.18)" strokeWidth="3" />
      <rect x="4" y="80" width="92" height="16" rx="8" fill="rgb(62 58 82 / 0.06)" />
      {(PIPS[face] ?? []).map(([x, y], i) => (
        <circle key={i} cx={x * 100} cy={y * 100} r="9.5" fill="#ef6a6a" />
      ))}
    </svg>
  );
}

/** 색 블록 — 블록 친구 만들기의 칸을 채우는 블록(친구 색, 10 은 흰 블록에 빨간 테두리) */
export function ColorCube({ size, fill, edge, className = "" }: { size: string; fill: string; edge?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 rounded-[18%] ${className}`}
      style={{
        width: size,
        height: size,
        background: fill,
        border: edge ? `calc(${size} * 0.08) solid ${edge}` : undefined,
        boxShadow: `inset 0 calc(${size} * -0.12) 0 rgb(0 0 0 / 0.14), 0 calc(${size} * 0.05) calc(${size} * 0.1) rgb(62 58 82 / 0.18)`,
      }}
    >
      <span className="absolute left-[16%] top-[12%] h-[20%] w-[32%] rounded-full bg-white/50" />
    </span>
  );
}

/** 북 — 빨간 통에 하얀 가죽, 칠 때마다 살짝 눌린다(hit 이 바뀌면 다시 그려져 애니메이션) */
export function Drum({ size, hit = 0, className = "" }: { size: string; hit?: number; className?: string }) {
  return (
    <svg key={hit} viewBox="0 0 120 100" style={{ width: size, height: `calc(${size} * 0.83)` }} className={`shrink-0 ${hit ? "animate-wiggle" : ""} ${className}`} aria-hidden>
      <rect x="14" y="30" width="92" height="56" rx="10" fill="#ef6a6a" />
      <path d="M14 44 L106 74 M14 74 L106 44" stroke="#f5c84b" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="60" cy="86" rx="46" ry="10" fill="#c9504f" />
      <ellipse cx="60" cy="30" rx="46" ry="14" fill="#fffaf0" stroke="#e9dcc6" strokeWidth="3" />
    </svg>
  );
}

/** 시소 받침(세모) */
export function Fulcrum({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 100 80" className="shrink-0" style={{ width: size, height: `calc(${size} * 0.8)` }} aria-hidden>
      <path d="M50 6 L92 76 L8 76 Z" fill="#f5a742" stroke="#d98a2b" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
