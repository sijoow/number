"use client";

import { useEffect, useState } from "react";
import { Cube, CubeStack, FriendArt, Numeral } from "@/components/Art";
import { SquishButton } from "@/components/ui";
import { howManyAsk, LINES, meetHello } from "@/curriculum/lines";
import { nameOf, range } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { TenRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useStep } from "@/lib/steps";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { HandHint } from "../play/HandHint";
import type { OnDone } from "../play/types";

/**
 * 열 칸 채우기 — 두 줄 다섯 칸 판에 블록 몇 개가 있다. 빈 칸을 눌러 채우면 이어서 세고("일곱, 여덟…"), 열 칸이 다 차면 십으로 변신
 * (업체 「과일 가게」 열 칸 흐름을 우리 그림으로, 2026-10-29 사용자). 열하나 넘게 알면 다음 판은 "열 하고 셋, 모두 몇 개일까?" — 십 옆에 블록 몇 개, 숫자를 고르면 그 친구로.
 */

const COLS = 5;

export function TenFrame({ rounds, onDone }: { rounds: TenRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const r = rounds[idx];
  const [filled, setFilled] = useState<number[]>(() => (r.mode === "fill" ? range(0, r.pre - 1) : []));
  const [tried, setTried] = useState<number[]>([]);
  const [stage, setStage] = useState<"play" | "right" | "morph">("play");
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  useStep(idx, rounds.length);
  const cell = "min(15vh, calc(10*var(--vw)))";

  useEffect(() => {
    const cur = rounds[idx];
    const ask = cur.mode === "fill" ? [] : [nameOf(10), LINES.and, nameOf(cur.extra), howManyAsk("개")];
    void say(idx === 0 ? [LINES.tenFrame, ...ask] : ask);
    return () => stopVoice();
  }, [idx, rounds]);

  const next = (s: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: s, total: rounds.length });
      return;
    }
    const nr = rounds[idx + 1];
    setIdx(idx + 1);
    setFilled(nr.mode === "fill" ? range(0, nr.pre - 1) : []);
    setTried([]);
    setStage("play");
  };

  /** 열 칸 판 — 빈 칸을 누르면 채운다 */
  const fill = (k: number) => {
    if (r.mode !== "fill" || stage !== "play" || filled.includes(k)) return;
    sfx.wake();
    sfx.pop();
    const now = [...filled, k];
    setFilled(now);
    if (now.length < 10) {
      void say(nameOf(now.length));
      return;
    }
    const alive = turn();
    setStage("right");
    const s = score + 1;
    setScore(s);
    void answerFeedback({ name: [nameOf(10)], right: true, then: [], alive }).then((ok) => {
      if (!ok) return;
      setStage("morph");
      sfx.cheer();
      void say([LINES.transform, meetHello(10)]).then(() => alive() && later(() => next(s), 700));
    });
  };

  /** 열과 몇 — 숫자 고르기 */
  const choose = (n: number) => {
    if (r.mode !== "teen" || stage !== "play" || tried.includes(n)) return;
    const alive = turn();
    if (n === 10 + r.extra) {
      const s = tried.length === 0 ? score + 1 : score;
      setScore(s);
      setStage("right");
      void answerFeedback({ name: [nameOf(n)], right: true, then: [], alive }).then((ok) => {
        if (!ok) return;
        setStage("morph");
        sfx.cheer();
        void say([meetHello(n), pick(LINES.praise)]).then(() => alive() && later(() => next(s), 700));
      });
      return;
    }
    setTried([...tried, n]);
    void answerFeedback({ name: [nameOf(n)], right: false, then: [pick(LINES.retry), nameOf(10), LINES.and, nameOf(r.extra), howManyAsk("개")], alive });
  };

  if (r.mode === "fill") {
    const empty = range(0, 9).find((k) => !filled.includes(k)) ?? 0;
    return (
      <div className="flex min-h-full flex-col items-center justify-center-safe gap-[4vh] px-4 py-4">
        <div key={idx} className="grid min-h-[1px] animate-pop-in place-items-center">
          {stage === "morph" ? (
            <FriendArt n={10} height="min(52vh, calc(38*var(--vw)))" className="animate-pop-in" />
          ) : (
            <div className={`grid gap-[1.2vh] rounded-[1.6rem] bg-[#f0ad5b] p-[1.6vh] shadow-[0_12px_30px_-14px_rgb(62_58_82/0.5)] ${stage === "right" ? "animate-wiggle" : ""}`} style={{ gridTemplateColumns: `repeat(${COLS}, ${cell})` }}>
              {range(0, 9).map((k) => (
                <button key={k} type="button" data-cell={k} aria-label={`${k + 1}째 칸`} onClick={() => fill(k)} className="grid place-items-center rounded-[1rem] bg-[#fff3dc] transition-transform active:scale-90" style={{ width: cell, height: cell }}>
                  {filled.includes(k) && <Cube size={`calc(${cell} * 0.78)`} tone="rose" className="animate-drop-in" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="glass grid min-w-[3.5em] place-items-center rounded-full px-5 py-1" style={{ fontSize: "min(8vh, 3rem)" }}>
          <Numeral n={filled.length} />
        </span>
        <HandHint on={idx === 0 && filled.length === r.pre && stage === "play"} from={`[data-cell="${empty}"]`} to={`[data-cell="${empty}"]`} />
      </div>
    );
  }

  const answer = 10 + r.extra;
  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[5vh] px-4 py-4">
      <div key={idx} className="flex min-h-[1px] animate-pop-in items-end gap-[3vw]">
        {stage === "morph" ? (
          <FriendArt n={answer} height="min(46vh, calc(34*var(--vw)))" className="animate-pop-in" />
        ) : (
          <>
            <FriendArt n={10} height="min(40vh, calc(28*var(--vw)))" />
            <span className="mb-[8vh] font-black leading-none text-ink-soft" style={{ fontSize: "min(9vh, 3.4rem)" }}>
              +
            </span>
            <span className="mb-[2vh]">
              <CubeStack n={r.extra} size="min(6.4vh, calc(4.4*var(--vw)))" tone="rose" />
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-[3vw]">
        {r.choices.map((n) => {
          const wrong = tried.includes(n);
          const right = n === answer && stage !== "play";
          return (
            <SquishButton
              key={`${idx}-${n}`}
              tone={right ? "mint" : wrong ? "peach" : "card"}
              aria-label={nameOf(n)}
              onClick={() => choose(n)}
              className={`relative grid place-items-center rounded-[2.2rem] ${!wrong && tried.length > 0 && n === answer && stage === "play" ? "animate-breathe ring-8 ring-butter" : ""}`}
              style={{ width: "min(20vh, calc(15*var(--vw)))", height: "min(20vh, calc(15*var(--vw)))" }}
            >
              <span className={wrong ? "opacity-45" : ""}>
                <Numeral n={n} style={{ fontSize: "min(12vh, calc(9*var(--vw)))" }} />
              </span>
              {wrong && <span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-full bg-peach-deep text-2xl text-white shadow">✕</span>}
              {right && <span className="absolute -right-3 -top-3 grid h-12 w-12 place-items-center rounded-full bg-mint-deep text-3xl text-white">✓</span>}
            </SquishButton>
          );
        })}
      </div>
    </div>
  );
}
