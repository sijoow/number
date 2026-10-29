"use client";

import Image from "next/image";
import { BlockIcon } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { HandHint } from "@/components/play/HandHint";
import { KIND_ICON, KIND_LABEL } from "@/components/play/kindIcon";
import { UiIcon } from "@/components/ui";
import { CHILD } from "@/curriculum/child";
import type { ActivityKind } from "@/curriculum/types";
import { imageOf } from "@/lib/assets";

/*
 * 오늘의 길 — 그날 놀이가 길 위의 칸(2026-10-29 사용자: 업체처럼 하루 미션을 칸으로 하나씩 깬다 — 홈 카드의 5일 계단 대신).
 * 깬 칸은 ✓(다시 열리지 않는다), 지금 칸만 반짝이고 하온이 얼굴이 서 있다(손가락 시범도), 앞 칸은 잠김. 끝 칸은 하루 끝(도장 날은 도장).
 * 가로 화면은 왼쪽→오른쪽 물결, 세로 화면은 위→아래 지그재그. 그림·모양은 우리 것(업체 화면을 옮기지 않는다).
 * MiniPath 는 같은 길을 작게 — 첫 화면 카드에.
 */

type Spot = "done" | "now" | "locked";

const spotOf = (i: number, done: number): Spot => (i < done ? "done" : i === done ? "now" : "locked");

/** 하온이 얼굴 — 지금 칸 위 */
function Face({ size }: { size: string }) {
  const face = imageOf("child:face");
  return (
    <span className="relative grid animate-float place-items-center overflow-hidden rounded-full bg-brand font-extrabold text-white ring-[3px] ring-white" style={{ width: size, height: size }}>
      {face ? <Image src={face} alt={CHILD.nick} fill sizes="56px" className="object-cover" /> : [...CHILD.full][1]}
    </span>
  );
}

/** 끝 칸 — 하루 끝 상(블록), 도장 날은 별 도장 */
function Goal({ stamp, size }: { stamp: boolean; size: string }) {
  return (
    <span className="grid place-items-center rounded-full bg-butter shadow-[0_6px_0_var(--butter-deep)] ring-4 ring-white" style={{ width: size, height: size }}>
      {stamp ? (
        <span className="text-[calc(var(--s)*0.5)] font-extrabold text-brand-deep" style={{ ["--s" as string]: size }}>
          ★
        </span>
      ) : (
        <BlockIcon size={40} />
      )}
    </span>
  );
}

/** 칸 자리(%) — 가로는 물결, 세로는 지그재그 */
function placeOf(i: number, n: number, portrait: boolean): { x: number; y: number } {
  const t = n > 1 ? i / (n - 1) : 0.5;
  const wave = i % 2 === 0 ? -1 : 1;
  return portrait ? { x: 50 + wave * 22, y: 7 + t * 86 } : { x: 7 + t * 86, y: 50 + wave * 17 };
}

export function DayPath({
  kinds,
  done,
  stamp,
  portrait,
  locked,
  onPick,
}: {
  kinds: readonly ActivityKind[];
  done: number;
  stamp: boolean;
  portrait: boolean;
  /** 오늘은 더 못 한다(하루 한 번을 켠 날) — 칸은 보이되 반짝이지 않는다 */
  locked: boolean;
  onPick: (i: number) => void;
}) {
  const n = kinds.length + 1;
  const pts = Array.from({ length: n }, (_, i) => placeOf(i, n, portrait));
  const size = portrait ? "min(10.5vh, 5.6rem)" : "min(15vh, 6.4rem)";
  return (
    <div className="relative h-full w-full">
      {/* 길 — 흙길 위에 하얀 점선 */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#e9c98f" strokeOpacity="0.85" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="6" strokeDasharray="2 16" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {kinds.map((kind, i) => {
        const s = locked && i >= done ? "locked" : spotOf(i, done);
        const p = pts[i];
        return (
          <div key={i} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            {s === "now" && (
              <span className="absolute bottom-full mb-1">
                <Face size={portrait ? "2.4rem" : "2.8rem"} />
              </span>
            )}
            <button
              type="button"
              data-path-now={s === "now" ? "" : undefined}
              aria-label={`${i + 1}번째 칸 ${KIND_LABEL[kind]}`}
              onClick={() => onPick(i)}
              className={`relative grid place-items-center rounded-full transition-transform active:scale-95 ${
                s === "now"
                  ? "animate-breathe bg-white shadow-[0_7px_0_var(--brand-deep)] ring-[6px] ring-brand"
                  : s === "done"
                    ? "bg-mint shadow-[0_6px_0_var(--mint-deep)] ring-4 ring-white"
                    : "bg-paper-deep shadow-[0_6px_0_rgb(62_58_82/0.18)] ring-4 ring-white/80"
              }`}
              style={{ width: size, height: size, fontSize: `calc(${size} * 0.55)` }}
            >
              <span className={s === "locked" ? "opacity-40 grayscale" : s === "done" ? "opacity-80" : ""}>
                <Icon id={`play:${kind}`} emoji={KIND_ICON[kind]} />
              </span>
              {s === "done" && (
                <span className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-mint-deep text-base text-white ring-2 ring-white">
                  <UiIcon name="check" />
                </span>
              )}
              <span className="absolute -bottom-1 -left-1 grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-extrabold text-ink shadow">{i + 1}</span>
            </button>
            <span className={`mt-2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-extrabold ${s === "now" ? "bg-brand text-white" : "bg-white/85 text-ink"}`}>{KIND_LABEL[kind]}</span>
          </div>
        );
      })}
      {/* 끝 칸 */}
      <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${pts[n - 1].x}%`, top: `${pts[n - 1].y}%` }}>
        <Goal stamp={stamp} size={size} />
        <span className="mt-2 whitespace-nowrap rounded-full bg-white/85 px-2.5 py-0.5 text-sm font-extrabold">{stamp ? "도장 받기" : "하루 끝"}</span>
      </div>
      {!locked && done < kinds.length && <HandHint from="[data-path-now]" to="[data-path-now]" delay={2400} />}
    </div>
  );
}

/** 첫 화면 카드의 작은 길 — 오늘 놀이 칸(깬 칸 ✓, 지금 칸 빨간 테두리)과 끝 칸 */
export function MiniPath({ kinds, done, stamp }: { kinds: readonly ActivityKind[]; done: number; stamp: boolean }) {
  return (
    <span className="flex w-full items-center justify-between gap-1">
      {kinds.map((kind, i) => {
        const s = spotOf(i, done);
        return (
          <span key={i} className="contents">
            <span
              className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-[1.7rem] short:h-10 short:w-10 short:text-[1.4rem] ${
                s === "now" ? "animate-breathe bg-white ring-4 ring-brand" : s === "done" ? "bg-mint" : "bg-paper-deep/80"
              }`}
            >
              <span className={s === "locked" ? "opacity-40 grayscale" : ""}>
                <Icon id={`play:${kind}`} emoji={KIND_ICON[kind]} />
              </span>
              {s === "done" && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-mint-deep text-[0.6rem] text-white">
                  <UiIcon name="check" />
                </span>
              )}
            </span>
            <span aria-hidden className="h-1 min-w-1 flex-1 rounded-full bg-[repeating-linear-gradient(90deg,var(--paper-deep)_0_6px,transparent_6px_10px)]" />
          </span>
        );
      })}
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-butter short:h-10 short:w-10">{stamp ? <span className="text-2xl font-extrabold text-brand-deep">★</span> : <BlockIcon size={28} />}</span>
    </span>
  );
}
