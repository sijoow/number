"use client";

import { useEffect, useState } from "react";
import { Cube, FriendArt, Numeral } from "@/components/Art";
import { SquishButton } from "@/components/ui";
import { LINES, makeAsk } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { MoreLessGame } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useStep } from "@/lib/steps";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";

/**
 * 하나 더 · 하나 덜 — 친구는 그대로 두고 목표 수만 바뀐다(업체 「탈리」 흐름을 우리 그림으로, 2026-10-29 사용자).
 * 「하나 더」를 누르면 블록이 하나 붙어 다음 친구로, 「하나 덜」을 누르면 하나 빠져 앞 친구로 — 목표 수가 되면 딩동댕, 다음 목표.
 * 누를 때마다 지금 수를 읽어 준다("넷!"). 하나도 없으면 "하나도 없어!".
 */

/** 넘지 않게 — 목표는 열까지 */
const MAX = 10;

export function MoreLess({ game, onDone }: { game: MoreLessGame; onDone: OnDone }) {
  const [count, setCount] = useState(game.start);
  const [idx, setIdx] = useState(0);
  const [hit, setHit] = useState(false);
  // 바뀔 때마다 친구가 통통 — key 로 다시 그린다
  const [bump, setBump] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const total = game.targets.length;
  useStep(idx, total);
  const target = game.targets[idx];
  const friendH = "min(46vh, calc(30*var(--vw)))";
  const btn = "min(19vh, calc(13*var(--vw)))";

  useEffect(() => {
    void say(idx === 0 ? [LINES.moreLess, makeAsk(game.targets[0])] : [makeAsk(game.targets[idx])]);
    return () => stopVoice();
  }, [idx, game]);

  const change = (d: 1 | -1) => {
    if (hit) return;
    sfx.wake();
    const next = count + d;
    if (next < 0 || next > MAX) {
      sfx.boop();
      return;
    }
    setCount(next);
    setBump((b) => b + 1);
    if (d > 0) sfx.pop();
    else sfx.tick();
    if (next !== target) {
      void say(next === 0 ? LINES.none : nameOf(next));
      return;
    }
    setHit(true);
    const alive = turn();
    void answerFeedback({ name: [nameOf(next)], right: true, then: [pick(LINES.praise)], alive }).then((ok) => {
      if (!ok) return;
      later(() => {
        if (idx + 1 >= total) {
          onDone({ correct: total, total });
          return;
        }
        setIdx(idx + 1);
        setHit(false);
      }, 500);
    });
  };

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-[5vw] px-4 py-4 portrait:flex-col portrait:gap-[3vh]">
      {/* 목표 수 */}
      <div key={idx} className="flex animate-pop-in flex-col items-center gap-2">
        <span className="rounded-full bg-white/80 px-4 py-1 text-xl font-extrabold text-ink-soft">만들 수</span>
        <span
          className={`grid place-items-center rounded-[2rem] bg-butter text-ink shadow-[0_8px_0_var(--butter-deep)] ${hit ? "animate-wiggle ring-8 ring-mint" : ""}`}
          style={{ width: "min(26vh, calc(18*var(--vw)))", height: "min(26vh, calc(18*var(--vw)))" }}
        >
          <Numeral n={target} style={{ fontSize: "min(18vh, calc(12.5*var(--vw)))" }} />
        </span>
      </div>

      {/* 지금 친구 — 블록 수가 바뀌면 다른 친구로 */}
      <div className="flex flex-col items-center gap-2">
        <span className="grid place-items-end" style={{ height: friendH, minWidth: `calc(${friendH} * 0.5)` }}>
          {count > 0 ? (
            <span key={bump} className="animate-pop-in">
              <FriendArt n={count} height={friendH} />
            </span>
          ) : (
            <span className="mb-4 rounded-full bg-white/70 px-5 py-2 text-2xl font-extrabold text-ink-soft">텅!</span>
          )}
        </span>
        <span className="glass grid min-w-[3.5em] place-items-center rounded-full px-4 py-1" style={{ fontSize: "min(7vh, calc(4.6*var(--vw)))" }}>
          <Numeral n={count} />
        </span>
      </div>

      {/* 하나 더 · 하나 덜 */}
      <div className="flex flex-col items-center gap-[3vh] portrait:flex-row portrait:gap-[5vw]">
        <SquishButton tone="mint" aria-label="하나 더" disabled={hit || count >= MAX} onClick={() => change(1)} className="flex flex-col items-center justify-center gap-1 rounded-[2rem]" style={{ width: btn, height: btn }}>
          <span className="flex items-center gap-1 text-[min(7vh,calc(5*var(--vw)))] font-black leading-none">
            +<Cube size="min(6vh, calc(4*var(--vw)))" tone="sky" />
          </span>
          <span className="text-lg font-extrabold">하나 더</span>
        </SquishButton>
        <SquishButton tone="peach" aria-label="하나 덜" disabled={hit || count <= 0} onClick={() => change(-1)} className="flex flex-col items-center justify-center gap-1 rounded-[2rem]" style={{ width: btn, height: btn }}>
          <span className="flex items-center gap-1 text-[min(7vh,calc(5*var(--vw)))] font-black leading-none">
            −<Cube size="min(6vh, calc(4*var(--vw)))" tone="sky" />
          </span>
          <span className="text-lg font-extrabold">하나 덜</span>
        </SquishButton>
      </div>
    </div>
  );
}
