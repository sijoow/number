"use client";

import { useEffect, useState } from "react";
import { ThingArt } from "@/components/Art";
import { SquishButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { countUp, nameOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { FarmRound } from "@/lib/rounds";
import { useStep } from "@/lib/steps";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../types";

/*
 * 작은 농장 — 「시작」을 누르면 동물이 하나씩 헛간에 들어간다. 다 들어가면 헛간 문에 "?" 가 붙고 카드 둘(동물 그림 수) 중에 고른다.
 * 맞으면 헛간 앞판이 위로 들리며 안의 동물을 하나, 둘 세어 보여 주고, 동물들이 걸어 나간다(업체 판 그대로). 동물은 판마다 양·소·돼지·병아리(2026-10-29).
 * 틀리면 다시(한 번 틀리면 정답 카드가 숨쉬기). 도장 놀이는 틀려도 헛간을 열어 보여 주고 다음 — 점수는 첫 시도만.
 */

type Phase = "ready" | "walk" | "ask" | "open" | "leave";

/** 동물 하나가 걸어 들어가는 데 걸리는 틈(ms) — 앞 동물이 거의 들어간 뒤 다음 동물(2026-10-29 사용자: 너무 빨리 달린다) */
const STEP = 1700;
/** 걸어 들어가는 데 걸리는 시간(globals.css walk-in) — 문 앞에 닿는 건 그 82% */
const WALK_MS = 1900;
/** 헛간에서 걸어 나가는 시간 */
const LEAVE_MS = 2000;
const CHICK = "min(14vh, calc(9*var(--vw)))";

/** 헛간 — 안쪽(갈색)과 앞판(빨강, 흰 X 문)을 따로 그려 앞판만 들어 올린다 */
function BarnInside() {
  return (
    <svg viewBox="0 0 200 190" className="absolute inset-0 h-full w-full" aria-hidden>
      <path d="M12 72 L100 12 L188 72 L188 188 L12 188 Z" fill="#8a4f33" />
      <path d="M26 82 L100 32 L174 82 L174 188 L26 188 Z" fill="#a8643f" />
      <rect x="26" y="160" width="148" height="28" fill="#7a4329" />
    </svg>
  );
}

function BarnFront({ ask }: { ask: boolean }) {
  return (
    <svg viewBox="0 0 200 190" className="absolute inset-0 h-full w-full drop-shadow-[0_8px_10px_rgb(62_58_82/0.25)]" aria-hidden>
      <path d="M12 72 L100 12 L188 72 L188 188 L12 188 Z" fill="#ef5f5a" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
      <path d="M70 52 L100 34 L130 52 Z" fill="#fff" opacity="0.85" />
      <rect x="54" y="92" width="92" height="96" fill="#e14b47" stroke="#fff" strokeWidth="6" />
      <path d="M57 95 L143 185 M143 95 L57 185" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      {ask && (
        <g>
          <rect x="70" y="104" width="60" height="64" rx="8" fill="#5b3324" stroke="#fff" strokeWidth="4" />
          <text x="100" y="152" textAnchor="middle" fontSize="50" fontWeight="900" fill="#ffd34d">
            ?
          </text>
        </g>
      )}
    </svg>
  );
}

/** 카드 그림 — 동물 n 마리(셋씩 한 줄), 0 이면 빈 카드 */
function Flock({ n, animal, size }: { n: number; animal: string; size: string }) {
  if (n === 0) return <span className="block" style={{ width: size, height: size }} />;
  return (
    <span className="flex max-w-[11rem] flex-wrap items-center justify-center gap-1">
      {Array.from({ length: n }, (_, i) => (
        <ThingArt key={i} id={animal} size={size} />
      ))}
    </span>
  );
}

export function Farm({ rounds, assess, onDone }: { rounds: FarmRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  useStep(idx, rounds.length);
  const [phase, setPhase] = useState<Phase>("ready");
  const [tried, setTried] = useState<number[]>([]);
  /** 정답을 골랐다 — 칭찬을 다 듣고 헛간을 연다 */
  const [got, setGot] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const r = rounds[idx];

  useEffect(() => {
    void say(LINES.farm);
    return () => stopVoice();
  }, []);

  const startWalk = () => {
    sfx.wake();
    sfx.pop();
    stopVoice();
    setPhase("walk");
    for (let i = 0; i < r.n; i++) later(() => sfx.tick(), i * STEP + WALK_MS * 0.82);
    later(
      () => {
        setPhase("ask");
        void say(LINES.farmQ);
      },
      r.n * STEP + 700,
    );
  };

  /** 헛간을 열고 하나씩 센 뒤 동물이 나가고 다음 판 */
  const reveal = (nextScore: number) => {
    setPhase("open");
    sfx.pop();
    void say([LINES.farmOpen, ...countUp(r.n)]).then(() => {
      setPhase("leave");
      later(() => {
        if (idx + 1 >= rounds.length) {
          onDone({ correct: nextScore, total: rounds.length });
          return;
        }
        setIdx(idx + 1);
        setTried([]);
        setGot(false);
        setPhase("ready");
      }, LEAVE_MS + 300);
    });
  };

  const choose = (k: number) => {
    if (phase !== "ask" || got || tried.includes(k)) return;
    const alive = turn();
    const name = [k === 0 ? LINES.none : nameOf(k)];
    if (k === r.n) {
      const nextScore = tried.length === 0 ? score + 1 : score;
      setScore(nextScore);
      setGot(true);
      void answerFeedback({ name, right: true, then: [pick(LINES.praise)], alive }).then((ok) => ok && reveal(nextScore));
      return;
    }
    setTried((t) => [...t, k]);
    if (assess) {
      void answerFeedback({ name, right: false, then: [], alive }).then((ok) => ok && reveal(score));
      return;
    }
    void answerFeedback({ name, right: false, then: [pick(LINES.retry), LINES.farmQ], alive });
  };

  const open = phase === "open" || phase === "leave";
  const doorX = "56%";

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-4">
      {/* 들판 — 하늘·풀밭·울타리, 가운데 헛간 */}
      <div className="relative w-[min(94vw,64rem)] overflow-hidden rounded-[2rem] ring-4 ring-white/80" style={{ height: "min(52vh, 30rem)", background: "linear-gradient(#8fd3ff 0 62%, #8ccf4d 62% 100%)" }}>
        <span aria-hidden className="absolute inset-x-0 h-[7%] bg-[repeating-linear-gradient(90deg,#fff_0_6px,transparent_6px_34px)] opacity-80" style={{ top: "56%" }} />
        <div className="absolute bottom-[14%] -translate-x-1/2" style={{ left: doorX, width: "min(30vh, calc(22*var(--vw)))", aspectRatio: "200 / 190" }}>
          <BarnInside />
          {/* 헛간 안 동물 — 앞판을 들면 보인다 */}
          {open && (
            <div className="absolute inset-x-[16%] bottom-[3%] flex flex-wrap-reverse items-end justify-center gap-1">
              {Array.from({ length: r.n }, (_, i) => (
                <span key={i} className={phase === "leave" ? "animate-walk-out" : "animate-pop-in"} style={{ animationDelay: `${i * 0.25}s`, animationDuration: phase === "leave" ? `${LEAVE_MS}ms` : undefined }}>
                  <ThingArt id={r.animal} size={CHICK} />
                </span>
              ))}
            </div>
          )}
          <div className="absolute inset-0 transition-transform duration-700 ease-out" style={{ transform: open ? "translateY(-112%)" : "none" }}>
            <BarnFront ask={phase === "ask"} />
          </div>
        </div>
        {/* 걸어 들어가는 동물 — 문 앞에서 쏙 */}
        {phase === "walk" &&
          Array.from({ length: r.n }, (_, i) => (
            <span key={i} className="absolute bottom-[12%] -translate-x-1/2" style={{ left: doorX }}>
              <span className="block animate-walk-in" style={{ animationDelay: `${i * STEP}ms` }}>
                <span className="block animate-hop">
                  <ThingArt id={r.animal} size={CHICK} />
                </span>
              </span>
            </span>
          ))}
      </div>

      <div className="flex min-h-[min(22vh,11rem)] items-center justify-center gap-6">
        {phase === "ready" && (
          <button type="button" onClick={startWalk} className="cta animate-pop-in rounded-full px-14 py-4 text-4xl font-extrabold">
            시작
          </button>
        )}
        {(phase === "ask" || phase === "open" || phase === "leave") &&
          r.choices.map((k) => {
            const right = (got || open) && k === r.n;
            const wrong = tried.includes(k);
            const hint = !assess && phase === "ask" && !got && tried.length > 0 && k === r.n;
            return (
              <SquishButton
                key={`${idx}-${k}`}
                tone={right ? "mint" : wrong ? "peach" : "card"}
                aria-label={k === 0 ? "하나도 없어" : `${nameOf(k)} 마리`}
                onClick={() => choose(k)}
                className={`relative grid animate-pop-in place-items-center rounded-[1.8rem] p-3 ${hint ? "animate-breathe ring-8 ring-butter" : ""}`}
                style={{ minWidth: "min(22vh, calc(17*var(--vw)))", minHeight: "min(18vh, calc(14*var(--vw)))" }}
              >
                <span className={wrong ? "opacity-45 grayscale" : ""}>
                  <Flock n={k} animal={r.animal} size="min(6.5vh, calc(5*var(--vw)))" />
                </span>
                {right && <span className="absolute -right-3 -top-3 grid h-12 w-12 place-items-center rounded-full bg-mint-deep text-3xl text-white">✓</span>}
                {wrong && <span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-full bg-peach-deep text-2xl text-white shadow">✕</span>}
              </SquishButton>
            );
          })}
      </div>
    </div>
  );
}
