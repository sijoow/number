"use client";

import { useEffect, useState } from "react";
import { FriendTight, Numeral } from "@/components/Art";
import { LINES } from "@/curriculum/lines";
import { nameOf, range } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { HideRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useStep } from "@/lib/steps";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { Bush } from "./pieces";

/**
 * 숨은 친구 찾기 — 양 끝(0 과 끝 수)만 적힌 수직선의 덤불 하나 뒤에 친구가 숨었다(업체 「탈리를 잡아라」 흐름을 우리 그림으로, 2026-10-29 사용자).
 * "셋, 어디 있을까?" — 0 부터 세어서 그 자리 덤불을 누르면 친구가 튀어나온다. 틀린 덤불을 누르면 그 자리 수가 보이고(세는 데 도움) 다시.
 * 두 번 틀리면 맞는 덤불이 숨 쉬듯 커졌다 작아진다.
 */

const LINE_W = "min(92vw, 62rem)";

export function HideLine({ rounds, onDone }: { rounds: HideRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [tried, setTried] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [found, setFound] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  useStep(idx, rounds.length);
  const r = rounds[idx];
  const bush = `min(17vh, calc(${LINE_W} / ${r.end + 1} * 0.9))`;

  useEffect(() => {
    const ask = [nameOf(rounds[idx].n), LINES.whereIs];
    void say(idx === 0 ? [LINES.hideLine, ...ask] : ask);
    return () => stopVoice();
  }, [idx, rounds]);

  const tap = (k: number) => {
    if (found || tried.includes(k)) return;
    sfx.wake();
    const alive = turn();
    if (k === r.n) {
      const s = tried.length === 0 ? score + 1 : score;
      setScore(s);
      setFound(true);
      void answerFeedback({ name: [LINES.found], right: true, then: [pick(LINES.praise)], alive }).then((ok) => {
        if (!ok) return;
        later(() => {
          if (idx + 1 >= rounds.length) {
            onDone({ correct: s, total: rounds.length });
            return;
          }
          setIdx(idx + 1);
          setTried([]);
          setFound(false);
        }, 600);
      });
      return;
    }
    setTried([...tried, k]);
    setShake(k);
    later(() => setShake(null), 500);
    void answerFeedback({ name: [nameOf(k)], right: false, then: [pick(LINES.retry)], alive });
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[5vh] px-3 py-4">
      {/* 찾을 친구 */}
      <div key={idx} className="glass flex animate-pop-in items-center gap-3 rounded-full py-2 pl-3 pr-6">
        <FriendTight n={r.n} height="min(14vh, 6rem)" />
        <Numeral n={r.n} className="text-brand" style={{ fontSize: "min(9vh, 3.6rem)" }} />
        <span className="text-2xl font-extrabold">어디 있을까?</span>
      </div>

      {/* 수직선 — 칸마다 덤불, 양 끝만 수가 적혀 있다 */}
      <div className="relative" style={{ width: LINE_W }}>
        <div className="flex items-end justify-between">
          {range(0, r.end).map((k) => {
            const end = k === 0 || k === r.end;
            const here = found && k === r.n;
            const shown = end || here || tried.includes(k);
            return (
              <div key={k} className="flex flex-col items-center" style={{ width: `calc(${LINE_W} / ${r.end + 1})` }}>
                {end ? (
                  <span style={{ height: `calc(${bush} * 0.7)` }} />
                ) : (
                  <button
                    type="button"
                    aria-label={`${k}번째 덤불`}
                    onClick={() => tap(k)}
                    className={`relative grid place-items-end transition-transform active:scale-90 ${shake === k ? "animate-shake" : ""} ${!found && tried.length >= 2 && k === r.n ? "animate-breathe" : ""}`}
                  >
                    {here && (
                      <span className="absolute bottom-[45%] left-1/2 -translate-x-1/2 animate-pop-in">
                        <FriendTight n={r.n} height={`calc(${bush} * 1.7)`} />
                      </span>
                    )}
                    <Bush size={bush} className="relative" />
                  </button>
                )}
                <span className="block h-[2.2vh] w-[5px] rounded-full bg-ink/70" />
                <span className={`mt-1 h-[1.2em] font-letter font-extrabold leading-none ${here ? "animate-pop-in text-brand" : end ? "text-ink" : "text-ink-soft"}`} style={{ fontSize: "min(6vh, 2.4rem)" }}>
                  {shown ? k : ""}
                </span>
              </div>
            );
          })}
        </div>
        {/* 선 — 첫 칸 가운데부터 끝 칸 가운데까지 */}
        <span
          aria-hidden
          className="pointer-events-none absolute h-[6px] rounded-full bg-ink/70"
          style={{ left: `calc(${LINE_W} / ${(r.end + 1) * 2})`, right: `calc(${LINE_W} / ${(r.end + 1) * 2})`, bottom: "calc(min(6vh, 2.4rem) * 1.2 + 0.25rem + 1.1vh)" }}
        />
      </div>
    </div>
  );
}
