"use client";

import type { CSSProperties } from "react";
import { ThingArt } from "@/components/Art";
import type { Spot } from "@/lib/rounds";

/** 물건 크기 — 많을수록 작게(열 개도 한 판에) */
export function thingSize(n: number, scale = 1): string {
  const [vh, vw] = n <= 3 ? [14, 14] : n <= 6 ? [11, 11] : [8, 8.5];
  return `min(${vh * scale}vh, calc(${vw * scale}*var(--vw)))`;
}

/**
 * 물건 판 — 자리(%)마다 물건 하나. onTap 을 주면 누를 수 있고, 누른 차례(tapped)대로 번호 딱지가 붙는다(하나씩 세기).
 */
export function ThingField({
  thing,
  spots,
  size,
  tapped,
  onTap,
  style,
  className = "",
}: {
  thing: string;
  spots: readonly Spot[];
  size: string;
  tapped?: readonly number[];
  onTap?: (i: number) => void;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={`relative rounded-[2rem] bg-white/75 ring-1 ring-white ${className}`} style={{ width: "min(92vw, 46rem)", height: "min(36vh, 24rem)", ...style }}>
      {spots.map((s, i) => {
        const order = tapped?.indexOf(i) ?? -1;
        const place: CSSProperties = { left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) rotate(${s.tilt}deg)` };
        const art = (
          <>
            <ThingArt id={thing} size={size} className={order >= 0 ? "opacity-60" : ""} />
            {order >= 0 && (
              <span className="absolute -right-1 -top-1 grid h-9 w-9 animate-pop-in place-items-center rounded-full bg-brand font-letter text-xl font-extrabold text-white shadow short:h-7 short:w-7 short:text-base">
                {order + 1}
              </span>
            )}
          </>
        );
        return onTap ? (
          <button key={i} type="button" aria-label={`${i + 1}번째`} className="absolute transition-transform active:scale-90" style={place} onClick={() => onTap(i)}>
            {art}
          </button>
        ) : (
          <span key={i} className="absolute" style={place}>
            {art}
          </span>
        );
      })}
    </div>
  );
}
