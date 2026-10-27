"use client";

import { useEffect, useState } from "react";
import { Cube, FriendArt, Numeral } from "@/components/Art";
import { SquishButton } from "@/components/ui";
import { buildAsk, LINES } from "@/curriculum/lines";
import { MAX_NUMBER, nameOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

/*
 * 블록 쌓기 — 숫자(3)를 보고 그만큼 블록을 쌓는다. 「블록 넣기」를 누를 때마다 하나씩 떨어지며 세어 주고,
 * 맨 위 블록을 누르면 하나 뺀다. 「다 됐어!」를 누르면 맞는지 본다(첫 번째 「다 됐어」만 점수).
 * 틀리면 "블록이 너무 많아!/모자라!" — 보통 판은 고쳐서 다시, 도장 놀이는 맞는 수를 보여 주고 다음.
 */

/** 기둥 하나에 다섯 개씩 — 스물까지 네 기둥으로 한 화면에 */
const PER_COLUMN = 5;

export function Build({ rounds, assess, onDone }: { rounds: { n: number }[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [state, setState] = useState<"building" | "right" | "wrong" | "reveal">("building");
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const n = rounds[idx].n;
  const cap = Math.min(MAX_NUMBER, Math.max(n + 3, 5));

  useEffect(() => {
    void say([LINES.build, buildAsk(rounds[0].n)]);
    return () => stopVoice();
  }, [rounds]);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setCount(0);
    setMissed(false);
    setState("building");
    void say(buildAsk(rounds[idx + 1].n));
  };

  const busy = state === "right" || state === "reveal";

  const add = () => {
    if (busy || count >= cap) return;
    sfx.wake();
    sfx.pop();
    setState("building");
    setCount(count + 1);
    void say(nameOf(count + 1));
  };

  const remove = () => {
    if (busy || count === 0) return;
    sfx.tick();
    setState("building");
    setCount(count - 1);
    if (count - 1 > 0) void say(nameOf(count - 1));
  };

  const check = () => {
    if (busy || count === 0) return;
    const alive = turn();
    if (count === n) {
      const nextScore = missed ? score : score + 1;
      setScore(nextScore);
      setState("right");
      void answerFeedback({ name: [nameOf(count)], right: true, then: [pick(LINES.praise)], alive }).then((ok) => ok && later(() => advance(nextScore), 600));
      return;
    }
    const why = count > n ? LINES.tooMany : LINES.tooFew;
    setMissed(true);
    if (assess) {
      setState("reveal");
      void answerFeedback({ name: [nameOf(count)], right: false, then: [why, LINES.revealHere], alive }).then((ok) => {
        if (!ok) return;
        setCount(n);
        later(() => advance(score), 1200);
      });
      return;
    }
    setState("wrong");
    void answerFeedback({ name: [nameOf(count)], right: false, then: [why, buildAsk(n)], alive });
  };

  const cube = "min(8vh, calc(8.5*var(--vw)))";
  const cols = Math.max(1, Math.ceil(count / PER_COLUMN));

  return (
    <ActivityFrame>
      {/* 가로 화면은 높이가 모자라 숫자를 쌓는 곳 왼쪽에 둔다 — 블록이 다섯 줄 차도 「다 됐어!」가 화면 안에(2026-10-27, 스물까지 넓히며 확인) */}
      <div className="flex flex-col items-center gap-[4vh] landscape:flex-row landscape:gap-8">
        <div key={idx} className="flex animate-pop-in items-center gap-5 landscape:flex-col landscape:gap-3">
          <span className="grid place-items-center rounded-[2.4rem] bg-white px-9 py-2 shadow-[0_8px_0_var(--paper-deep)]">
            <Numeral n={n} className="text-brand" style={{ fontSize: "min(16vh, calc(12*var(--vw)))" }} />
          </span>
          <span className="glass rounded-full px-5 py-2 text-2xl font-extrabold">{nameOf(n)}만큼!</span>
        </div>

        {/* 쌓는 곳 — 맨 위 블록을 누르면 하나 뺀다 */}
        <div
          className={`relative flex min-h-[min(48vh,calc(50*var(--vw)))] items-end justify-center gap-3 short:min-h-[34vh] short:pt-3 rounded-[2rem] bg-white/70 px-6 pb-4 pt-6 ring-1 ring-white ${state === "wrong" ? "animate-shake" : ""} ${state === "right" ? "animate-wiggle ring-4 ring-mint-deep" : ""}`}
          style={{ minWidth: "min(60vw, 26rem)" }}
        >
          {count === 0 && <span className="self-center text-xl font-bold text-ink-soft">여기에 쌓아요</span>}
          {/* 맞히면 그 숫자 친구가 기둥 모습(인물구성2)으로 블록 옆에 나타난다. 세로 화면에서 블록이 세 기둥 이상(열하나~)이면 옆자리가 모자라 블록 위에 겹쳐 */}
          {state === "right" && (
            <span className={cols > 2 ? "contents portrait:absolute portrait:inset-0 portrait:z-10 portrait:grid portrait:place-items-center portrait:rounded-[2rem] portrait:bg-white/60" : "contents"}>
              <FriendArt n={n} form="tower" height="min(36vh, calc(34*var(--vw)))" className="mr-2 animate-pop-in" />
            </span>
          )}
          {Array.from({ length: cols }, (_, col) => {
            const inCol = Math.min(PER_COLUMN, count - col * PER_COLUMN);
            return (
              <div key={col} className="flex flex-col-reverse items-center gap-1">
                {Array.from({ length: inCol }, (_, i) => {
                  const at = col * PER_COLUMN + i;
                  const top = at === count - 1;
                  return top ? (
                    <button key={at} type="button" aria-label="하나 빼기" onClick={remove} className="animate-drop-in">
                      <Cube size={cube} tone={state === "right" ? "mint" : "sky"} />
                    </button>
                  ) : (
                    <span key={at} className="animate-drop-in">
                      <Cube size={cube} tone={state === "right" ? "mint" : "sky"} />
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <SquishButton tone="sky" onClick={add} disabled={busy || count >= cap} className="flex items-center gap-3 rounded-full px-8 py-4 text-3xl">
          <Cube size="1.1em" tone="card" /> 블록 넣기
        </SquishButton>
        <button type="button" onClick={check} disabled={busy || count === 0} className="cta rounded-full px-9 py-4 text-3xl font-extrabold disabled:opacity-50">
          다 됐어!
        </button>
      </div>
    </ActivityFrame>
  );
}
