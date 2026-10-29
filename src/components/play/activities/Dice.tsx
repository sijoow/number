"use client";

import { useMemo } from "react";
import { Numeral } from "@/components/Art";
import { Die } from "@/components/games/pieces";
import { SpeakerButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { DiceRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, useChoice } from "../choice";
import { HandHint } from "../HandHint";
import { HeldGhost, useDragPick } from "../dragPick";
import type { OnDone } from "../types";

// 판을 넉넉히 — 업체 판처럼 화면을 채우게(2026-10-29)
const DIE = "min(18vh, calc(13*var(--vw)))";

/**
 * 주사위 찾기 — "셋! 주사위를 찾아서 칸에 넣어 봐!" 눈이 그 수인 주사위를 빈 칸에 끌어다 놓는다(업체 「도미노 산수」).
 * 작은 수부터 차례로. 끌기가 어려우면 주사위를 눌러도 된다.
 */
export function Dice({ rounds, assess, onDone }: { rounds: DiceRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [nameOf(r.n), LINES.diceQ]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.n)), [rounds]);
  const c = useChoice({ intro: LINES.dice, prompts, answers, assess, nameOf: (k) => [nameOf(Number(k))], onDone });
  const r = rounds[c.idx];
  const { held, begin } = useDragPick<number>((face, zone, tapped) => {
    if (tapped || zone === "die-slot") c.choose(String(face));
  });

  return (
    <ActivityFrame>
      <div key={c.idx} className="flex w-[min(94vw,56rem)] animate-pop-in items-center justify-center gap-[6vw] rounded-[2rem] bg-mint px-8 py-[3vh] ring-4 ring-white/80">
        <div className="flex flex-col items-center gap-2">
          <Numeral n={r.n} className="text-ink" style={{ fontSize: "min(16vh, calc(12*var(--vw)))" }} />
          <SpeakerButton text={prompts[c.idx]} size={64} tone="card" />
        </div>
        <span
          data-drop="die-slot"
          className={`grid place-items-center rounded-[1.6rem] border-4 border-dashed transition-colors ${held?.over === "die-slot" ? "border-brand bg-white" : "border-mint-deep bg-white/50"}`}
          style={{ width: `calc(${DIE} * 1.25)`, height: `calc(${DIE} * 1.25)` }}
        >
          {c.settled && <Die face={r.n} size={DIE} className="animate-pop-in" />}
        </span>
      </div>
      <div className="flex items-center justify-center gap-6">
        {r.choices.map((face) => (
          <ChoiceCard
            key={`${c.idx}-${face}`}
            c={c}
            k={String(face)}
            label={`주사위 ${nameOf(face)}`}
            drag={begin(face)}
            className={held?.moved && held.item === face ? "opacity-30" : ""}
            style={{ width: `calc(${DIE} * 1.3)`, height: `calc(${DIE} * 1.3)` }}
          >
            <Die face={face} size={DIE} />
          </ChoiceCard>
        ))}
      </div>
      <HeldGhost held={held}>{(face) => <Die face={face} size={DIE} />}</HeldGhost>
      <HandHint on={c.idx === 0 && !c.settled} from={`[aria-label="주사위 ${nameOf(r.n)}"]`} to={`[data-drop="die-slot"]`} />
    </ActivityFrame>
  );
}
