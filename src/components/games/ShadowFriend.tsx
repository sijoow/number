"use client";

import Image from "next/image";
import { useMemo } from "react";
import { FriendArt } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { toneStyle } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { sinoOf } from "@/curriculum/numbers";
import { imageOf } from "@/lib/assets";
import type { ShadowRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { say } from "@/lib/voice";
import { useChoice } from "../play/choice";
import type { OnDone } from "../play/types";
import { DragGhost, useDragDrop } from "./drag";

/**
 * 그림자 친구 — 까만 실루엣(scripts/image-shadows.mts, 머리 위 숫자는 지움)은 가만히 있고, 옆의 친구를 끌어다 그림자 위에 놓는다
 * (2026-10-27 사용자: 고르기 말고 끌어 놓기 → 그림자가 아니라 친구를 끌어서 그림자 자리에). 4는 네모, 6은 두 줄 세 칸 — 모양으로 수를 알아본다.
 * 맞으면 그림자가 그 친구로 바뀌고, 틀리면 그 친구는 흔들리며 제자리로.
 */
export function ShadowFriend({ rounds, onDone }: { rounds: ShadowRound[]; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map(() => [LINES.shadow]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.n)), [rounds]);
  const c = useChoice({ intro: LINES.shadowDrag, prompts, answers, assess: false, nameOf: (k) => [sinoOf(Number(k))], onDone });
  const { drag, begin } = useDragDrop<number>((n, zone) => {
    if (zone === "shadow") c.choose(String(n));
  });
  const r = rounds[c.idx];
  const shadow = imageOf(`shadow:${r.n}`);
  const big = "min(40vh, calc(36*var(--vw)))";
  const cardSize = "min(23vh, calc(18*var(--vw)))";
  const over = drag?.over === "shadow";

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-6 py-4 landscape:flex-row landscape:gap-[4vw] portrait:px-3">
      <div className="flex flex-col items-center gap-3">
        <p className="glass rounded-full px-6 py-2 text-2xl font-extrabold">
          <ReadAlong text={LINES.shadow} />
        </p>
        {/* 그림자 자리 — 친구를 여기 놓는다 */}
        <div
          key={c.idx}
          data-drop="shadow"
          className={`relative grid animate-pop-in place-items-center rounded-[2rem] bg-white/75 ring-1 ring-white transition-transform ${over ? "scale-105 ring-8 ring-brand/40" : ""}`}
          style={{ width: big, height: big }}
        >
          {c.settled ? (
            <FriendArt n={r.n} height={`calc(${big} * 0.86)`} className="animate-pop-in" />
          ) : shadow ? (
            <span className="pointer-events-none relative block" style={{ width: `calc(${big} * 0.86)`, height: `calc(${big} * 0.86)` }}>
              <Image src={shadow} alt="누구 그림자일까?" fill sizes="40vw" draggable={false} className="object-contain" />
            </span>
          ) : null}
        </div>
      </div>

      {/* 끌어 갈 친구들 */}
      <div className="flex flex-wrap items-center justify-center gap-4 landscape:flex-col portrait:gap-3">
        {r.choices.map((n) => {
          const k = String(n);
          const cs = c.stateOf(k);
          const wrong = c.wasWrong(k);
          const lifted = drag?.item === n;
          return (
            <button
              key={`${c.idx}-${n}`}
              type="button"
              aria-label={sinoOf(n)}
              onPointerDown={c.settled ? undefined : begin(n)}
              onClick={() => {
                if (c.settled) return;
                sfx.wake();
                void say(LINES.shadowDrag);
              }}
              style={{ ...toneStyle(cs === "right" ? "mint" : cs === "wrong" ? "peach" : "card"), width: cardSize, height: cardSize, touchAction: "none" }}
              className={`squish relative grid cursor-grab place-items-center rounded-[2.2rem] ${cs === "wrong" ? "animate-shake" : ""} ${cs === "right" ? "animate-wiggle" : ""} ${c.hintOn(k) ? "animate-breathe ring-8 ring-butter" : ""} ${lifted ? "opacity-30" : ""}`}
            >
              <span className={`pointer-events-none grid place-items-center ${wrong ? "opacity-45 grayscale" : ""}`}>
                <FriendArt n={n} height={`calc(${cardSize} * 0.82)`} />
              </span>
              {cs === "right" && <span className="absolute -right-3 -top-3 grid h-12 w-12 place-items-center rounded-full bg-mint-deep text-3xl text-white">✓</span>}
              {wrong && <span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-full bg-peach-deep text-2xl text-white shadow">✕</span>}
            </button>
          );
        })}
      </div>

      <DragGhost drag={drag}>{(n) => <FriendArt n={n} height={`calc(${cardSize} * 0.9)`} />}</DragGhost>
    </div>
  );
}
