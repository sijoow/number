"use client";

import { useMemo } from "react";
import { FriendArt, Numeral } from "@/components/Art";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { EggRound } from "@/lib/originals";
import { ChoiceCard, NUM_CARD, NUM_FONT, useChoice } from "../play/choice";
import type { OnDone } from "../play/types";
import { Egg } from "./pieces";

/**
 * 알 속 숫자 — 알 넷에 차례로 이어진 수가 적혀 있고 하나가 ?(업체 「뛰어 세기」 흐름을 우리 그림으로, 2026-10-29 사용자).
 * 아래 숫자 카드 셋 중 ? 에 올 수를 누르면 그 알이 깨지고 그 숫자 친구가 나온다. 틀린 카드는 흐려지고 다시(보기 놀이 틀 useChoice).
 */

const EGG_COLORS = ["#fff3c4", "#dff5e6", "#e2f0ff", "#ffe6dc"] as const;

export function EggNumber({ rounds, onDone }: { rounds: EggRound[]; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map(() => [LINES.eggsQ]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.nums[r.gap])), [rounds]);
  const c = useChoice({ intro: LINES.eggs, prompts, answers, assess: false, nameOf: (k) => [nameOf(Number(k))], onDone });
  const r = rounds[c.idx];
  const egg = `min(24vh, calc(${r.nums.length > 3 ? 15 : 19}*var(--vw)))`;

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[5vh] px-4 py-4 portrait:gap-[4vh] portrait:px-2">
      <div key={c.idx} className="flex animate-pop-in items-end gap-[2.5vw] rounded-[2rem] bg-white/60 px-[3vw] pb-[2vh] pt-[3vh] ring-1 ring-white">
        {r.nums.map((n, i) => {
          const gap = i === r.gap;
          const hatched = gap && c.settled;
          return (
            <span key={i} className="relative grid place-items-center" style={{ width: egg, height: `calc(${egg} * 1.2)` }}>
              {hatched ? (
                <>
                  {/* 깨진 껍데기 위로 친구가 나온다 */}
                  <span className="absolute bottom-[18%] left-1/2 -translate-x-1/2 animate-pop-in">
                    <FriendArt n={n} height={`calc(${egg} * 1.05)`} />
                  </span>
                  <Egg size={egg} fill={EGG_COLORS[i % EGG_COLORS.length]} open className="relative" />
                </>
              ) : (
                <>
                  <Egg size={egg} fill={EGG_COLORS[i % EGG_COLORS.length]} className={gap ? "animate-breathe" : ""} />
                  <span className="absolute inset-x-0 top-[38%] grid place-items-center">
                    {gap ? (
                      <span className="font-letter font-extrabold leading-none text-brand" style={{ fontSize: `calc(${egg} * 0.5)` }}>
                        ?
                      </span>
                    ) : (
                      <Numeral n={n} className="text-ink" style={{ fontSize: `calc(${egg} * 0.5)` }} />
                    )}
                  </span>
                </>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-[3vw]">
        {r.choices.map((n) => (
          <ChoiceCard key={`${c.idx}-${n}`} c={c} k={String(n)} label={nameOf(n)} style={NUM_CARD}>
            <Numeral n={n} style={NUM_FONT} />
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}
