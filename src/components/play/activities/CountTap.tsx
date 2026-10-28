"use client";

import { useMemo, useState } from "react";
import { Numeral } from "@/components/Art";
import { howManyAsk, LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import { thingOf } from "@/curriculum/things";
import type { ThingRound } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { say } from "@/lib/voice";
import { ActivityFrame, ChoiceCard, NUM_CARD, NUM_FONT, useChoice } from "../choice";
import { ThingField, thingSize } from "../ThingField";
import type { OnDone } from "../types";

/*
 * 하나씩 세기 — 물건을 하나씩 누르면 번호 딱지가 붙고 "하나, 둘, 셋" 세어 준다(하나에 하나씩 짝짓기).
 * 다 누르면 "모두 몇 개일까?" — 숫자 셋 중에 고른다(점수는 이 물음만).
 */

export function CountTap({ rounds, assess, onDone }: { rounds: ThingRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map(() => [LINES.countTap]), [rounds]);
  const again = useMemo(() => rounds.map((r) => [howManyAsk(thingOf(r.thing).unit)]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.n)), [rounds]);
  const c = useChoice({ intro: "", prompts, again, answers, assess, nameOf: (k) => [nameOf(Number(k))], challenge: !!rounds[rounds.length - 1]?.challenge, onDone });
  // 판마다 누른 차례 — 판이 바뀌면 비운다
  const [taps, setTaps] = useState<{ idx: number; list: number[] }>({ idx: 0, list: [] });
  const round = rounds[c.idx];
  const tapped = taps.idx === c.idx ? taps.list : [];
  const counted = tapped.length >= round.n;

  const tap = (i: number) => {
    if (tapped.includes(i)) return;
    sfx.wake();
    sfx.pop();
    const list = [...tapped, i];
    setTaps({ idx: c.idx, list });
    void say(list.length >= round.n ? [nameOf(list.length), howManyAsk(thingOf(round.thing).unit)] : nameOf(list.length));
  };

  return (
    <ActivityFrame challenge={c.challenge}>
      <ThingField key={c.idx} thing={round.thing} spots={round.spots} size={thingSize(round.n)} tapped={tapped} onTap={counted ? undefined : tap} className="animate-pop-in" />
      {counted ? (
        <div className="flex animate-pop-in flex-wrap items-center justify-center gap-5">
          {round.choices.map((n) => (
            <ChoiceCard key={`${c.idx}-${n}`} c={c} k={String(n)} label={nameOf(n)} style={NUM_CARD}>
              <Numeral n={n} style={NUM_FONT} />
            </ChoiceCard>
          ))}
        </div>
      ) : (
        <p className="glass rounded-full px-6 py-2 text-2xl font-extrabold tabular-nums">
          {tapped.length > 0 ? nameOf(tapped.length) : "하나씩 톡톡!"}
        </p>
      )}
    </ActivityFrame>
  );
}
