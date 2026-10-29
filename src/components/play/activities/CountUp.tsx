"use client";

import { useMemo } from "react";
import { Numeral, ThingArt } from "@/components/Art";
import { howManyAsk, LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import { thingOf } from "@/curriculum/things";
import type { CountUpRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, NUM_CARD, useChoice } from "../choice";
import { Dots } from "../Dots";
import { thingSize } from "../ThingField";
import type { OnDone } from "../types";

/**
 * 수 세기 기초 — 하나, 둘, 셋 … 판마다 하나씩 늘어나는 물건이 차례로 톡톡 나오고, 숫자 카드 둘 중에 고른다(업체 판 그대로).
 * 섞인 판(group)은 수가 섞여 나오고 물건이 무리 지어(2×2, 3×2 …) 조금씩 기울어 놓인다 — 업체 다음 섬처럼(2026-10-29).
 * 카드 숫자 위에는 그 수만큼 점 — 숫자 모양을 아직 몰라도 점을 세어 고를 수 있게.
 */

/** 무리 지을 때 한 줄에 몇 개 — 넷은 2×2, 다섯·여섯은 셋씩 */
const colsOf = (n: number) => (n <= 3 ? n : n === 4 ? 2 : Math.ceil(n / 2));
export function CountUp({ rounds, assess, onDone }: { rounds: CountUpRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [howManyAsk(thingOf(r.thing).unit)]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.n)), [rounds]);
  const c = useChoice({ intro: LINES.countUp, prompts, answers, assess, nameOf: (k) => [nameOf(Number(k))], onDone });
  const r = rounds[c.idx];
  // 물건을 크게 — 판이 화면을 넉넉히 채우게(2026-10-29)
  const size = thingSize(r.n, 1.45);
  const cols = r.group ? colsOf(r.n) : r.n;

  return (
    <ActivityFrame>
      <div key={c.idx} className="flex w-[min(94vw,56rem)] flex-col items-center rounded-[2rem] bg-white/75 px-6 pt-6 ring-1 ring-white">
        <div
          className="flex min-h-[min(30vh,16rem)] max-w-full flex-wrap content-center items-end justify-center gap-x-[2vh] gap-y-[1.5vh] pb-3"
          style={{ width: `calc(${cols} * (${size} + 2vh))` }}
        >
          {Array.from({ length: r.n }, (_, i) => (
            <span key={i} className="animate-pop-in" style={{ animationDelay: `${0.15 + i * 0.22}s`, rotate: r.group ? `${((i * 37) % 13) - 6}deg` : undefined }}>
              <ThingArt id={r.thing} size={size} />
            </span>
          ))}
        </div>
        <span aria-hidden className="mb-5 h-2 w-full rounded-full bg-sky-deep/35" />
      </div>
      <div className="flex items-center justify-center gap-6">
        {r.choices.map((n) => (
          <ChoiceCard key={`${c.idx}-${n}`} c={c} k={String(n)} label={nameOf(n)} style={NUM_CARD}>
            <span className="flex flex-col items-center gap-[1.2vh]">
              <Dots n={n} size="min(2.2vh, calc(1.7*var(--vw)))" />
              <Numeral n={n} style={{ fontSize: "min(11vh, calc(8.5*var(--vw)))" }} />
            </span>
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
