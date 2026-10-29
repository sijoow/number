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

/** 알 — 위가 조금 좁은 달걀. open 이면 위가 지그재그로 깨진 아래 껍데기만(친구가 나온 뒤) */
export function Egg({ size, fill = "#fff7e6", open = false, className = "" }: { size: string; fill?: string; open?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 100 120" style={{ width: size, height: `calc(${size} * 1.2)` }} className={`shrink-0 ${className}`} aria-hidden>
      {open ? (
        <path d="M6 74 L18 64 L30 76 L42 62 L54 76 L66 62 L78 76 L94 66 C 97 100, 77 116, 50 116 C 23 116, 3 100, 6 74 Z" fill={fill} stroke="rgb(62 58 82 / 0.18)" strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M50 4 C 80 4, 96 50, 96 76 C 96 102, 76 116, 50 116 C 24 116, 4 102, 4 76 C 4 50, 20 4, 50 4 Z" fill={fill} stroke="rgb(62 58 82 / 0.18)" strokeWidth="3" />
          <ellipse cx="32" cy="36" rx="7" ry="12" fill="#ffffff" opacity="0.75" />
        </>
      )}
    </svg>
  );
}

/** 접시 — 하얀 동그라미에 테두리 한 줄 */
export function Plate({ size, className = "" }: { size: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="50" cy="52" r="47" fill="rgb(62 58 82 / 0.1)" />
      <circle cx="50" cy="48" r="47" fill="#ffffff" />
      <circle cx="50" cy="48" r="36" fill="none" stroke="#e8e4f0" strokeWidth="3" />
    </svg>
  );
}

/** 덤불 — 숨은 친구 찾기에서 친구가 숨는 곳 */
export function Bush({ size, className = "" }: { size: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 70" style={{ width: size, height: `calc(${size} * 0.7)` }} className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="28" cy="44" r="24" fill="#5cbf6a" />
      <circle cx="72" cy="44" r="24" fill="#5cbf6a" />
      <circle cx="50" cy="30" r="28" fill="#6fd27c" />
      <rect x="10" y="44" width="80" height="24" rx="12" fill="#4fae5d" />
      <circle cx="40" cy="22" r="6" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

/** 기관차 — 왼쪽을 보고 달린다 */
export function TrainEngine({ w }: { w: string }) {
  return (
    <svg viewBox="0 0 130 100" aria-hidden className="shrink-0" style={{ width: `calc(${w} * 1.4)`, height: `calc(${w} * 1.08)` }}>
      <rect x="34" y="8" width="14" height="22" rx="3" fill="#3e3a52" />
      <rect x="28" y="4" width="26" height="9" rx="4" fill="#3e3a52" />
      <rect x="14" y="30" width="70" height="44" rx="14" fill="#ef6a6a" />
      <rect x="76" y="14" width="46" height="60" rx="8" fill="#4fa8e6" />
      <rect x="84" y="22" width="30" height="22" rx="6" fill="#e8f6ff" />
      <path d="M14 66 L2 82 L22 82 Z" fill="#f5cd36" />
      <rect x="10" y="70" width="114" height="10" rx="4" fill="#c84b4b" />
      <circle cx="34" cy="84" r="12" fill="#3e3a52" />
      <circle cx="34" cy="84" r="5" fill="#ffffff" />
      <circle cx="98" cy="84" r="12" fill="#3e3a52" />
      <circle cx="98" cy="84" r="5" fill="#ffffff" />
    </svg>
  );
}
