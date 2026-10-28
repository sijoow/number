"use client";

import { useMemo } from "react";
import { addAsk, LINES, subtractAsk } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { ArithRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, useChoice } from "../choice";
import type { OnDone } from "../types";
import { FRIEND_CARD, FriendChoice, FriendSum } from "./FriendSum";

/**
 * 더하기·빼기(업체 B5·B7) — 식(3 + 2 = ?)의 숫자마다 위에 그 숫자 친구, 보기 카드도 숫자 옆에 친구(2026-10-27 사용자).
 * 맞히면 친구들이 답 자리로 뛰어들어 블록이 합쳐지는(빼기는 떠나는) 걸 보고 답 친구로 변신 — 장면은 FriendSum(모아 보기와 같이 쓴다).
 */
export function Arith({ op, rounds, assess, onDone }: { op: "add" | "subtract"; rounds: ArithRound[]; assess: boolean; onDone: OnDone }) {
  const add = op === "add";
  const prompts = useMemo(() => rounds.map((r) => [add ? addAsk(r.a, r.b) : subtractAsk(r.a, r.b)]), [add, rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.answer)), [rounds]);
  const c = useChoice({ intro: add ? LINES.add : LINES.subtract, prompts, answers, assess, nameOf: (k) => [nameOf(Number(k))], challenge: !!rounds[rounds.length - 1]?.challenge, onDone });
  const r = rounds[c.idx];

  return (
    <ActivityFrame challenge={c.challenge}>
      <FriendSum key={c.idx} kind={op} a={r.a} b={r.b} answer={r.answer} settled={c.settled} />
      <div className="flex flex-wrap items-center justify-center gap-5 portrait:gap-3">
        {r.choices.map((n) => (
          <ChoiceCard key={`${c.idx}-${n}`} c={c} k={String(n)} label={nameOf(n)} style={FRIEND_CARD}>
            <FriendChoice n={n} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
