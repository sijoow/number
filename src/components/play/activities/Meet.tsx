"use client";

import { useEffect, useState } from "react";
import { CubeStack, FriendArt, Numeral } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { SpeechBubble } from "@/components/ui";
import { LINES, meetAlso, meetBlocks, meetHello, meetIntro } from "@/curriculum/lines";
import { nameOf, SAY_BOTH_IN_MEET, sinoOf } from "@/curriculum/numbers";
import { sfx } from "@/lib/sfx";
import { say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

/*
 * 숫자 친구 만나기 — 친구가 인사하고("안녕! 나는 셋이야.") 성격을 소개한 뒤("나는 재주꾼이야! …"), 아이가 친구 블록을 하나씩 눌러 센다("하나, 둘, 셋").
 * 다 세면 "셋! 블록이 세 개야." + 숫자 모양 3 을 크게 보여 준다. 점수 없는 놀이.
 */

export function Meet({ n, onDone }: { n: number; onDone: OnDone }) {
  const [lit, setLit] = useState(-1);
  const done = lit >= n - 1;
  const hello = meetHello(n);
  const intro = meetIntro(n);
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    void say([hello, intro, LINES.meetCount].filter(Boolean));
    return () => stopVoice();
  }, [hello, intro]);

  const tap = () => {
    if (done) return;
    sfx.wake();
    sfx.pop();
    const next = lit + 1;
    setLit(next);
    if (next >= n - 1) {
      const text = meetBlocks(n);
      setLine(text);
      sfx.cheer();
      // "셋! 블록이 세 개야." → "숫자는 이렇게 생겼어!" → 이름 "삼!" → "셋이라고도 해."(두 읽기)
      void say([nameOf(next + 1), text, LINES.meetShape, ...(SAY_BOTH_IN_MEET ? [sinoOf(n), meetAlso(n)] : [])]);
    } else void say(nameOf(next + 1));
  };

  const cube = `min(${n <= 5 ? 8.5 : 7}vh, calc(${n <= 5 ? 8 : 6.5}*var(--vw)))`;

  return (
    <ActivityFrame>
      <SpeechBubble tail="down" className="max-w-[min(90vw,32rem)] portrait:text-2xl">
        {line ? (
          <ReadAlong text={line} />
        ) : (
          <>
            <ReadAlong text={hello} />
            {intro && (
              <span className="mt-1 block text-[0.85em] font-semibold">
                <ReadAlong text={intro} />
              </span>
            )}
          </>
        )}
      </SpeechBubble>
      <div className="flex items-end justify-center gap-[5vw] portrait:gap-[6vw]">
        <FriendArt n={n} height="min(34vh, calc(30*var(--vw)))" className="animate-float" />
        <button type="button" onClick={tap} aria-label="블록 세기" className="flex flex-col items-center gap-2 rounded-[2rem] bg-white/70 p-4 ring-1 ring-white" disabled={done}>
          <CubeStack n={n} size={cube} tone="butter" lit={lit} />
          <span className="min-h-10 font-letter text-3xl font-extrabold text-ink short:min-h-6 short:text-xl">{lit >= 0 ? nameOf(lit + 1) : "톡!"}</span>
        </button>
      </div>
      {done ? (
        <div className="flex animate-pop-in items-center gap-6">
          <span className="grid place-items-center rounded-[2.4rem] bg-white px-10 py-3 shadow-[0_8px_0_var(--paper-deep)]">
            <Numeral n={n} className="text-brand" style={{ fontSize: "min(20vh, calc(15*var(--vw)))" }} />
          </span>
          <button type="button" className="cta rounded-full px-10 py-4 text-3xl font-extrabold" onClick={() => onDone({ correct: 0, total: 0 })}>
            좋아!
          </button>
        </div>
      ) : (
        <p className="glass rounded-full px-6 py-2 text-xl font-bold text-ink-soft">블록을 하나씩 눌러 세어 봐요</p>
      )}
    </ActivityFrame>
  );
}
