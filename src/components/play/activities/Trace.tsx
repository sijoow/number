"use client";

import { useEffect, useState } from "react";
import { boardWidth, TraceBoard, useBoardKey } from "@/components/TraceBoard";
import { SquishButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../types";

/** 숫자 따라 쓰기 — 연한 숫자 위를 손가락으로 따라 쓴다(판은 한글나라 TraceBoard 그대로, 10~20 은 두 자리라 넓게) */
export function Trace({ digits, onDone }: { digits: number[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [key, erase] = useBoardKey();
  const [done, setDone] = useState(false);
  const later = useTimers();
  const d = digits[idx];
  const text = String(d);
  const wide = text.length > 1;

  useEffect(() => {
    void say([LINES.trace, nameOf(digits[0])]);
    return () => stopVoice();
  }, [digits]);

  const success = () => {
    setDone(true);
    sfx.cheer();
    void say(pick(LINES.praise));
    later(() => {
      if (idx + 1 >= digits.length) {
        onDone({ correct: 0, total: 0 });
        return;
      }
      setIdx(idx + 1);
      setDone(false);
      void say(nameOf(digits[idx + 1]));
    }, 1500);
  };

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-8 px-6 py-4 portrait:flex-col portrait:gap-5 portrait:px-4">
      <TraceBoard
        key={`${idx}-${key}`}
        text={text}
        aspect={wide ? 1.5 : 1}
        width={wide ? boardWidth(1.5, 92, 16) : "min(66vh, calc(60*var(--vw)))"}
        onSuccess={success}
      />
      <div className="flex flex-col items-center gap-5 portrait:flex-row portrait:flex-wrap portrait:justify-center portrait:gap-3">
        <span className="rounded-full bg-card px-6 py-2 text-3xl shadow-[0_5px_0_var(--paper-deep)]">{nameOf(d)}</span>
        <SquishButton
          tone="butter"
          className="whitespace-nowrap rounded-full px-7 py-4 text-3xl"
          disabled={done}
          onClick={() => {
            sfx.tick();
            erase();
          }}
        >
          지우기
        </SquishButton>
        <div className="flex gap-2">
          {digits.map((it, i) => (
            <span key={`${it}-${i}`} className={`h-4 rounded-full ${i === idx ? "w-10 bg-brand" : i < idx ? "w-4 bg-butter-deep" : "w-4 bg-paper-deep"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
