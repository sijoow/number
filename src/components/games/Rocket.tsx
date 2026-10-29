"use client";

import { useEffect, useMemo, useState } from "react";
import { Cube, Numeral } from "@/components/Art";
import { SquishButton } from "@/components/ui";
import { buildAsk, LINES } from "@/curriculum/lines";
import { nameOf, range } from "@/curriculum/numbers";
import { seededRng, shuffle } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { starBurst } from "@/lib/stars";
import { useStep } from "@/lib/steps";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";

/**
 * 로켓 발사 — ① 로켓 수만큼 연료 블록을 채운다(누를 때마다 "하나, 둘…") ② 섞인 숫자 단추를 큰 수부터 거꾸로 누른다("다섯, 넷, 셋, 둘, 하나")
 * ③ 발사! 로켓이 하늘로 날아간다(업체 「로켓 발사」 흐름을 우리 그림으로, 2026-10-29 사용자 — 거꾸로 세기). 틀린 단추는 흔들리고 다시.
 * 로켓은 단순한 물건이라 CSS·SVG 로 그린다.
 */

/** 날아가는 시간 */
const FLY_MS = 1800;

export function Rocket({ rounds, onDone }: { rounds: number[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [fuel, setFuel] = useState(0);
  // 거꾸로 센 단추 수 — n 부터 하나씩
  const [down, setDown] = useState(0);
  const [stage, setStage] = useState<"fuel" | "count" | "fly">("fuel");
  const [shake, setShake] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const later = useTimers();
  useStep(idx, rounds.length);
  const n = rounds[idx];
  // 단추 차례 — 판마다 섞되 다시 그려도 그대로
  const order = useMemo(() => shuffle(range(1, n), seededRng(n * 31 + idx)), [n, idx]);
  const cube = `min(${n > 6 ? 5.4 : 7}vh, calc(${n > 6 ? 4 : 5}*var(--vw)))`;
  const body = `calc(${cube} * 2.1)`;

  useEffect(() => {
    void say(idx === 0 ? [LINES.rocket, buildAsk(rounds[0])] : [buildAsk(rounds[idx])]);
    return () => stopVoice();
  }, [idx, rounds]);

  const addFuel = () => {
    if (stage !== "fuel" || fuel >= n) return;
    sfx.wake();
    sfx.pop();
    const next = fuel + 1;
    setFuel(next);
    if (next < n) {
      void say(nameOf(next));
      return;
    }
    sfx.ding();
    setStage("count");
    void say([nameOf(next), LINES.countdown]);
  };

  const tapNum = (k: number) => {
    if (stage !== "count" || k > n - down) return;
    sfx.wake();
    if (k !== n - down) {
      sfx.ddaeng();
      setMisses((m) => m + 1);
      setShake(k);
      later(() => setShake(null), 500);
      void say([nameOf(k), pick(LINES.retry)]);
      return;
    }
    sfx.tick();
    const next = down + 1;
    setDown(next);
    if (next < n) {
      void say(nameOf(k));
      return;
    }
    // 하나까지 셌다 — 발사!
    setStage("fly");
    sfx.cheer();
    starBurst();
    void say([nameOf(k), LINES.liftoff]);
    later(() => {
      if (idx + 1 >= rounds.length) {
        onDone({ correct: Math.max(0, rounds.length - misses), total: rounds.length });
        return;
      }
      setIdx(idx + 1);
      setFuel(0);
      setDown(0);
      setStage("fuel");
    }, FLY_MS + 700);
  };

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-[6vw] overflow-hidden px-4 py-4 portrait:flex-col portrait:gap-[3vh]">
      {/* 로켓 — 연료 칸(아래부터), 거꾸로 셀 때는 위 칸부터 꺼진다 */}
      <div
        key={idx}
        className="flex animate-pop-in flex-col items-center"
        style={{ transform: stage === "fly" ? "translateY(-130vh)" : undefined, transition: stage === "fly" ? `transform ${FLY_MS}ms cubic-bezier(0.55, 0, 0.9, 0.5) 250ms` : undefined }}
      >
        <svg viewBox="0 0 100 60" style={{ width: `calc(${body} * 1.05)` }} aria-hidden>
          <path d="M50 2 C 72 16, 92 40, 96 58 L4 58 C 8 40, 28 16, 50 2 Z" fill="#ef6a6a" />
        </svg>
        <div
          className="relative flex flex-col items-center rounded-b-[1.4rem] bg-white shadow-[inset_-0.6rem_0_0_rgb(62_58_82/0.08)]"
          style={{ width: body, padding: `calc(${cube} * 0.2) calc(${cube} * 0.3) calc(${cube} * 0.3)` }}
        >
          <span className="grid place-items-center rounded-full bg-sky-deep text-white" style={{ width: `calc(${cube} * 1.25)`, height: `calc(${cube} * 1.25)`, marginBottom: `calc(${cube} * 0.2)` }}>
            <Numeral n={n} style={{ fontSize: `calc(${cube} * 0.8)` }} />
          </span>
          <span className="flex flex-col-reverse items-center" style={{ gap: `calc(${cube} * 0.12)` }}>
            {range(1, n).map((k) => {
              const filled = k <= fuel;
              // 거꾸로 셀 때 — 센 만큼 위 칸부터 반짝 꺼진다
              const spent = k > n - down;
              return filled ? (
                <Cube key={k} size={cube} tone={spent ? "butter" : "mint"} lit={spent} className="animate-drop-in" />
              ) : (
                <span key={k} className="block rounded-[22%] border-[3px] border-dashed border-ink/25" style={{ width: cube, height: cube }} />
              );
            })}
          </span>
          {/* 날개 */}
          <svg viewBox="0 0 140 50" className="absolute -bottom-[0.5%] left-1/2 -translate-x-1/2" style={{ width: `calc(${body} * 1.7)` }} aria-hidden>
            <path d="M22 0 L0 50 L30 50 Z M118 0 L140 50 L110 50 Z" fill="#4fa8e6" />
          </svg>
        </div>
        {/* 불꽃 — 날아갈 때 */}
        <svg viewBox="0 0 60 70" style={{ width: `calc(${body} * 0.6)` }} className={stage === "fly" ? "animate-breathe" : "invisible"} aria-hidden>
          <path d="M30 70 C 10 46, 6 22, 16 0 L44 0 C 54 22, 50 46, 30 70 Z" fill="#f5a742" />
          <path d="M30 56 C 20 40, 18 22, 22 0 L38 0 C 42 22, 40 40, 30 56 Z" fill="#f5cd36" />
        </svg>
      </div>

      {/* 연료 넣기 → 거꾸로 세기 단추 */}
      {stage === "fuel" ? (
        <SquishButton tone="mint" aria-label="연료 블록 넣기" onClick={addFuel} className="flex animate-pop-in flex-col items-center gap-2 rounded-[2rem] px-8 py-5">
          <span className="flex items-center gap-2 text-[min(8vh,calc(5.5*var(--vw)))] font-black leading-none">
            +<Cube size="min(8vh, calc(5.5*var(--vw)))" tone="mint" />
          </span>
          <span className="text-xl font-extrabold">연료 넣기</span>
        </SquishButton>
      ) : (
        <div className="grid animate-pop-in gap-[2vh] portrait:gap-[2vw]" style={{ gridTemplateColumns: `repeat(${n > 5 ? Math.ceil(n / 2) : n}, auto)` }}>
          {order.map((k) => {
            const done = k > n - down;
            return (
              <SquishButton
                key={k}
                tone={done ? "mint" : "card"}
                aria-label={nameOf(k)}
                disabled={done || stage === "fly"}
                onClick={() => tapNum(k)}
                className={`grid place-items-center rounded-[1.6rem] ${shake === k ? "animate-shake" : ""} ${done ? "opacity-50" : ""}`}
                style={{ width: "min(15vh, calc(11*var(--vw)))", height: "min(15vh, calc(11*var(--vw)))" }}
              >
                <Numeral n={k} style={{ fontSize: "min(9vh, calc(7*var(--vw)))" }} />
              </SquishButton>
            );
          })}
        </div>
      )}
    </div>
  );
}
