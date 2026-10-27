"use client";

import { useEffect, useState } from "react";
import { CubeStack, FriendArt } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { SquishButton } from "@/components/ui";
import { amongOf, heavyIs, LINES, withAnd } from "@/curriculum/lines";
import { nameOf, sinoOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import { seesawTilt, type SeesawRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { Fulcrum } from "./pieces";

/**
 * 시소 — 블록이 더 많은(수가 더 큰) 쪽이 내려간다.
 *   맞히기  두 친구를 태우고 "구와 십 중에 어느 쪽이 더 무거울까?" — 누르면 시소가 기울고 "십이 블록이 더 많아서 내려갔어!"(첫 시도만 점수)
 *   똑같게  왼쪽 친구만큼 오른쪽에 블록을 넣으면 시소가 반듯해지고, 블록이 그 친구가 된다
 */
export function Seesaw({ rounds, onDone }: { rounds: SeesawRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [blocks, setBlocks] = useState(0);
  const [state, setState] = useState<"ask" | "tilted" | "level">("ask");
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const r = rounds[idx];
  /** 묻는 말 — 맞히기는 두 친구 이름을 넣어 "구와 / 십 중에 / 어느 쪽이 더 무거울까?" */
  const ask = (x: SeesawRound): string[] => (x.mode === "guess" ? [withAnd(x.left), amongOf(x.right), LINES.heavier] : [LINES.seesawEven]);

  useEffect(() => {
    void say([LINES.seesaw, ...ask(rounds[0])]);
    return () => stopVoice();
  }, [rounds]);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setBlocks(0);
    setState("ask");
    void say(ask(rounds[idx + 1]));
  };

  const guess = (side: "left" | "right") => {
    if (r.mode !== "guess" || state !== "ask") return;
    sfx.wake();
    setState("tilted");
    const right = (side === "left") === r.left > r.right;
    const nextScore = right ? score + 1 : score;
    setScore(nextScore);
    const alive = turn();
    // 왜 기울었는지 — "십이 / 블록이 더 많아서 내려갔어!"
    const why = [heavyIs(Math.max(r.left, r.right)), LINES.heavyWhy];
    void answerFeedback({ name: [sinoOf(side === "left" ? r.left : r.right)], right, then: right ? [...why, pick(LINES.praise)] : why, alive }).then(
      (ok) => ok && later(() => advance(nextScore), 900),
    );
  };

  const change = (next: number) => {
    if (r.mode !== "even" || state !== "ask" || next < 0 || next > 10) return;
    sfx.wake();
    if (next > blocks) sfx.pop();
    else sfx.tick();
    setBlocks(next);
    if (next === r.left) {
      setState("level");
      const nextScore = score + 1;
      setScore(nextScore);
      sfx.cheer();
      const alive = turn();
      void say([nameOf(next), LINES.seesawLevel]).then(() => alive() && later(() => advance(nextScore), 900));
      return;
    }
    if (next) void say(nameOf(next));
  };

  const tilt = r.mode === "guess" ? (state === "ask" ? 0 : seesawTilt(r.left, r.right)) : seesawTilt(r.left, blocks);
  const friend = "min(22vh, calc(17*var(--vw)))";
  const plank = "min(84vw, 44rem)";

  // 시소 위 한쪽 자리 — 맞히기에서는 누르는 단추
  const seat = (side: "left" | "right") => {
    const n = side === "left" ? r.left : r.mode === "guess" ? r.right : blocks;
    const art =
      side === "right" && r.mode === "even" ? (
        state === "level" ? (
          <FriendArt n={r.left} height={friend} className="animate-pop-in" />
        ) : (
          <span className="flex min-h-[3rem] items-end">{blocks > 0 && <CubeStack n={blocks} size="min(4vh, calc(3.4*var(--vw)))" tone="rose" />}</span>
        )
      ) : (
        <FriendArt n={n} height={friend} />
      );
    if (r.mode === "guess" && state === "ask") {
      return (
        <button type="button" aria-label={sinoOf(n)} onClick={() => guess(side)} className="squish rounded-[1.6rem] bg-white/50 p-1 active:scale-95">
          {art}
        </button>
      );
    }
    return <span className="p-1">{art}</span>;
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-4">
      <p key={idx} className="glass animate-pop-in rounded-full px-6 py-2 text-center text-2xl font-extrabold">
        {r.mode === "guess" ? ask(r).join(" ") : <ReadAlong text={LINES.seesawEven} />}
      </p>
      <div className="relative flex flex-col items-center">
        {/* 널빤지 — 친구들이 올라탄 채로 같이 기운다 */}
        <div className="relative z-10 transition-transform duration-700 ease-out" style={{ width: plank, transform: `rotate(${tilt}deg)` }}>
          <div className="flex items-end justify-between px-[4%]">
            {seat("left")}
            {seat("right")}
          </div>
          <div className="h-4 rounded-full bg-[#c98a4b] shadow-[0_5px_0_#a8703a]" />
        </div>
        <div className="-mt-1">
          <Fulcrum size="min(12vh, 5rem)" />
        </div>
      </div>
      {r.mode === "even" && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="glass rounded-full px-5 py-2 text-xl font-extrabold">
            {nameOf(r.left)}만큼!
          </span>
          <SquishButton tone="rose" onClick={() => change(blocks + 1)} disabled={state !== "ask" || blocks >= 10} className="rounded-full px-7 py-3.5 text-2xl">
            블록 넣기
          </SquishButton>
          <SquishButton tone="card" onClick={() => change(blocks - 1)} disabled={state !== "ask" || blocks === 0} className="rounded-full px-6 py-3.5 text-2xl">
            빼기
          </SquishButton>
        </div>
      )}
    </div>
  );
}
