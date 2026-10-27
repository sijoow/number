"use client";

import { useEffect, useState } from "react";
import { ShapeArt } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { SquishButton } from "@/components/ui";
import { LINES, sizeName, sortAsk } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import { colorName, shapeName } from "@/curriculum/things";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { SortRound } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

/**
 * 모양 나누기(업체 B9) — "빨간색을 모두 골라 봐!" 맞는 카드를 하나씩 눌러 모은다. 누를 때마다 "하나, 둘…" 세어 준다.
 * 보기가 하나가 아니라서 choice 틀 대신 따로 — 맞힌 카드는 민트 + ✓, 아래 점이 몇 개 남았는지 보여 준다.
 *   보통 판   틀린 카드는 흔들리고 다시 묻는다
 *   도장 놀이 틀리면 맞는 카드를 모두 보여 주고 다음 — 한 번도 안 틀리고 다 모은 판만 점수
 */
export function Sort({ rounds, assess, onDone }: { rounds: SortRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const [state, setState] = useState<"picking" | "done" | "reveal">("picking");
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const r = rounds[idx];

  useEffect(() => {
    void say([LINES.sort, sortAsk(rounds[0].target)]);
    return () => stopVoice();
  }, [rounds]);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setFound([]);
    setMissed(false);
    setState("picking");
    void say(sortAsk(rounds[idx + 1].target));
  };

  const tap = (key: string) => {
    if (state !== "picking" || found.includes(key)) return;
    sfx.wake();
    const alive = turn();
    if (r.answers.includes(key)) {
      const next = [...found, key];
      setFound(next);
      if (next.length < r.answers.length) {
        sfx.pop();
        void say(nameOf(next.length));
        return;
      }
      const nextScore = missed ? score : score + 1;
      setScore(nextScore);
      setState("done");
      void answerFeedback({ name: [nameOf(next.length)], right: true, then: [pick(LINES.praise)], alive }).then((ok) => ok && later(() => advance(nextScore), 600));
      return;
    }
    setMissed(true);
    setShake(key);
    later(() => setShake(null), 600);
    if (assess) {
      setState("reveal");
      void answerFeedback({ name: [], right: false, then: [LINES.revealHere], alive }).then((ok) => ok && later(() => advance(score), 1200));
      return;
    }
    void answerFeedback({ name: [], right: false, then: [pick(LINES.retry), sortAsk(r.target)], alive });
  };

  // 가로 화면은 한 줄에 여섯, 세로 폰은 셋씩 두 줄
  const card = { width: "min(21vh, calc(15*var(--vw)))", height: "min(21vh, calc(15*var(--vw)))" };
  const art = "min(16vh, calc(11.5*var(--vw)))";

  return (
    <ActivityFrame>
      <p key={idx} className="glass animate-pop-in rounded-full px-7 py-2.5 text-3xl font-extrabold short:text-2xl">
        <ReadAlong text={sortAsk(r.target)} />
      </p>
      <div className="grid grid-cols-6 gap-4 portrait:grid-cols-3 portrait:gap-3">
        {r.cards.map((s) => {
          const got = found.includes(s.key) || (state === "reveal" && r.answers.includes(s.key));
          return (
            <SquishButton
              key={s.key}
              tone={got ? "mint" : shake === s.key ? "peach" : "card"}
              aria-label={r.by === "color" ? `${colorName(s.color)} ${shapeName(s.shape)}` : sizeName(s.shape, s.scale > 0.75)}
              onClick={() => tap(s.key)}
              className={`relative grid place-items-center rounded-[1.8rem] ${shake === s.key ? "animate-shake" : ""} ${got ? "animate-wiggle" : ""}`}
              style={card}
            >
              <ShapeArt shape={s.shape} color={s.color} rot={s.rot} size={`calc(${art} * ${s.scale.toFixed(2)})`} />
              {got && <span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-full bg-mint-deep text-2xl text-white">✓</span>}
            </SquishButton>
          );
        })}
      </div>
      <div className="flex gap-2" aria-hidden>
        {r.answers.map((k, i) => (
          <span key={k} className={`h-4 rounded-full ${i < found.length ? "w-8 bg-mint-deep" : "w-4 bg-paper-deep"}`} />
        ))}
      </div>
    </ActivityFrame>
  );
}
