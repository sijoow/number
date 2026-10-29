"use client";

import { Fragment, useMemo } from "react";
import { ShapeArt } from "@/components/Art";
import { ChoiceCard, useChoice } from "@/components/play/choice";
import { HandHint } from "@/components/play/HandHint";
import { HeldGhost, useDragPick } from "@/components/play/dragPick";
import type { OnDone } from "@/components/play/types";
import { LINES } from "@/curriculum/lines";
import { colorName, shapeName, type ShapeId } from "@/curriculum/things";
import type { MatrixPiece, MatrixRound } from "@/lib/thinks";

/**
 * 빈칸 채우기 — 가로줄마다 모양이, 세로줄마다 색이 같은 판(업체 「매트릭스」 흐름을 우리 그림으로, 2026-10-29 사용자).
 * 줄 머리에 모양(회색)·색(동그라미)이 있어서 따라가 볼 수 있다. 보기 셋 — 정답 · 모양만 맞는 것 · 색만 맞는 것 — 을 빈칸에 끌어다 놓는다(눌러도 된다).
 */

const keyOf = (p: MatrixPiece) => `${p.shape}|${p.color}`;
const HEAD = "#cfcadb";

export function Matrix({ rounds, onDone }: { rounds: MatrixRound[]; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map(() => []), [rounds]);
  const answers = useMemo(
    () =>
      rounds.map((r) => {
        const n = r.shapes.length;
        return keyOf({ shape: r.shapes[Math.floor(r.blank / n)], color: r.colors[r.blank % n] });
      }),
    [rounds],
  );
  const c = useChoice({ intro: LINES.matrix, prompts, answers, assess: false, nameOf: (k) => [shapeName(k.split("|")[0] as ShapeId)], onDone });
  const { held, begin } = useDragPick<string>((k, zone, tapped) => {
    if (tapped || zone === "blank") c.choose(k);
  });
  const r = rounds[c.idx];
  const n = r.shapes.length;
  const cell = `min(${n > 2 ? 15 : 20}vh, calc(${n > 2 ? 10 : 13}*var(--vw)))`;
  const head = `calc(${cell} * 0.62)`;
  const piece = (p: MatrixPiece, size: string) => <ShapeArt shape={p.shape} color={p.color} size={size} />;

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-[5vw] px-4 py-4 portrait:flex-col portrait:gap-[4vh]">
      <div key={c.idx} className="grid animate-pop-in items-center gap-[1.2vh] rounded-[1.8rem] bg-white/75 p-[2vh] ring-1 ring-white" style={{ gridTemplateColumns: `${head} repeat(${n}, ${cell})` }}>
        <span />
        {r.colors.map((color) => (
          <span key={color} className="grid place-items-center">
            <span className="block rounded-full shadow-[inset_0_-0.25rem_0_rgb(0_0_0/0.12)]" style={{ width: `calc(${head} * 0.7)`, height: `calc(${head} * 0.7)`, background: color }} />
          </span>
        ))}
        {r.shapes.map((shape, row) => (
          <Fragment key={shape}>
            <span className="grid place-items-center">
              <ShapeArt shape={shape} color={HEAD} size={`calc(${head} * 0.8)`} />
            </span>
            {r.colors.map((color, col) => {
              const k = row * n + col;
              if (k !== r.blank) {
                return (
                  <span key={k} className="grid place-items-center rounded-[1rem] bg-paper" style={{ width: cell, height: cell }}>
                    {piece({ shape, color }, `calc(${cell} * 0.74)`)}
                  </span>
                );
              }
              const over = held?.moved && held.over === "blank";
              return (
                <span
                  key={k}
                  data-drop="blank"
                  className={`grid place-items-center rounded-[1rem] border-4 border-dashed ${c.settled ? "border-transparent bg-mint/60" : "border-brand/50 bg-white"} ${over ? "ring-8 ring-butter" : ""}`}
                  style={{ width: cell, height: cell }}
                >
                  {c.settled ? <span className="animate-pop-in">{piece({ shape, color }, `calc(${cell} * 0.74)`)}</span> : <span className="font-letter text-[2.4em] font-extrabold text-brand">?</span>}
                </span>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="flex items-center gap-[2.5vw] landscape:flex-col landscape:gap-[2.5vh]">
        {r.choices.map((p) => {
          const k = keyOf(p);
          return (
            <ChoiceCard key={`${c.idx}-${k}`} c={c} k={k} label={`${colorName(p.color)} ${shapeName(p.shape)}`} drag={c.settled ? undefined : begin(k)} className={held?.moved && held.item === k ? "opacity-30" : ""} style={{ width: cell, height: cell }}>
              {piece(p, `calc(${cell} * 0.72)`)}
            </ChoiceCard>
          );
        })}
      </div>
      <HeldGhost held={held}>{(k) => piece({ shape: k.split("|")[0] as ShapeId, color: k.split("|")[1] }, `calc(${cell} * 0.8)`)}</HeldGhost>
      <HandHint on={c.idx === 0 && !c.settled} from={`[aria-label="${colorName(r.choices[0].color)} ${shapeName(r.choices[0].shape)}"]`} to={`[data-drop="blank"]`} />
    </div>
  );
}
