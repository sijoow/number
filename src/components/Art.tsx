"use client";

import Image from "next/image";
import { useSyncExternalStore, type CSSProperties } from "react";
import { GUIDE_FRIEND, hasTowerForm, layoutOf, type FriendForm } from "@/curriculum/friends";
import { thingOf, type ShapeId } from "@/curriculum/things";
import { imageOf } from "@/lib/assets";

/*
 * 그림 조각 — 힉스필드 그림(넘버블럭스 그림체)이 있으면 그 그림, 없으면 임시 그림.
 * 임시 그림은 일부러 밋밋하게(흰 블록·숫자·이모지) — 캐릭터를 흉내 내 그리지 않는다(refs 인물도로 생성할 때까지 자리만 잡는다).
 */

function Img({ src, alt, width, height, className = "" }: { src: string; alt: string; width: number | string; height: number | string; className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width, height }}>
      <Image src={src} alt={alt} fill sizes="40vw" draggable={false} className="pointer-events-none object-contain" />
    </span>
  );
}

/** 배우는 숫자 — 프리텐다드 굵게, 칸 너비가 같은 숫자 */
export function Numeral({ n, className = "", style }: { n: number | string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`font-letter font-extrabold leading-none tabular-nums ${className}`} style={style}>
      {n}
    </span>
  );
}

/** 세는 물건 — "thing:<id>" 그림, 없으면 이모지 */
export function ThingArt({ id, size, className = "" }: { id: string; size: string; className?: string }) {
  const t = thingOf(id);
  const src = imageOf(`thing:${id}`);
  if (src) return <Img src={src} alt={t.name} width={size} height={size} className={className} />;
  return (
    <span role="img" aria-label={t.name} className={`inline-grid shrink-0 place-items-center leading-none ${className}`} style={{ width: size, height: size, fontSize: `calc(${size} * 0.8)` }}>
      {t.emoji}
    </span>
  );
}

/** 블록 하나 — 세기·쌓기·모으기 교구. tone 은 globals.css 의 색 이름 */
export function Cube({ size, tone = "sky", lit = false, className = "", style }: { size: string; tone?: string; lit?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 rounded-[22%] transition-transform ${lit ? "scale-110" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        background: `var(--${tone})`,
        boxShadow: `inset 0 calc(${size} * -0.12) 0 var(--${tone}-deep), 0 calc(${size} * 0.06) calc(${size} * 0.12) rgb(62 58 82 / 0.18)`,
        ...style,
      }}
    >
      <span className="absolute left-[16%] top-[12%] h-[22%] w-[34%] rounded-full bg-white/55" />
      {lit && <span className="absolute inset-0 rounded-[22%] ring-4 ring-butter-deep" />}
    </span>
  );
}

/** 블록 기둥 — 아래부터 n 개. 5 개를 넘으면 옆 기둥으로(열까지 한 화면에) */
export function CubeStack({ n, size, tone = "sky", lit = -1, perColumn = 5 }: { n: number; size: string; tone?: string; lit?: number; perColumn?: number }) {
  const cols = Math.max(1, Math.ceil(n / perColumn));
  // 틈은 블록 크기에 비례 — 글자 크기(em)로 잡으면 블록이 작을 때 기둥이 넘쳐 위가 잘린다
  return (
    <span className="inline-flex items-end" style={{ gap: `calc(${size} * 0.22)` }} aria-label={`블록 ${n}개`}>
      {Array.from({ length: cols }, (_, c) => {
        const count = Math.min(perColumn, n - c * perColumn);
        return (
          <span key={c} className="flex flex-col-reverse items-center" style={{ gap: `calc(${size} * 0.12)` }}>
            {Array.from({ length: count }, (_, i) => (
              <Cube key={i} size={size} tone={tone} lit={c * perColumn + i <= lit} />
            ))}
          </span>
        );
      })}
    </span>
  );
}

/**
 * 숫자 친구 — 대표 모습 "friend:<n>"(인물구성도), 기둥 모습 "friend:<n>:tower"(인물구성2, 4·6·8·9 만 따로 — 나머지는 대표 모습이 곧 기둥).
 * 그림이 없으면 숫자가 적힌 흰 블록을 같은 배치로(임시). height 는 그림 높이(CSS 길이) — 임시 그림은 블록 수에 맞춰 블록을 줄인다.
 */
