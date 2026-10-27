"use client";

import { useEffect, useRef, useState } from "react";
import { Numeral } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { SquishButton } from "@/components/ui";
import { clapAsk, LINES } from "@/curriculum/lines";
import { MAX_NUMBER, nameOf } from "@/curriculum/numbers";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

/*
 * 짝짝 손뼉 — 숫자(3)를 보고 그만큼 손뼉. 칠 때마다 "하나, 둘…" 세어 주고, 마지막으로 친 뒤 잠깐 멈추면 센다.
 * 틀리면 친구가 숫자만큼 짝짝 세며 보여 준다(보통 판은 다시, 도장 놀이는 다음).
 */

const WAIT = 1500;

export function Clap({ rounds, assess, onDone }: { rounds: { n: number }[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [taps, setTaps] = useState(0);
  const [state, setState] = useState<"ready" | "counting" | "right" | "demo">("ready");
  const [lit, setLit] = useState(-1);
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState(0);
  const seq = useRef(0);
  const later = useTimers();
  const n = rounds[idx].n;

  useEffect(() => {
    void say([LINES.clap, clapAsk(rounds[0].n)]);
    return () => stopVoice();
  }, [rounds]);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setTaps(0);
    setMissed(false);
    setState("ready");
    void say(clapAsk(rounds[idx + 1].n));
  };

  /** 숫자만큼 불을 켜며 짝짝 — 보여 주고 나서 then */
  const show = (then: () => void) => {
    setTaps(0);
    for (let i = 0; i < n; i++) {
      later(() => {
        setLit(i);
        sfx.clap();
        void say(nameOf(i + 1));
      }, 500 + i * 800);
    }
    later(() => {
      setLit(-1);
      then();
    }, 500 + n * 800 + 600);
  };

  const judge = (count: number) => {
    if (count === n) {
      const nextScore = missed ? score : score + 1;
      setScore(nextScore);
      setState("right");
      sfx.dingdong();
      void say(pick(LINES.praise));
      later(() => advance(nextScore), 1600);
      return;
    }
    sfx.ddaeng();
    setState("demo");
    later(() =>
      show(() => {
        if (assess) {
          advance(score);
          return;
        }
        setMissed(true);
        setTaps(0);
        setState("ready");
        void say([pick(LINES.retry), clapAsk(n)]);
      }),
      500,
    );
  };

  const clap = () => {
    if (state === "right" || state === "demo") return;
    sfx.wake();
    sfx.clap();
    const t = taps + 1;
    setTaps(t);
    setState("counting");
    void say(nameOf(Math.min(t, MAX_NUMBER)));
    const mine = ++seq.current;
    later(() => {
      if (mine === seq.current) judge(t);
    }, WAIT);
  };

  const shown = state === "demo" ? lit + 1 : taps;

  return (
    <ActivityFrame>
      <div key={idx} className="flex animate-pop-in items-center gap-5">
        <span className="grid place-items-center rounded-[2.4rem] bg-white px-9 py-2 shadow-[0_8px_0_var(--paper-deep)]">
          <Numeral n={n} className="text-brand" style={{ fontSize: "min(16vh, calc(12*var(--vw)))" }} />
        </span>
      </div>

      <div className="flex min-h-16 max-w-[92vw] flex-wrap items-center justify-center gap-2 text-5xl short:text-3xl" aria-live="polite">
        {Array.from({ length: Math.min(shown, MAX_NUMBER) }, (_, i) => (
          <span key={i} className={`animate-pop-in ${state === "demo" && i === lit ? "scale-125" : ""}`}>
            <Icon emoji="👏" />
          </span>
        ))}
      </div>

      <SquishButton tone={state === "right" ? "mint" : "rose"} onClick={clap} className="grid h-40 w-40 place-items-center rounded-full text-7xl short:h-28 short:w-28 short:text-5xl" aria-label="짝">
        <Icon emoji="👏" />
      </SquishButton>
    </ActivityFrame>
  );
}
