"use client";

import { useEffect, useState } from "react";
import { ShapeArt } from "@/components/Art";
import { LINES } from "@/curriculum/lines";
import { shapeName } from "@/curriculum/things";
import type { PairCard, ShapePairRound } from "@/lib/rounds";
import { useStep } from "@/lib/steps";
import { sfx } from "@/lib/sfx";
import { starBurst } from "@/lib/stars";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { HandHint } from "../HandHint";
import type { OnDone } from "../types";

/*
 * 도형 맞추기 — 흩어진 모양 카드에서 같은 모양끼리 둘씩 짝짓는다. 크기·색·돌림이 달라도 같은 모양(A5)(업체 판 그대로: 하나를 누르면 나머지가 어두워지고, 짝을 누르면 둘이 반짝 사라진다).
 * 판을 다 비우면 큰 별. 점수는 판마다 — 한 번도 안 틀리고 비운 판 수.
 */

const CARD = "min(17vh, calc(13*var(--vw)))";

export function ShapePair({ rounds, onDone }: { rounds: ShapePairRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  useStep(idx, rounds.length);
  const [gone, setGone] = useState<string[]>([]);
  const [merging, setMerging] = useState<string[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [clean, setClean] = useState(true);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const r = rounds[idx];

  useEffect(() => {
    void say(LINES.shapePair);
    return () => stopVoice();
  }, []);

  const finishRound = (left: number) => {
    if (left > 0) return;
    const s = clean ? score + 1 : score;
    setScore(s);
    starBurst();
    sfx.cheer();
    void say(pick(LINES.praise));
    later(() => {
      if (idx + 1 >= rounds.length) {
        onDone({ correct: s, total: rounds.length });
        return;
      }
      setIdx(idx + 1);
      setGone([]);
      setClean(true);
    }, 1600);
  };

  const tap = (card: PairCard) => {
    if (gone.includes(card.key) || merging.length) return;
    if (!sel || sel === card.key) {
      setSel(sel === card.key ? null : card.key);
      sfx.pop();
      if (sel !== card.key) void say(shapeName(card.shape));
      return;
    }
    const first = r.cards.find((c) => c.key === sel);
    setSel(null);
    if (first && first.shape === card.shape) {
      setMerging([first.key, card.key]);
      sfx.ding();
      void say(shapeName(card.shape));
      later(() => {
        const next = [...gone, first.key, card.key];
        setGone(next);
        setMerging([]);
        finishRound(r.cards.length - next.length);
      }, 650);
      return;
    }
    setClean(false);
    sfx.ddaeng();
    setShake(card.key);
    later(() => setShake(null), 500);
    void say(pick(LINES.retry));
  };

  return (
    <div className="flex min-h-full items-center justify-center-safe px-4 py-4">
      <div key={idx} className="relative w-[min(92vw,56rem)] animate-pop-in rounded-[2rem] bg-mint/80 ring-4 ring-white/70" style={{ height: "min(64vh, 32rem)" }}>
        {/* 짝을 찾으면 판이 어두워지고 그 둘만 밝게 반짝(업체 판처럼) */}
        {merging.length > 0 && <div aria-hidden className="absolute inset-0 z-[5] rounded-[2rem] bg-ink/45" />}
        {r.cards.map((card) => {
          if (gone.includes(card.key)) return null;
          const on = sel === card.key || merging.includes(card.key);
          return (
            <button
              key={card.key}
              type="button"
              aria-label={shapeName(card.shape)}
              data-pair={card.key}
              onClick={() => tap(card)}
              className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[1.6rem] bg-card shadow-[0_7px_0_var(--card-deep),0_14px_26px_-12px_rgb(62_58_82/0.35)] transition-transform active:scale-95 ${on ? "z-10 scale-110 ring-4 ring-butter-deep" : ""} ${merging.includes(card.key) ? "animate-merge-out [animation-delay:0.25s]" : ""} ${shake === card.key ? "animate-shake" : ""}`}
              style={{ left: `${card.x}%`, top: `${card.y}%`, width: CARD, height: CARD }}
            >
              <ShapeArt shape={card.shape} color={card.color} size={`calc(${CARD} * ${(0.78 * card.scale).toFixed(2)})`} rot={card.rot} />
            </button>
          );
        })}
      </div>
      {/* 첫 판 — 한 카드에서 같은 모양 카드로 */}
      <HandHint on={idx === 0 && gone.length === 0 && sel === null} from={`[data-pair="${r.cards[0].key}"]`} to={`[data-pair="${(r.cards.find((c) => c !== r.cards[0] && c.shape === r.cards[0].shape) ?? r.cards[0]).key}"]`} />
    </div>
  );
}
