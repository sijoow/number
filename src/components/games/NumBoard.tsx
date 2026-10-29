"use client";

import { useEffect, useMemo, useState } from "react";
import { Numeral } from "@/components/Art";
import { toneAt } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { nameOf, range } from "@/curriculum/numbers";
import type { BoardRound } from "@/lib/originals";
import { seededRng, shuffle } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { starBurst } from "@/lib/stars";
import { useStep } from "@/lib/steps";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { HandHint } from "../play/HandHint";
import { HeldGhost, useDragPick } from "../play/dragPick";
import type { OnDone } from "../play/types";

/**
 * 숫자 판 — 1~10(열하나 넘게 알면 1~20)이 다섯씩 줄지어 있고 빈칸 셋. 옆의 숫자 타일을 빈칸에 끌어다 놓는다(누른 뒤 칸을 눌러도 된다)
 * (업체 「백 칸 퀴즈」를 4살 크기로 줄여 우리 그림으로, 2026-10-29 사용자). 틀린 칸이면 흔들리고 타일은 제자리로. 두 판.
 */

const COLS = 5;
const inkOf = (n: number) => `var(--${toneAt(n + 1)}-deep)`;

export function NumBoard({ rounds, onDone }: { rounds: BoardRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [bump, setBump] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const later = useTimers();
  useStep(idx, rounds.length);
  const r = rounds[idx];
  const rows = r.size / COLS;
  const cell = `min(${rows > 2 ? 12.5 : 19}vh, calc(${rows > 2 ? 8 : 10.5}*var(--vw)))`;
  // 타일은 섞어서 — 빈칸 차례대로 놓이면 보기만 해도 맞힌다
  const tiles = useMemo(() => shuffle(r.blanks, seededRng(idx * 7 + r.blanks[0])), [r, idx]);
  const left = tiles.filter((b) => !placed.includes(b));

  useEffect(() => {
    if (idx === 0) void say(LINES.numBoard);
    return () => stopVoice();
  }, [idx]);

  const place = (tile: number, slot: number) => {
    if (placed.includes(slot) || !r.blanks.includes(slot)) return;
    setSel(null);
    if (tile !== slot) {
      sfx.ddaeng();
      setMisses((m) => m + 1);
      setBump(slot);
      later(() => setBump(null), 450);
      void say([nameOf(tile), pick(LINES.retry)]);
      return;
    }
    const now = [...placed, tile];
    setPlaced(now);
    sfx.ding();
    if (now.length < r.blanks.length) {
      void say(nameOf(tile));
      return;
    }
    starBurst();
    sfx.cheer();
    void say([nameOf(tile), pick(LINES.praise)]);
    later(() => {
      if (idx + 1 >= rounds.length) {
        onDone({ correct: Math.max(0, rounds.length * 3 - misses), total: rounds.length * 3 });
        return;
      }
      setIdx(idx + 1);
      setPlaced([]);
    }, 2000);
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
    <span className="grid place-items-center rounded-[22%] bg-white shadow-[0_6px_0_rgb(62_58_82/0.18)]" style={{ width: size, height: size }}>
      <Numeral n={n} style={{ fontSize: `calc(${size} * 0.55)`, color: inkOf(n) }} />
    </span>
  );

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-[4vw] px-4 py-4 portrait:flex-col portrait:gap-5">
      <div key={idx} className="grid animate-pop-in gap-[1vh] rounded-[1.6rem] bg-sky/90 p-[1.6vh] ring-4 ring-white/80" style={{ gridTemplateColumns: `repeat(${COLS}, ${cell})` }}>
        {range(1, r.size).map((n) => {
          const blank = r.blanks.includes(n);
          const done = placed.includes(n);
          const over = held?.moved && held.over === `slot:${n}`;
          if (!blank) {
            return (
              <span key={n} className="grid place-items-center rounded-[0.9rem] bg-white/90" style={{ width: cell, height: cell }}>
                <Numeral n={n} className="text-ink" style={{ fontSize: `calc(${cell} * 0.5)` }} />
              </span>
            );
          }
          return (
            <button
              key={n}
              type="button"
              data-drop={`slot:${n}`}
              aria-label={`빈칸 ${n}`}
              onClick={() => sel !== null && place(sel, n)}
              className={`grid place-items-center rounded-[0.9rem] border-[3px] border-dashed transition-transform ${done ? "border-transparent bg-white" : "border-white bg-white/35"} ${bump === n ? "animate-shake" : ""} ${over || (sel !== null && !done) ? "ring-4 ring-butter" : ""}`}
              style={{ width: cell, height: cell }}
            >
              {done ? <Numeral n={n} className="animate-pop-in" style={{ fontSize: `calc(${cell} * 0.55)`, color: inkOf(n) }} /> : <span className="font-letter text-[1.6em] font-extrabold text-white">?</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-[2vh] portrait:flex-row">
        {left.map((n) => (
          <button
            key={`${idx}-${n}`}
            type="button"
            aria-label={nameOf(n)}
            onPointerDown={begin(n)}
            style={{ touchAction: "none" }}
            className={`animate-pop-in transition-transform ${held?.moved && held.item === n ? "opacity-30" : ""} ${sel === n ? "scale-110 rounded-[22%] ring-4 ring-brand" : ""}`}
          >
            {tile(n, `calc(${cell} * 1.05)`)}
          </button>
        ))}
      </div>
      <HeldGhost held={held}>{(n) => tile(n, `calc(${cell} * 1.05)`)}</HeldGhost>
      {left.length > 0 && <HandHint on={idx === 0 && placed.length === 0 && misses === 0} from={`[aria-label="${nameOf(left[0])}"]`} to={`[data-drop="slot:${left[0]}"]`} />}
    </div>
  );
}
