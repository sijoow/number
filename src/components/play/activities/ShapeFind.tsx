"use client";

import { useMemo } from "react";
import { ShapeArt } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { LINES, shapeAsk } from "@/curriculum/lines";
import { shapeName } from "@/curriculum/things";
import type { ShapeRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, useChoice } from "../choice";
import type { OnDone } from "../types";

/** 모양 찾기 — "세모를 찾아 봐!" 크기·색·돌림이 달라도 같은 모양을 고른다 */
export function ShapeFind({ rounds, assess, onDone }: { rounds: ShapeRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [shapeAsk(r.target)]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => r.choices.find((x) => x.shape === r.target)?.key ?? ""), [rounds]);
  const c = useChoice({
    intro: LINES.shape,
    prompts,
    answers,
    assess,
    nameOf: (k, i) => [shapeName(rounds[i].choices.find((x) => x.key === k)?.shape ?? "circle")],
    onDone,
  });
  const r = rounds[c.idx];
  // 세로 폰(390px)에서도 카드 셋이 한 줄에 — 21*vw 면 넘쳐서 줄이 바뀐다
  const card = { width: "min(26vh, calc(18*var(--vw)))", height: "min(26vh, calc(18*var(--vw)))" };

  return (
    <ActivityFrame>
      <div key={c.idx} className="flex animate-pop-in items-center gap-4">
        <span className="glass rounded-full px-7 py-2.5 text-3xl font-extrabold short:text-2xl">{shapeName(r.target)}</span>
        <SpeakerButton text={prompts[c.idx]} size={88} pulse />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {r.choices.map((s) => (
          <ChoiceCard key={s.key} c={c} k={s.key} label={shapeName(s.shape)} style={card}>
            <ShapeArt shape={s.shape} color={s.color} rot={s.rot} size={`calc(min(18vh, calc(13*var(--vw))) * ${s.scale.toFixed(2)})`} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
