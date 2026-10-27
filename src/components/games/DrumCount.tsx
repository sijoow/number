"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CubeStack, FriendArt } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { SquishButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { DrumRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { say } from "@/lib/voice";
import { ChoiceCard, NUM_CARD, NUM_FONT, useChoice } from "../play/choice";
import type { OnDone } from "../play/types";
import { Drum } from "./pieces";

const BEAT = 650;

/**
 * 한 판의 북 — 판이 바뀌면 key 로 새로 만든다(그래서 처음엔 늘 '듣는 중'). 첫 판은 안내를 다 듣고 나서 친다.
 * 상태는 타이머가 바꾼다 — 북 n 번, 다 치면 "몇 번 쳤을까?". 「다시 듣기」로 또.
 */
function Beats({ n, intro, drummer, settled }: { n: number; intro: boolean; drummer: number; settled: boolean }) {
  const [hit, setHit] = useState(0);
  const [playing, setPlaying] = useState(true);
  const later = useTimers();
  const seq = useRef(0);

  const run = useCallback(
    async (withIntro: boolean) => {
      const mine = ++seq.current;
      if (withIntro) await say(LINES.drum);
      if (mine !== seq.current) return;
      for (let i = 0; i < n; i++) {
        later(() => {
          if (mine !== seq.current) return;
          sfx.drum();
          setHit(i + 1);
        }, 400 + i * BEAT);
      }
      later(() => {
        if (mine !== seq.current) return;
        setPlaying(false);
        void say(LINES.drumQ);
      }, 400 + n * BEAT + 250);
    },
    [n, later],
  );

  useEffect(() => {
    void run(intro);
  }, [run, intro]);

  const drum = "min(26vh, calc(20*var(--vw)))";

  return (
    <>
      <p className="glass rounded-full px-6 py-2 text-2xl font-extrabold">
        <ReadAlong text={playing ? "잘 들어 봐!" : LINES.drumQ} />
      </p>
      <div className="flex items-end justify-center gap-[3vw]">
        <FriendArt key={`f${hit}`} n={drummer} height={drum} className={hit ? "animate-wiggle" : ""} />
        <Drum size={drum} hit={hit} />
        {settled && (
          <span className="flex animate-pop-in flex-col items-center gap-2">
            <CubeStack n={n} size="min(5vh, calc(4.2*var(--vw)))" tone="butter" />
            <span className="font-letter text-4xl font-extrabold text-brand">{n}</span>
          </span>
        )}
      </div>
      <SquishButton
        tone="sky"
        onClick={() => {
          setPlaying(true);
          setHit(0);
          void run(false);
        }}
        disabled={playing || settled}
        className="rounded-full px-6 py-3 text-xl"
      >
        다시 듣기
      </SquishButton>
    </>
  );
}

/**
 * 북소리 세기 — 친구가 북을 친다. 몇 번 쳤는지 귀로 세고 숫자를 고른다(여섯까지).
 * 북은 일(1)이 친다 — 답을 친구 모습으로 알 수 없게. 맞히면 친 횟수만큼 블록이 보인다.
 */
export function DrumCount({ rounds, drummer, onDone }: { rounds: DrumRound[]; drummer: number; onDone: OnDone }) {
  // 묻는 말은 북을 다 친 뒤에 Beats 가 한다 — 판이 바뀔 때 choice 틀은 아무 말도 하지 않게 빈 줄
  const prompts = useMemo(() => rounds.map(() => [] as string[]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.n)), [rounds]);
  const c = useChoice({ intro: "", prompts, answers, assess: false, nameOf: (k) => [nameOf(Number(k))], onDone });
  const r = rounds[c.idx];

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[2.5vh] px-4 py-4">
      <Beats key={c.idx} n={r.n} intro={c.idx === 0} drummer={drummer} settled={c.settled} />
      <div className="flex flex-wrap items-center justify-center gap-4">
        {r.choices.map((n) => (
          <ChoiceCard key={`${c.idx}-${n}`} c={c} k={String(n)} label={nameOf(n)} style={NUM_CARD}>
            <span className="font-letter font-extrabold leading-none tabular-nums" style={NUM_FONT}>
              {n}
            </span>
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}
