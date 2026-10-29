"use client";

import { useMemo } from "react";
import { FriendTight, Numeral, ThingArt } from "@/components/Art";
import { usePortrait } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { MealRound } from "@/lib/originals";
import { ChoiceCard, useChoice } from "../play/choice";
import type { OnDone } from "../play/types";
import { Plate } from "./pieces";

/**
 * 식사 시간 — 두 친구 앞 접시에 먹을 것이 있다. "어느 쪽이 더 많을까?" 더 많은 접시를 누르거나, 같으면 가운데 「똑같아」
 * (업체 「식사 시간」처럼 같다도 답, 우리 그림으로 — 2026-10-29 사용자). 맞히면 접시 아래에 수가 나온다.
 */

/** 접시 위 자리 — 넷까지는 둘씩, 다섯부터 셋씩 */
function Food({ id, n, size }: { id: string; n: number; size: string }) {
  return (
    <span className="grid place-items-center gap-[0.4vh]" style={{ gridTemplateColumns: `repeat(${n <= 2 ? n : n <= 4 ? 2 : 3}, auto)` }}>
      {Array.from({ length: n }, (_, i) => (
        <ThingArt key={i} id={id} size={size} />
      ))}
    </span>
  );
}

export function Meal({ rounds, onDone }: { rounds: MealRound[]; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map(() => [LINES.compareMore]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => (r.left === r.right ? "same" : r.left > r.right ? "left" : "right")), [rounds]);
  const c = useChoice({
    intro: LINES.meal,
    prompts,
    answers,
    assess: false,
    nameOf: (k, i) => (k === "same" ? [LINES.same] : [nameOf(k === "left" ? rounds[i].left : rounds[i].right)]),
    onDone,
  });
  const r = rounds[c.idx];
  // 세로 화면은 접시 둘을 한 줄에 크게, 「똑같아」는 그 아래로
  const portrait = usePortrait();
  const plate = portrait ? "min(28vh, 43vw)" : "min(34vh, calc(24*var(--vw)))";
  // 먹을 것 크기 — 적으면 크게(접시 안쪽 동그라미에 들어가게)
  const food = (n: number) => `calc(${plate} * ${n <= 2 ? 0.3 : n <= 4 ? 0.27 : 0.21})`;

  const side = (k: "left" | "right", friend: number, n: number) => (
    <div className="flex flex-col items-center">
      <FriendTight n={friend} height="min(22vh, calc(14*var(--vw)))" className="-mb-[2vh]" />
      <ChoiceCard c={c} k={k} label={`${k === "left" ? "왼쪽" : "오른쪽"} 접시`} style={{ width: plate, height: plate }}>
        <span className="relative grid place-items-center" style={{ width: `calc(${plate} * 0.92)`, height: `calc(${plate} * 0.92)` }}>
          <Plate size={`calc(${plate} * 0.92)`} className="absolute inset-0" />
          <span className="relative">
            <Food id={r.food} n={n} size={food(n)} />
          </span>
        </span>
      </ChoiceCard>
      <span className={`mt-1 h-[1.1em] font-letter font-extrabold leading-none ${c.settled ? "animate-pop-in" : "opacity-0"}`} style={{ fontSize: "min(8vh, 3rem)" }}>
        {n}
      </span>
    </div>
  );

  return (
    <div key={c.idx} className="flex min-h-full animate-pop-in items-center justify-center-safe gap-[3vw] px-3 py-4 portrait:flex-wrap portrait:content-center portrait:gap-x-[3vw] portrait:gap-y-[4vh]">
      {side("left", r.friends[0], r.left)}
      <ChoiceCard c={c} k="same" label="똑같아" className="flex-col gap-1 px-4 py-3 portrait:order-last" style={{ width: portrait ? "min(16vh, 34vw)" : "min(18vh, calc(13*var(--vw)))" }}>
        <Numeral n="=" style={{ fontSize: "min(10vh, calc(7*var(--vw)))" }} />
        <span className="text-lg font-extrabold whitespace-nowrap">똑같아</span>
      </ChoiceCard>
      {side("right", r.friends[1], r.right)}
    </div>
  );
}
