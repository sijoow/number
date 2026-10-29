"use client";

import { useEffect, useState } from "react";
import { Numeral } from "@/components/Art";
import { toneAt } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { TallyBoard } from "@/lib/rounds";
import { useStep } from "@/lib/steps";
import { sfx } from "@/lib/sfx";
import { starBurst } from "@/lib/stars";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { HandHint } from "../HandHint";
import { HeldGhost, useDragPick } from "../dragPick";
import type { OnDone } from "../types";

/*
 * 숫자 퍼즐 — 나무판 칸마다 탈리 막대(|, ||, … 다섯째는 비스듬히 긋는다)가 있고, 그 아래 빈 칸에 맞는 숫자 타일을 끌어다 놓는다(업체 판 그대로).
 * 타일은 오른쪽에 셋씩 나온다. 타일을 누른 뒤 칸을 눌러도 된다. 다 채우면 큰 별.
 * 점수 — 한 번도 안 틀리고 놓은 타일 수.
 */

const WOOD = { frame: "#b9773f", cell: "#f3d19b", slot: "#a8693a" } as const;

/** 숫자 색 — 수마다 다른 색(타일·놓인 숫자가 같은 색) */
const inkOf = (n: number) => `var(--${toneAt(n + 1)}-deep)`;

/** 탈리 막대 — 다섯씩 묶음(넷 세로 + 하나 비스듬히). 여섯부터는 아래 줄로 */
function TallyMarks({ n, width }: { n: number; width: string }) {
  const rows = n > 5 ? [5, n - 5] : [n];
  const h = rows.length * 34;
  return (
    <svg viewBox={`0 0 60 ${h}`} style={{ width, height: `calc(${width} * ${h / 60})` }} aria-hidden>
      {rows.map((cnt, row) => {
        const sticks = Math.min(4, cnt);
        const x0 = (60 - (sticks - 1) * 11) / 2;
        return (
          <g key={row} transform={`translate(0 ${row * 34})`} stroke="#5b3a22" strokeWidth="4.5" strokeLinecap="round">
            {Array.from({ length: sticks }, (_, i) => (
              <line key={i} x1={x0 + i * 11} y1="5" x2={x0 + i * 11} y2="29" />
            ))}
            {cnt === 5 && <line x1={x0 - 6} y1="25" x2={x0 + 39} y2="9" />}
          </g>
        );
      })}
    </svg>
  );
}

export function Tally({ board, onDone }: { board: TallyBoard; onDone: OnDone }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [missed, setMissed] = useState<number[]>([]);
  const [bump, setBump] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const later = useTimers();
  const total = board.nums.length;
  useStep(placed.length, total);
  const shown = board.queue.filter((n) => !placed.includes(n)).slice(0, 3);
  const cols = Math.min(5, total);
  // 칸 크기 — 한 줄(다섯까지)이면 크게, 두 줄이면 화면 높이에 맞춰. 폰 가로(높이 384px)에서도 손가락으로 넣을 만하게
  const cell = `min(${total > 5 ? 16 : 24}vh, calc(${cols > 4 ? 11 : 14}*var(--vw)))`;

  useEffect(() => {
    void say(LINES.tally);
    return () => stopVoice();
  }, []);

  const place = (tile: number, slot: number) => {
    if (placed.includes(slot)) return;
    setSel(null);
    if (tile === slot) {
      const next = [...placed, tile];
      setPlaced(next);
      sfx.ding();
      if (next.length < total) {
        void say(nameOf(tile));
        return;
      }
      starBurst();
      sfx.cheer();
      void say([nameOf(tile), pick(LINES.praise)]);
      later(() => onDone({ correct: total - missed.length, total }), 2200);
      return;
    }
    sfx.ddaeng();
    if (!missed.includes(tile)) setMissed([...missed, tile]);
    setBump(slot);
    later(() => setBump(null), 450);
    void say([nameOf(tile), pick(LINES.retry)]);
  };

  const { held, begin } = useDragPick<number>((tile, zone, tapped) => {
    if (tapped) {
      sfx.tick();
      setSel(sel === tile ? null : tile);
      void say(nameOf(tile));
      return;
    }
    const m = /^slot:(\d+)$/.exec(zone ?? "");
    if (m) place(tile, Number(m[1]));
  });

  const tile = (n: number, size: string) => (
    <span className="grid place-items-center rounded-[22%] bg-[#fff3dc] shadow-[0_6px_0_#d9b98a]" style={{ width: size, height: size }}>
      <Numeral n={n} style={{ fontSize: `calc(${size} * 0.62)`, color: inkOf(n) }} />
    </span>
  );

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-[4vw] px-4 py-4 portrait:flex-col portrait:gap-5">
      <div className="grid gap-[1.2vh] rounded-[1.6rem] p-[1.6vh] shadow-[0_12px_30px_-14px_rgb(62_58_82/0.5)]" style={{ background: WOOD.frame, gridTemplateColumns: `repeat(${cols}, auto)` }}>
        {board.nums.map((n) => {
          const done = placed.includes(n);
          const over = held?.over === `slot:${n}`;
          return (
            <div key={n} className="flex flex-col items-center gap-[0.8vh] rounded-[1rem] p-[0.8vh]" style={{ background: WOOD.cell, width: cell }}>
              <span className="grid place-items-center" style={{ height: `calc(${cell} * 0.75)` }}>
                <TallyMarks n={n} width={`calc(${cell} * 0.62)`} />
              </span>
              <button
                type="button"
                data-drop={`slot:${n}`}
                aria-label={`${n} 칸`}
                onClick={() => sel !== null && place(sel, n)}
                className={`grid aspect-square w-full place-items-center rounded-[0.9rem] transition-transform ${bump === n ? "animate-shake" : ""} ${over || (sel !== null && !done) ? "ring-4 ring-butter" : ""}`}
                style={{ background: done ? "#fff3dc" : WOOD.slot }}
              >
                {done && <Numeral n={n} className="animate-pop-in" style={{ fontSize: `calc(${cell} * 0.6)`, color: inkOf(n) }} />}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-[2vh] portrait:flex-row">
        {shown.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={nameOf(n)}
            onPointerDown={begin(n)}
            style={{ touchAction: "none" }}
            className={`animate-pop-in transition-transform ${held?.moved && held.item === n ? "opacity-30" : ""} ${sel === n ? "scale-110 rounded-[22%] ring-4 ring-brand" : ""}`}
          >
            {tile(n, `calc(${cell} * 0.95)`)}
          </button>
        ))}
      </div>
      <HeldGhost held={held}>{(n) => tile(n, `calc(${cell} * 0.95)`)}</HeldGhost>
      {shown.length > 0 && <HandHint on={placed.length === 0} from={`[aria-label="${nameOf(shown[0])}"]`} to={`[data-drop="slot:${shown[0]}"]`} />}
    </div>
  );
}
