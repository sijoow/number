"use client";

import { useEffect, useState } from "react";
import { FriendTight } from "@/components/Art";
import { blockColor } from "@/curriculum/friends";
import { LINES } from "@/curriculum/lines";
import { nameOf, sinoOf } from "@/curriculum/numbers";
import type { TrainRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { starBurst } from "@/lib/stars";
import { useStep } from "@/lib/steps";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { HandHint } from "../play/HandHint";
import type { OnDone } from "../play/types";
import { TrainEngine } from "./pieces";

/**
 * 숫자 열차 — 승강장에 섞여 선 친구들을 작은 수부터 차례로 기차 칸에 태운다(업체 「숫자 열차」 흐름을 우리 그림으로, 2026-10-29 사용자).
 * 다음에 탈 칸이 반짝인다. 맞는 친구를 누르면 칸에 타며 수를 세고("셋, 넷"), 틀리면 그 친구가 흔들린다. 다 타면 칙칙폭폭 출발.
 */

/** 다 타고 떠나는 시간 */
const GO_MS = 1900;

export function NumTrain({ rounds, onDone }: { rounds: TrainRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [aboard, setAboard] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const [going, setGoing] = useState(false);
  const [misses, setMisses] = useState(0);
  const later = useTimers();
  useStep(idx, rounds.length);
  const r = rounds[idx];
  const car = `min(${r.nums.length > 4 ? 15 : 18}vh, calc(${r.nums.length > 4 ? 11.5 : 14}*var(--vw)))`;
  const friend = `calc(${car} * 0.92)`;

  useEffect(() => {
    if (idx === 0) void say(LINES.numTrain);
    return () => stopVoice();
  }, [idx]);

  const tap = (n: number) => {
    if (going || r.nums.indexOf(n) < aboard) return;
    sfx.wake();
    if (n !== r.nums[aboard]) {
      sfx.ddaeng();
      setMisses((m) => m + 1);
      setShake(n);
      later(() => setShake(null), 500);
      void say([sinoOf(n), pick(LINES.retry)]);
      return;
    }
    const next = aboard + 1;
    setAboard(next);
    sfx.pop();
    if (next < r.nums.length) {
      void say(nameOf(n));
      return;
    }
    // 다 탔다 — 출발
    sfx.dingdong();
    starBurst();
    setGoing(true);
    void say([nameOf(n), LINES.trainDepart]);
    later(() => {
      if (idx + 1 >= rounds.length) {
        onDone({ correct: Math.max(0, rounds.length - misses), total: rounds.length });
        return;
      }
      setIdx(idx + 1);
      setAboard(0);
      setGoing(false);
    }, GO_MS + 600);
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[6vh] overflow-hidden px-3 py-4">
      {/* 기차 — 기관차 옆 첫 칸부터 작은 수 */}
      <div key={idx} className="flex animate-pop-in items-end" style={{ transform: going ? "translateX(-130vw)" : undefined, transition: going ? `transform ${GO_MS}ms cubic-bezier(0.5, 0, 0.8, 0.4)` : undefined }}>
        <TrainEngine w={`calc(${car} * 0.75)`} />
        {r.nums.map((n, i) => {
          const on = i < aboard;
          const next = !going && i === aboard;
          return (
            <span key={n} className="relative ml-[0.6vw] flex flex-col items-center">
              <span className="grid place-items-end" style={{ height: `calc(${friend} * 1.02)` }}>
                {on && <FriendTight n={n} height={friend} className="animate-drop-in" />}
              </span>
              <span
                data-car={i}
                className={`block rounded-[0.9rem] ${next ? "animate-breathe ring-4 ring-brand" : ""}`}
                style={{ width: car, height: `calc(${car} * 0.42)`, background: on ? blockColor(n, 0).fill : "rgb(255 255 255 / 0.75)", border: `3px ${on ? "solid" : "dashed"} rgb(62 58 82 / 0.25)` }}
              />
              <span className="mt-[-0.4vh] flex w-full justify-around">
                <span className="block h-[2.4vh] w-[2.4vh] rounded-full bg-ink/80" />
                <span className="block h-[2.4vh] w-[2.4vh] rounded-full bg-ink/80" />
              </span>
            </span>
          );
        })}
      </div>

      {/* 승강장 — 섞여 선 친구들 */}
      <div className="flex min-h-[1px] items-end gap-[3vw] rounded-[1.6rem] bg-white/55 px-[3vw] pb-[1.5vh] pt-[1vh]">
        {r.platform.map((n) => {
          const gone = r.nums.indexOf(n) < aboard;
          return (
            <button
              key={`${idx}-${n}`}
              type="button"
              aria-label={sinoOf(n)}
              disabled={gone || going}
              onClick={() => tap(n)}
              className={`transition-transform active:scale-90 ${shake === n ? "animate-shake" : ""} ${gone ? "invisible" : ""}`}
            >
              <FriendTight n={n} height={`calc(${friend} * 1.15)`} />
            </button>
          );
        })}
      </div>
      <HandHint on={idx === 0 && aboard === 0 && misses === 0} from={`[aria-label="${sinoOf(r.nums[0])}"]`} to={`[data-car="0"]`} />
    </div>
  );
}
