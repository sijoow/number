"use client";

import { useMemo } from "react";
import { ThingArt } from "@/components/Art";
import { LINES } from "@/curriculum/lines";
import { thingOf } from "@/curriculum/things";
import type { PatternRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, useChoice } from "../choice";
import type { OnDone } from "../types";

/** 규칙 찾기 — 사과 바나나 사과 바나나 ? — 되풀이되는 규칙을 보고 다음에 올 것을 고른다 */
export function Pattern({ rounds, assess, onDone }: { rounds: PatternRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map(() => [LINES.patternQ]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => r.answer), [rounds]);
  const c = useChoice({ intro: LINES.pattern, prompts, answers, assess, nameOf: (k) => [thingOf(k).name], onDone });
  const r = rounds[c.idx];
  const many = r.seq.length + 1;
  const tile = `min(${many > 7 ? 9 : 12}vh, calc(${many > 7 ? 9 : 11}*var(--vw)))`;

  return (
    <ActivityFrame>
      <div key={c.idx} className="flex max-w-[94vw] animate-pop-in flex-wrap items-center justify-center gap-2 rounded-[2rem] bg-white/75 p-4 ring-1 ring-white">
        {r.seq.map((id, i) => (
          <ThingArt key={i} id={id} size={tile} />
        ))}
        <span className="grid animate-breathe place-items-center rounded-[1.2rem] border-4 border-dashed border-brand bg-brand-soft" style={{ width: tile, height: tile }}>
          {c.settled ? <ThingArt id={r.answer} size={`calc(${tile} * 0.85)`} /> : <span className="font-letter text-4xl font-extrabold text-brand">?</span>}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {r.choices.map((id) => (
          <ChoiceCard key={`${c.idx}-${id}`} c={c} k={id} label={thingOf(id).name} style={{ width: "min(22vh, calc(17*var(--vw)))", height: "min(22vh, calc(17*var(--vw)))" }}>
            <ThingArt id={id} size="min(15vh, calc(12*var(--vw)))" />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
