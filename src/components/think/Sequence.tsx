"use client";

import { useEffect, useState } from "react";
import { FriendArt } from "@/components/Art";
import { toneStyle, usePortrait } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { sinoOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import { sfx } from "@/lib/sfx";
import { useStep } from "@/lib/steps";
import type { SequenceRound } from "@/lib/thinks";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "@/components/play/types";

/**
 * 순서 기억하기 — 친구 넷이 차례로 반짝인다(업체 「순서 기억하기」 흐름을 우리 그림으로, 2026-10-29 사용자). 다 보면 "이제 눌러 봐!" — 같은 차례로 누른다.
 * 둘 → 셋 → 넷. 틀리면 "다시 볼까?" 하고 처음부터 다시 보여 준다. 점수는 판마다 — 처음에 맞힌 판 수.
 */

/** 한 친구가 반짝이는 시간 · 다음 친구까지 쉬는 시간 */
const LIT_MS = 700;
const GAP_MS = 300;

export function Sequence({ rounds, onDone }: { rounds: SequenceRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<"watch" | "play" | "done">("watch");
  const [lit, setLit] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  // 보여 주기를 다시 시작하는 신호 — 틀리면 하나 올린다
  const [replay, setReplay] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  useStep(idx, rounds.length);
  const r = rounds[idx];
  // 세로 화면은 두 줄 두 칸이라 카드를 넓게
  const portrait = usePortrait();
  const card = portrait ? "min(24vh, 40vw)" : `min(${r.friends.length > 3 ? 26 : 30}vh, calc(${r.friends.length > 3 ? 17 : 21}*var(--vw)))`;

  // 보여 주기 — 판이 바뀌거나 다시 볼 때. 처음 판은 안내 말을 먼저
  useEffect(() => {
    const cur = rounds[idx];
    const start = idx === 0 && replay === 0 ? 2600 : 1200;
    if (idx === 0 && replay === 0) void say(LINES.sequence);
    cur.order.forEach((pad, i) => {
      const at = start + i * (LIT_MS + GAP_MS);
      later(() => {
        setLit(pad);
        sfx.pop();
      }, at);
      later(() => setLit(null), at + LIT_MS);
    });
    later(
      () => {
        setStage("play");
        void say(LINES.sequenceGo);
      },
      start + cur.order.length * (LIT_MS + GAP_MS),
    );
    return () => stopVoice();
  }, [idx, replay, rounds, later]);

  const tap = (pad: number) => {
    if (stage !== "play") return;
    sfx.wake();
    const alive = turn();
    if (pad !== r.order[step]) {
      sfx.ddaeng();
      setShake(pad);
      later(() => setShake(null), 500);
      setTries(tries + 1);
      setStage("watch");
      setStep(0);
      void say(LINES.mirrorWrong).then(() => alive() && setReplay((n) => n + 1));
      return;
    }
    setLit(pad);
    later(() => setLit(null), 300);
    sfx.tick();
    const next = step + 1;
    setStep(next);
    if (next < r.order.length) return;
    setStage("done");
    const s = tries === 0 ? score + 1 : score;
    setScore(s);
    void answerFeedback({ name: [], right: true, then: [pick(LINES.praise)], alive }).then((ok) => {
      if (!ok) return;
      later(() => {
        if (idx + 1 >= rounds.length) {
          onDone({ correct: s, total: rounds.length });
          return;
        }
        setIdx(idx + 1);
        setStep(0);
        setTries(0);
        setStage("watch");
      }, 600);
    });
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[4vh] px-4 py-4">
      <span className={`glass rounded-full px-6 py-2 text-2xl font-extrabold transition-opacity ${stage === "play" ? "" : "opacity-60"}`}>{stage === "watch" ? "잘 봐!" : stage === "play" ? "이제 눌러 봐!" : "잘했어!"}</span>
      <div key={idx} className="grid animate-pop-in grid-cols-4 gap-[2.5vw] portrait:grid-cols-2">
        {r.friends.map((n, pad) => {
          const on = lit === pad;
          return (
            <button
              key={pad}
              type="button"
              aria-label={sinoOf(n)}
              onClick={() => tap(pad)}
              className={`squish grid place-items-center rounded-[2rem] transition-transform duration-150 ${on ? "scale-110 ring-8 ring-butter" : ""} ${shake === pad ? "animate-shake" : ""}`}
              style={{ ...toneStyle(on ? "butter" : "card"), width: card, height: card }}
            >
              <span className="pointer-events-none">
                <FriendArt n={n} height={`calc(${card} * 0.82)`} />
              </span>
            </button>
          );
        })}
      </div>
      {/* 몇 번째까지 눌렀나 */}
      <span className="flex gap-2" aria-hidden>
        {r.order.map((_, i) => (
          <span key={i} className={`block h-4 w-4 rounded-full ${i < step || stage === "done" ? "bg-mint-deep" : "bg-white/70"}`} />
        ))}
      </span>
    </div>
  );
}
