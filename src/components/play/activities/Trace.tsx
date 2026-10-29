"use client";

import { useEffect, useState } from "react";
import { StrokeBoard, strokeBoardWidth } from "@/components/StrokeBoard";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { Dots } from "../Dots";
import type { OnDone } from "../types";

/**
 * 숫자 따라 쓰기 — 업체 따라쓰기처럼 노란 펜 머리에서 시작해 획 길을 따라 긋는다(components/StrokeBoard — 길 밖으로는 칠해지지 않는다,
 * 2026-10-29 사용자). 다 쓰면 정답 별 + 칭찬, 잠시 뒤 저절로 다음 숫자(버튼 없음). 10~20 은 두 자리라 넓게.
 * 옆에는 그 수만큼 노란 점(업체 따라쓰기처럼 — 숫자 모양과 양을 같이 본다)
 */
export function Trace({ digits, onDone }: { digits: number[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const later = useTimers();
  const d = digits[idx];
  const text = String(d);

  useEffect(() => {
    void say([LINES.trace, nameOf(digits[0])]);
    return () => stopVoice();
  }, [digits]);

  const success = () => {
    sfx.cheer();
    void say(pick(LINES.praise));
    later(() => {
      if (idx + 1 >= digits.length) {
        onDone({ correct: 0, total: 0 });
        return;
      }
      setIdx(idx + 1);
      void say(nameOf(digits[idx + 1]));
    }, 1500);
  };

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-8 px-6 py-4 portrait:flex-col portrait:gap-5 portrait:px-4">
      <StrokeBoard key={idx} text={text} width={strokeBoardWidth(text.length)} onSuccess={success} />
      <div className="flex flex-col items-center gap-5 portrait:flex-row portrait:flex-wrap portrait:justify-center portrait:gap-3">
        <span key={idx} className="animate-pop-in rounded-[1.4rem] bg-white/85 px-4 py-3">
          <Dots n={d} size="min(3.6vh, calc(2.6*var(--vw)))" />
        </span>
        <span className="rounded-full bg-card px-6 py-2 text-3xl shadow-[0_5px_0_var(--paper-deep)]">{nameOf(d)}</span>
        <div className="flex gap-2">
          {digits.map((it, i) => (
            <span key={`${it}-${i}`} className={`h-4 rounded-full ${i === idx ? "w-10 bg-brand" : i < idx ? "w-4 bg-butter-deep" : "w-4 bg-paper-deep"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
