"use client";

import { useMemo } from "react";
import { CubeStack } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { CompareRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, useChoice } from "../choice";
import { ThingField, thingSize } from "../ThingField";
import type { OnDone } from "../types";

/** 묻는 말 — 물건이면 "더 많을까/적을까", 숫자면 "더 클까/작을까" */
function askOf(r: CompareRound): string {
  if (r.show === "numbers") return r.ask === "more" ? LINES.compareBig : LINES.compareSmall;
  return r.ask === "more" ? LINES.compareMore : LINES.compareFewer;
}

/**
 * 더 많은 쪽·더 적은 쪽 — 두 무리 중 하나를 고른다. 누르면 그쪽 수("넷")를 먼저 읽어 준다.
 * show "numbers"(업체 B10) — 물건 대신 숫자 둘, 그 아래 그 수만큼 블록(수가 나타내는 양을 보며 크기를 비교)
 */
export function Compare({ rounds, assess, onDone }: { rounds: CompareRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [askOf(r)]), [rounds]);
  const answers = useMemo(
    () => rounds.map((r) => ((r.ask === "more") === (r.left > r.right) ? "left" : "right")),
    [rounds],
  );
  const c = useChoice({
    intro: "",
    prompts,
    answers,
    assess,
    nameOf: (k, i) => [nameOf(k === "left" ? rounds[i].left : rounds[i].right)],
    onDone,
  });
  const r = rounds[c.idx];
  const big = Math.max(r.left, r.right);
  const field = { width: "min(43vw, 22rem)", height: "min(40vh, 22rem)" };

  return (
    <ActivityFrame>
      <p key={c.idx} className="glass animate-pop-in rounded-full px-7 py-2.5 text-3xl font-extrabold short:text-2xl">
        <ReadAlong text={askOf(r)} />
      </p>
      <div className="flex items-stretch justify-center gap-[3vw]">
        {(["left", "right"] as const).map((side) => (
          <ChoiceCard key={`${c.idx}-${side}`} c={c} k={side} label={side === "left" ? "왼쪽" : "오른쪽"} className="p-2">
            {r.show === "numbers" ? (
              <span className="flex flex-col items-center justify-center gap-[2vh]" style={field}>
                <span className="font-letter font-extrabold leading-none tabular-nums" style={{ fontSize: "min(17vh, calc(13*var(--vw)))" }}>
                  {side === "left" ? r.left : r.right}
                </span>
                <CubeStack n={side === "left" ? r.left : r.right} size="min(3.6vh, calc(3*var(--vw)))" tone="butter" />
              </span>
            ) : (
              <ThingField
                thing={r.thing}
                spots={side === "left" ? r.leftSpots : r.rightSpots}
                size={thingSize(big, 0.8)}
                style={field}
                className="bg-transparent ring-0"
              />
            )}
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
