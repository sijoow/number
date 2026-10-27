"use client";

import { useMemo } from "react";
import { ShapeArt } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { LINES, sizeName } from "@/curriculum/lines";
import type { SizeRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, useChoice } from "../choice";
import type { OnDone } from "../types";

const askOf = (r: SizeRound) => (r.ask === "bigger" ? LINES.sizeBigger : LINES.sizeSmaller);

/** 크기 비교 — 같은 모양 둘 중 "어느 것이 더 클까?/작을까?"(업체 A9). 누르면 "큰 세모"처럼 읽어 준다 */
export function SizeCompare({ rounds, assess, onDone }: { rounds: SizeRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [askOf(r)]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => ((r.ask === "bigger") === (r.left.scale > r.right.scale) ? "left" : "right")), [rounds]);
  const c = useChoice({
    intro: "",
    prompts,
    answers,
    assess,
    nameOf: (k, i) => {
      const r = rounds[i];
      const [mine, other] = k === "left" ? [r.left, r.right] : [r.right, r.left];
      return [sizeName(r.shape, mine.scale > other.scale)];
    },
    onDone,
  });
  const r = rounds[c.idx];
  // 세로 폰에서도 카드 둘이 한 줄에
  const card = { width: "min(36vh, calc(28*var(--vw)))", height: "min(36vh, calc(28*var(--vw)))" };
  const full = "min(29vh, calc(22*var(--vw)))";

  return (
    <ActivityFrame>
      <p key={c.idx} className="glass animate-pop-in rounded-full px-7 py-2.5 text-3xl font-extrabold short:text-2xl">
        <ReadAlong text={askOf(r)} />
      </p>
      <div className="flex items-center justify-center gap-[3vw]">
        {(["left", "right"] as const).map((side) => (
          <ChoiceCard key={`${c.idx}-${side}`} c={c} k={side} label={side === "left" ? "왼쪽" : "오른쪽"} style={card}>
            <ShapeArt shape={r.shape} color={r[side].color} size={`calc(${full} * ${r[side].scale.toFixed(2)})`} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
