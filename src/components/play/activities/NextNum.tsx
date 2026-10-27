"use client";

import { useMemo } from "react";
import { Numeral } from "@/components/Art";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { SeqRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, NUM_CARD, NUM_FONT, useChoice } from "../choice";
import type { OnDone } from "../types";

/** 다음 숫자 — "하나, 둘, 셋, 다음은?" 수의 차례. 보여 준 수를 읽어 주고 물음표 자리에 올 숫자를 고른다 */
export function NextNum({ rounds, assess, onDone }: { rounds: SeqRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [...r.seq.map(nameOf), LINES.nextNum]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.answer)), [rounds]);
  const c = useChoice({ intro: "", prompts, answers, assess, nameOf: (k) => [nameOf(Number(k))], onDone });
  const r = rounds[c.idx];
  const tile = { width: "min(15vh, calc(13*var(--vw)))", height: "min(15vh, calc(13*var(--vw)))" };
  const font = { fontSize: "min(10vh, calc(8.5*var(--vw)))" };

  return (
    <ActivityFrame>
      <div key={c.idx} className="flex animate-pop-in flex-wrap items-center justify-center gap-3">
        {r.seq.map((n, i) => (
          <span key={i} className="grid place-items-center rounded-[1.6rem] bg-white shadow-[0_6px_0_var(--paper-deep)]" style={tile}>
            <Numeral n={n} style={font} />
          </span>
        ))}
        <span className="grid animate-breathe place-items-center rounded-[1.6rem] border-4 border-dashed border-brand bg-brand-soft" style={tile}>
          <Numeral n={c.settled ? r.answer : "?"} className="text-brand" style={font} />
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {r.choices.map((n) => (
          <ChoiceCard key={`${c.idx}-${n}`} c={c} k={String(n)} label={nameOf(n)} style={NUM_CARD}>
            <Numeral n={n} style={NUM_FONT} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