export function FriendArt({ n, height, form = "shape", className = "" }: { n: number; height: string; form?: FriendForm; className?: string }) {
  const tower = form === "tower" && hasTowerForm(n);
  const src = imageOf(tower ? `friend:${n}:tower` : `friend:${n}`);
  if (src) return <Img src={src} alt={`숫자 친구 ${n}`} width={height} height={height} className={className} />;
  const { rows } = layoutOf(n, tower ? "tower" : "shape");
  // 블록 rows 개 + 틈(블록의 0.12배) + 숫자 표(1.05배)와 여백이 height 안에 들어가게
  const cube = `calc(${height} / ${(rows * 1.12 + 1.5).toFixed(2)})`;
  return (
    <span className={`inline-flex shrink-0 flex-col items-center justify-end ${className}`} style={{ height, minWidth: `calc(${height} * 0.4)` }} aria-label={`숫자 친구 ${n}`}>
      <span className="mb-[0.15em] grid place-items-center rounded-full bg-white px-[0.5em] font-letter font-extrabold leading-none text-ink shadow" style={{ fontSize: `calc(${cube} * 0.75)`, height: `calc(${cube} * 1.05)` }}>
        {n}
      </span>
      <CubeStack n={n} size={cube} tone="card" perColumn={rows} />
    </span>
  );
}

/** 친구 그림(정사각)에서 친구가 차지하는 너비 — 1~5 는 기둥이라 양옆이 비어 있다(그림 알파로 잰 값 + 여유, 5 는 오른쪽으로 치우침) */
const TIGHT: Record<number, number> = { 1: 0.62, 2: 0.52, 3: 0.46, 4: 0.62, 5: 0.6 };

/** 숫자 친구를 좁게 — 그림 양옆의 빈 곳을 잘라 여럿을 나란히 놓을 때(블록 상자·식 위·보기 카드). 6 이상은 그대로 */
export function FriendTight({ n, height, className = "" }: { n: number; height: string; className?: string }) {
  const w = TIGHT[n] ?? 1;
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`} style={{ width: `calc(${height} * ${w})`, height }}>
      <span className="absolute left-1/2 top-0 -translate-x-1/2">
        <FriendArt n={n} height={height} />
      </span>
    </span>
  );
}

/**
 * 모양 — 동그라미·세모·네모 (크기·색·돌림을 바꿔 그린다).
 * 크기는 style 로 — width="calc(…)" 속성은 브라우저에 따라 무시돼 칸을 꽉 채운다(크기 비교 두 모양이 똑같아 보였다, 2026-10-27)
 */
export function ShapeArt({ shape, color, size, rot = 0 }: { shape: ShapeId; color: string; size: string; rot?: number }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="shrink-0" style={{ width: size, height: size, transform: `rotate(${rot}deg)` }}>
      <g fill={color} stroke="rgb(62 58 82 / 0.25)" strokeWidth="3" strokeLinejoin="round">
        {shape === "circle" && <circle cx="50" cy="50" r="42" />}
        {shape === "triangle" && <path d="M50 8 L93 86 L7 86 Z" />}
        {shape === "square" && <rect x="12" y="12" width="76" height="76" rx="6" />}
      </g>
    </svg>
  );
}

/** 높이가 낮은 화면(폰 가로)이면 안내 친구를 줄인다 — components/ui 의 useCompact 와 같은 기준 */
function useSmall(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(max-height: 520px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-height: 520px)").matches,
    () => false,
  );
}

/**
 * 안내 친구 — 인사하고 놀이를 알려 준다(한글나라의 페파 자리). 그림 "guide"(·"guide:cheer"·"guide:wow"),
 * 없으면 그 숫자 친구 그림, 그것도 없으면 숫자 카드(임시).
 */
export function Guide({ size = 140, mood = "happy", className = "" }: { size?: number; mood?: "happy" | "cheer" | "wow"; className?: string }) {
  const px = useSmall() ? Math.round(size * 0.5) : size;
  const src = imageOf(mood === "happy" ? "guide" : `guide:${mood}`) ?? imageOf("guide") ?? imageOf(`friend:${GUIDE_FRIEND}`);
  if (src) return <Image src={src} alt="" width={px} height={px} draggable={false} className={`pointer-events-none object-contain ${className}`} />;
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-[28%] bg-white shadow-[0_10px_24px_-10px_rgb(62_58_82/0.45)] ${className}`}
      style={{ width: px, height: px }}
    >
      <span className="flex items-end gap-[0.06em] font-letter font-black leading-none" style={{ fontSize: px * 0.34 }}>
        <span style={{ color: "var(--brand)" }}>1</span>
        <span style={{ color: "var(--butter-deep)" }}>2</span>
        <span style={{ color: "var(--sky-deep)" }}>3</span>
      </span>
    </span>
  );
}

/** 모은 블록 하나 — 숫자 옆·보상 화면. 그림 "icon:block" 이 있으면 그 그림 */
export function BlockIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  const src = imageOf("icon:block");
  if (src) return <Image src={src} alt="" width={size} height={size} draggable={false} className={`pointer-events-none object-contain ${className}`} />;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden>
      <path d="M20 4 L35 12 L35 29 L20 37 L5 29 L5 12 Z" fill="#ffd34d" stroke="#e6a41f" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 4 L35 12 L20 20 L5 12 Z" fill="#ffe58f" />
      <path d="M20 20 L35 12 L35 29 L20 37 Z" fill="#f4bb2f" />
    </svg>
  );
}
