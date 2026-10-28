"use client";

import { useMemo } from "react";
import { Numeral } from "@/components/Art";
import { howManyAsk, LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import { thingOf } from "@/curriculum/things";
import type { ThingRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, NUM_CARD, NUM_FONT, useChoice } from "../choice";
import { ThingField, thingSize } from "../ThingField";
import type { OnDone } from "../types";

/** 몇 개일까 — 물건 무리를 보고 맞는 숫자 고르기(세어도 되고, 한눈에 봐도 된다) */
export function HowMany({ rounds, assess, onDone }: { rounds: ThingRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [howManyAsk(thingOf(r.thing).unit)]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.n)), [rounds]);
  const c = useChoice({ intro: LINES.howMany, prompts, answers, assess, nameOf: (k) => [nameOf(Number(k))], challenge: !!rounds[rounds.length - 1]?.challenge, onDone });
  const round = rounds[c.idx];

  return (
    <ActivityFrame challenge={c.challenge}>
      <ThingField key={c.idx} thing={round.thing} spots={round.spots} size={thingSize(round.n)} className="animate-pop-in" />
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
