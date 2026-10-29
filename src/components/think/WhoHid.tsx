"use client";

import { useEffect, useState } from "react";
import { FriendArt } from "@/components/Art";
import type { OnDone } from "@/components/play/types";
import { SquishButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { sinoOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import { sfx } from "@/lib/sfx";
import type { WhoHidRound } from "@/lib/thinks";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";

/*
 * 누가 숨었을까 — 무대의 숫자 친구들을 잘 보고 기억한다. 커튼이 닫혔다 열리면 한 친구가 숨어 있다(업체 「바닷속 친구들」 같은 기억 놀이).
 * 보기 셋 — 숨은 친구 · 무대에 아직 있는 친구 · 처음부터 없던 친구. 맞으면 숨은 친구가 제자리로 톡.
 * 틀리면 다시(한 번 틀리면 정답 보기가 숨쉬기). 점수는 판마다 — 처음에 맞힌 판 수.
 */

type Phase = "look" | "close" | "ask" | "found";

/** 보는 시간 — 친구가 많을수록 조금 더 */
const LOOK_MS = 2600;
const LOOK_PER_FRIEND = 450;
/** 커튼이 닫혀 있는 시간 */
const CLOSED_MS = 1300;

export function WhoHid({ rounds, onDone }: { rounds: WhoHidRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("look");
  const [tried, setTried] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const r = rounds[idx];
  const hiddenN = r.friends[r.hidden];
  const tall = `min(${r.friends.length > 3 ? 30 : 34}vh, calc(${r.friends.length > 3 ? 15 : 18}*var(--vw)))`;

  useEffect(() => {
    void say(LINES.whoHid);
    const close = window.setTimeout(
      () => {
        setPhase("close");
        sfx.boop();
      },
      LOOK_MS + r.friends.length * LOOK_PER_FRIEND,
    );
    const open = window.setTimeout(
      () => {
        setPhase("ask");
        sfx.pop();
        void say(LINES.whoHidQ);
      },
      LOOK_MS + r.friends.length * LOOK_PER_FRIEND + CLOSED_MS,
    );
    return () => {
      window.clearTimeout(close);
      window.clearTimeout(open);
      stopVoice();
    };
  }, [idx, r.friends.length]);

  const choose = (n: number) => {
    if (phase !== "ask" || tried.includes(n)) return;
    const alive = turn();
    if (n === hiddenN) {
      const s = tried.length === 0 ? score + 1 : score;
      setScore(s);
      setPhase("found");
      void answerFeedback({ name: [sinoOf(n)], right: true, then: [LINES.found, pick(LINES.praise)], alive }).then((ok) => {
        if (!ok) return;
        later(() => {
          if (idx + 1 >= rounds.length) {
            onDone({ correct: s, total: rounds.length });
            return;
          }
          setIdx(idx + 1);
          setTried([]);
          setPhase("look");
        }, 600);
      });
      return;
    }
    setTried([...tried, n]);
    void answerFeedback({ name: [sinoOf(n)], right: false, then: [pick(LINES.retry), LINES.whoHidQ], alive });
  };

  const closed = phase === "close";

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-4">
      {/* 무대 — 커튼이 양옆에서 닫힌다 */}
      <div key={idx} className="relative w-[min(92vw,54rem)] animate-pop-in overflow-hidden rounded-[2rem] bg-lilac ring-4 ring-white/80" style={{ height: `calc(${tall} + 6vh)` }}>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[22%] bg-[#b89be6]" />
        <div className="absolute inset-x-[4%] bottom-[8%] flex items-end justify-around">
          {r.friends.map((n, i) => {
            const gone = i === r.hidden && (phase === "ask" || phase === "close");
            return (
              <span key={n} className="grid place-items-end" style={{ minWidth: `calc(${tall} * 0.45)`, height: tall }}>
                {gone ? (
                  phase === "ask" && (
                    <span className="grid animate-pop-in place-items-center self-center rounded-full bg-white/80 font-letter font-black text-brand" style={{ width: `calc(${tall} * 0.4)`, height: `calc(${tall} * 0.4)`, fontSize: `calc(${tall} * 0.26)` }}>
                      ?
                    </span>
                  )
                ) : (
                  <FriendArt n={n} height={tall} className={phase === "found" && i === r.hidden ? "animate-pop-in" : ""} />
                )}
              </span>
            );
          })}
        </div>
        {/* 커튼 */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-1/2 bg-[repeating-linear-gradient(90deg,#d64545_0_1.4rem,#c13838_1.4rem_2.8rem)] shadow-[inset_-8px_0_14px_rgb(0_0_0/0.2)] transition-transform duration-500 ease-in-out" style={{ transform: closed ? "none" : "translateX(-100%)" }} />
        <span aria-hidden className="absolute inset-y-0 right-0 w-1/2 bg-[repeating-linear-gradient(90deg,#c13838_0_1.4rem,#d64545_1.4rem_2.8rem)] shadow-[inset_8px_0_14px_rgb(0_0_0/0.2)] transition-transform duration-500 ease-in-out" style={{ transform: closed ? "none" : "translateX(100%)" }} />
      </div>

      <div className="flex min-h-[min(24vh,12rem)] items-center justify-center gap-5">
        {(phase === "ask" || phase === "found") &&
          r.choices.map((n) => {
            const right = phase === "found" && n === hiddenN;
            const wrong = tried.includes(n);
            const hint = phase === "ask" && tried.length > 0 && n === hiddenN;
            return (
              <SquishButton
                key={`${idx}-${n}`}
                tone={right ? "mint" : wrong ? "peach" : "card"}
                aria-label={`숫자 친구 ${n}`}
                onClick={() => choose(n)}
                className={`relative grid animate-pop-in place-items-center rounded-[1.8rem] p-2 ${hint ? "animate-breathe ring-8 ring-butter" : ""}`}
                style={{ width: "min(22vh, calc(17*var(--vw)))", height: "min(22vh, calc(17*var(--vw)))" }}
              >
                <span className={wrong ? "opacity-45 grayscale" : ""}>
                  <FriendArt n={n} height="min(18vh, calc(14*var(--vw)))" />
                </span>
                {right && <span className="absolute -right-3 -top-3 grid h-12 w-12 place-items-center rounded-full bg-mint-deep text-3xl text-white">✓</span>}
                {wrong && <span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-full bg-peach-deep text-2xl text-white shadow">✕</span>}
              </SquishButton>
            );
          })}
      </div>
    </div>
  );
}
