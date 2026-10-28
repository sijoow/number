"use client";

import { useMemo } from "react";
import { Numeral } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { NumRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, NUM_CARD, NUM_FONT, useChoice } from "../choice";
import type { OnDone } from "../types";

/** 숫자 찾기 — "셋! 어디 있을까?" 듣고 숫자 카드 고르기. 스피커를 누르면 다시 들려준다 */
export function FindNum({ rounds, assess, onDone }: { rounds: NumRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [nameOf(r.n), LINES.whereIs]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.n)), [rounds]);
  const c = useChoice({ intro: LINES.findNum, prompts, answers, assess, nameOf: (k) => [nameOf(Number(k))], challenge: !!rounds[rounds.length - 1]?.challenge, onDone });
  const round = rounds[c.idx];

  return (
    <ActivityFrame challenge={c.challenge}>
      <div key={c.idx} className="animate-pop-in">
        <SpeakerButton text={prompts[c.idx]} size={168} pulse />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {round.choices.map((n) => (
          <ChoiceCard key={`${c.idx}-${n}`} c={c} k={String(n)} label={nameOf(n)} style={NUM_CARD}>
            <Numeral n={n} style={NUM_FONT} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
