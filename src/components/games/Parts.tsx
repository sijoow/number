"use client";

import { useEffect, useState } from "react";
import { FriendArt, FriendTight, Numeral } from "@/components/Art";
import { toneStyle } from "@/components/ui";
import { blockColor } from "@/curriculum/friends";
import { LINES, makeAsk, meetHello } from "@/curriculum/lines";
import { range, sinoOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { PartsRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useStep } from "@/lib/steps";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";
import { HandHint } from "../play/HandHint";
import { HeldGhost, useDragPick } from "../play/dragPick";
import type { OnDone } from "../play/types";
import { ColorCube } from "./pieces";

/**
 * 몇이랑 몇? — 위에 수가 적힌 상자에 친구 하나가 들어 있고, 옆에 빈 블록 자리(점선)가 남아 있다(업체 「탈리 연구실」 흐름을 우리 그림으로, 2026-10-29 사용자).
 * 빈 자리만큼의 친구를 보기 셋에서 끌어다 넣으면(눌러도 된다) 블록이 채워지고 두 친구가 상자 수의 친구로 변신.
 * 틀리면 넣은 친구 블록이 넘치거나(너무 많아!) 모자라서(모자라!) 보이고, 그 친구는 흐려진 채 다시.
 */

/** 상자 안 블록 한 칸 — 세로 폰에서도 셀 수 있게(세로는 --vw 가 커서 vw 쪽이 커진다) */
const CUBE = "min(6.4vh, calc(6.5*var(--vw)))";

/** 블록 자리 — 다섯씩 한 줄, 아래 줄부터(큰 수는 옆 기둥으로). kinds 는 아래부터 칸마다 "empty" | "fill" | "over" */
function Slots({ kinds, color }: { kinds: ("empty" | "fill" | "over")[]; color: number }) {
  const cols = Math.max(1, Math.ceil(kinds.length / 5));
  return (
    <span className="flex items-end" style={{ gap: `calc(${CUBE} * 0.2)` }}>
      {range(0, cols - 1).map((col) => (
        <span key={col} className="flex flex-col-reverse items-center" style={{ gap: `calc(${CUBE} * 0.12)` }}>
          {kinds.slice(col * 5, col * 5 + 5).map((k, i) =>
            k === "empty" ? (
              <span key={i} className="block rounded-[18%] border-[3px] border-dashed border-ink/30 bg-white/60" style={{ width: CUBE, height: CUBE }} />
            ) : (
              <ColorCube key={i} size={CUBE} {...blockColor(color, col * 5 + i)} className={k === "over" ? "animate-shake opacity-70 outline outline-[3px] outline-offset-2 outline-[#e04a3a]" : "animate-drop-in"} />
            ),
          )}
        </span>
      ))}
    </span>
  );
}

export function Parts({ rounds, onDone }: { rounds: PartsRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [tried, setTried] = useState<number[]>([]);
  /** 상자에 넣어 본 친구 — 틀리면 잠깐 보였다가 빠진다 */
  const [put, setPut] = useState<number | null>(null);
  const [stage, setStage] = useState<"ask" | "right" | "morph">("ask");
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  useStep(idx, rounds.length);
  const r = rounds[idx];
  const need = r.whole - r.have;
  const card = "min(20vh, calc(15*var(--vw)))";

  useEffect(() => {
    void say(idx === 0 ? [LINES.parts, makeAsk(rounds[0].whole), LINES.partsQ] : [makeAsk(rounds[idx].whole), LINES.partsQ]);
    return () => stopVoice();
  }, [idx, rounds]);

  const choose = (n: number) => {
    if (stage !== "ask" || tried.includes(n)) return;
    const alive = turn();
    setPut(n);
    sfx.pop();
    if (n === need) {
      const s = tried.length === 0 ? score + 1 : score;
      setScore(s);
      setStage("right");
      void answerFeedback({ name: [sinoOf(n)], right: true, then: [], alive }).then((ok) => {
        if (!ok) return;
        // 두 친구가 모여 상자 수의 친구로 변신
        setStage("morph");
        sfx.cheer();
        void say([LINES.transform, meetHello(r.whole)]).then(() => {
          if (!alive()) return;
          later(() => {
            if (idx + 1 >= rounds.length) {
              onDone({ correct: s, total: rounds.length });
              return;
            }
            setIdx(idx + 1);
            setTried([]);
            setPut(null);
            setStage("ask");
          }, 700);
        });
      });
      return;
    }
    setTried([...tried, n]);
    void answerFeedback({ name: [sinoOf(n)], right: false, then: [n > need ? LINES.tooMany : LINES.tooFew], alive });
    later(() => setPut((p) => (p === n ? null : p)), 1500);
  };

  const { held, begin } = useDragPick<number>((n, zone, tapped) => {
    if (tapped || zone === "box") choose(n);
  });

  // 빈 자리 — 넣은 친구 블록으로 채워 보이고, 넘치면 넘친 칸을 위에 빨갛게
  const shown = put ?? 0;
  const kinds = range(1, Math.max(need, shown)).map((i) => (i <= Math.min(shown, need) ? "fill" : i <= need ? "empty" : "over")) as ("empty" | "fill" | "over")[];
  const over = held?.moved && held.over === "box";

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-[5vw] px-4 py-4 portrait:flex-col portrait:gap-[4vh]">
      {/* 상자 — 위에 만들 수, 안에 친구 + 빈 블록 자리 */}
      <div key={idx} className="flex animate-pop-in flex-col items-center">
        <span className="z-10 -mb-[2.2vh] grid place-items-center rounded-full bg-sky-deep px-[1.6em] py-[0.15em] text-white shadow-[0_6px_0_rgb(0_0_0/0.15)]" style={{ fontSize: "min(8vh, calc(5.5*var(--vw)))" }}>
          <Numeral n={r.whole} />
        </span>
        <div
          data-drop="box"
          className={`flex items-end justify-center gap-[2vw] rounded-[2rem] bg-white/80 px-[3vw] pb-[3vh] pt-[5vh] ring-4 transition-transform ${over ? "scale-105 ring-brand/50" : "ring-white"}`}
          style={{ minWidth: "min(46vh, calc(34*var(--vw)))", minHeight: "min(44vh, calc(30*var(--vw)))" }}
        >
          {stage === "morph" ? (
            <FriendArt n={r.whole} height="min(36vh, calc(26*var(--vw)))" className="animate-pop-in" />
          ) : (
            <>
              <FriendTight n={r.have} height="min(32vh, calc(22*var(--vw)))" />
              <Slots kinds={kinds} color={shown || r.have} />
            </>
          )}
        </div>
      </div>

      {/* 넣을 친구 보기 셋 */}
      <div className="flex items-center gap-[2.5vw] landscape:flex-col landscape:gap-[2.5vh]">
        {r.choices.map((n) => {
          const wrong = tried.includes(n);
          const right = n === need && stage !== "ask";
          const lifted = held?.moved && held.item === n;
          return (
            <button
              key={`${idx}-${n}`}
              type="button"
              aria-label={sinoOf(n)}
              onPointerDown={stage === "ask" && !wrong ? begin(n) : undefined}
              style={{ ...toneStyle(right ? "mint" : wrong ? "peach" : "card"), width: card, height: card, touchAction: "none" }}
              className={`squish relative grid place-items-center rounded-[2rem] ${put === n && wrong ? "animate-shake" : ""} ${!wrong && tried.length > 0 && n === need && stage === "ask" ? "animate-breathe ring-8 ring-butter" : ""} ${lifted ? "opacity-30" : ""}`}
            >
              <span className={`pointer-events-none ${wrong ? "opacity-45 grayscale" : ""}`}>
                <FriendTight n={n} height={`calc(${card} * 0.82)`} />
              </span>
              {wrong && <span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-full bg-peach-deep text-2xl text-white shadow">✕</span>}
              {right && <span className="absolute -right-3 -top-3 grid h-12 w-12 place-items-center rounded-full bg-mint-deep text-3xl text-white">✓</span>}
            </button>
          );
        })}
      </div>
      <HeldGhost held={held}>{(n) => <FriendTight n={n} height={`calc(${card} * 0.9)`} />}</HeldGhost>
      <HandHint on={idx === 0 && tried.length === 0 && stage === "ask"} from={`[aria-label="${sinoOf(r.choices[0])}"]`} to={`[data-drop="box"]`} />
    </div>
  );
}
