"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Cube, Numeral } from "@/components/Art";
import { SquishButton, UiIcon } from "@/components/ui";
import { lineAsk, LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import { LINE_END, type NumberLineRound } from "@/lib/rounds";
import { useStep } from "@/lib/steps";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { HandHint } from "../HandHint";
import { HeldGhost, useDragPick } from "../dragPick";
import type { OnDone } from "../types";

/*
 * 수직선 밝히기 — "1 + ? = 3". 수직선에 블록 1칸이 미리 놓여 있고 목표 수(3)에 ▲. 아래 막대(1~4칸) 중 하나를 수직선에 끌어다 놓으면
 * 식의 ? 가 채워지고 ✓ 가 켜진다. ✓ 를 누르면 맞을 때 수직선이 반짝 밝아진다(업체 판 그대로). 막대를 누르면 놓이고, 놓인 막대를 누르면 돌아온다.
 * 막대 블록 크기는 수직선 한 칸과 같다 — 길이를 눈으로 대 볼 수 있게.
 */

/** 막대 색 — 길이마다(1~4) */
const BAR_TONE = ["", "mint", "sky", "butter", "rose"] as const;

export function NumberLine({ rounds, assess, onDone }: { rounds: NumberLineRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  useStep(idx, rounds.length);
  const [bar, setBar] = useState<number | null>(null);
  const [lit, setLit] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const r = rounds[idx];
  const t = r.a + r.b;

  useEffect(() => {
    void say(idx === 0 ? [LINES.numberLine, lineAsk(t)] : [lineAsk(t)]);
    return () => stopVoice();
  }, [idx, t]);

  const place = (len: number) => {
    if (lit || tried.includes(len)) return;
    if (r.a + len > LINE_END) {
      sfx.boop();
      return;
    }
    setBar(len);
    sfx.pop();
    void say([nameOf(len), LINES.numberLineCheck]);
  };

  const { held, begin } = useDragPick<number>((len, zone, tapped) => {
    if (tapped || zone === "line") place(len);
  });

  const check = () => {
    if (bar === null || lit) return;
    const alive = turn();
    if (r.a + bar === t) {
      const s = tried.length === 0 ? score + 1 : score;
      setScore(s);
      setLit(true);
      void answerFeedback({ name: [nameOf(t)], right: true, then: [pick(LINES.praise)], alive }).then((ok) => {
        if (!ok) return;
        later(() => {
          if (idx + 1 >= rounds.length) {
            onDone({ correct: s, total: rounds.length });
            return;
          }
          setIdx(idx + 1);
          setBar(null);
          setLit(false);
          setTried([]);
        }, 500);
      });
      return;
    }
    const wrong = bar;
    setTried([...tried, wrong]);
    setBar(assess ? r.b : null);
    if (assess) {
      // 도장 놀이 — 맞는 막대를 놓아 보여 주고 다음
      setLit(true);
      void answerFeedback({ name: [nameOf(r.a + wrong)], right: false, then: [LINES.revealHere], alive }).then((ok) => {
        if (!ok) return;
        later(() => {
          if (idx + 1 >= rounds.length) {
            onDone({ correct: score, total: rounds.length });
            return;
          }
          setIdx(idx + 1);
          setBar(null);
          setLit(false);
          setTried([]);
        }, 700);
      });
      return;
    }
    void answerFeedback({ name: [nameOf(r.a + wrong)], right: false, then: [pick(LINES.retry), lineAsk(t)], alive });
  };

  // 한 칸 크기 — 수직선(0~10)이 화면 너비에 들어가고, 높이가 낮은 화면에서도 넘치지 않게
  const unit = "min(8.2vw, 4.8rem, 12vh)";
  const vars = { "--u": unit } as CSSProperties;
  const cubes = (n: number, tone: string, from = 0) =>
    Array.from({ length: n }, (_, i) => (
      <span key={`${tone}-${from + i}`} className="absolute bottom-0 grid place-items-center" style={{ left: `calc(var(--u) * ${from + i})`, width: "var(--u)", height: "var(--u)" }}>
        <Cube size="calc(var(--u) * 0.92)" tone={tone} className={lit ? "animate-glow" : ""} />
      </span>
    ));

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-4" style={vars}>
      <div key={idx} className={`flex animate-pop-in flex-col items-center gap-[2.5vh] rounded-[2rem] px-[3vw] py-[2.5vh] ring-4 ring-white/70 transition-colors duration-500 ${lit ? "bg-butter" : "bg-lilac"}`}>
        {/* 식 + 확인 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-[1.4rem] bg-white/90 px-6 py-2 font-letter font-extrabold" style={{ fontSize: "min(7vh, calc(5*var(--vw)))" }}>
            <Numeral n={r.a} />
            <span>+</span>
            {bar === null ? <span className="text-ink-soft">?</span> : <Numeral n={bar} className="text-brand" />}
            <span>=</span>
            <Numeral n={t} />
          </div>
          <SquishButton
            tone="mint"
            aria-label="확인"
            disabled={bar === null || lit}
            onClick={check}
            className={`grid place-items-center rounded-full text-4xl text-white ${bar !== null && !lit ? "animate-breathe" : ""}`}
            style={{ width: "min(11vh, 4.6rem)", height: "min(11vh, 4.6rem)" }}
          >
            <UiIcon name="check" />
          </SquishButton>
        </div>
        {/* 수직선 — 블록이 놓이는 줄 + 눈금 */}
        <div data-drop="line" className={`relative rounded-[1rem] transition-colors ${held?.over === "line" ? "bg-white/50" : ""}`} style={{ width: `calc(var(--u) * ${LINE_END})`, height: "calc(var(--u) * 1.15)" }}>
          {cubes(r.a, "peach")}
          {/* 손가락 시범이 가리킬 자리 — 놓인 블록 바로 뒤 */}
          <span aria-hidden data-hint-spot="" className="pointer-events-none absolute top-1/2 h-px w-px" style={{ left: `calc(var(--u) * ${r.a + r.b / 2})` }} />
          {bar !== null && (
            <button type="button" aria-label="막대 빼기" onClick={() => !lit && setBar(null)} className="absolute inset-0">
              {cubes(bar, BAR_TONE[bar], r.a)}
            </button>
          )}
        </div>
        <div className="relative" style={{ width: `calc(var(--u) * ${LINE_END})`, height: "calc(var(--u) * 1.1)" }}>
          <span aria-hidden className="absolute inset-x-0 top-0 h-[0.4rem] rounded-full bg-white" />
          {Array.from({ length: LINE_END + 1 }, (_, i) => (
            <span key={i} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `calc(var(--u) * ${i})` }}>
              <span className="h-3 w-[0.3rem] rounded-full bg-white" />
              <span className={`font-letter font-extrabold leading-none ${i === t ? "text-brand" : "text-ink"}`} style={{ fontSize: "calc(var(--u) * 0.42)" }}>
                {i}
              </span>
              {i === t && <span aria-hidden className="mt-0.5 h-0 w-0 border-x-[0.6rem] border-b-[0.8rem] border-x-transparent border-b-butter-deep" />}
            </span>
          ))}
        </div>
      </div>
      {/* 막대 보기 */}
      <div className="flex flex-wrap items-end justify-center gap-[calc(var(--u)*0.6)]">
        {r.bars.map((len) =>
          bar === len ? (
            <span key={len} aria-hidden style={{ width: `calc(var(--u) * ${len})`, height: "var(--u)" }} />
          ) : (
            <button
              key={len}
              type="button"
              aria-label={`블록 ${nameOf(len)}`}
              onPointerDown={begin(len)}
              style={{ touchAction: "none", width: `calc(var(--u) * ${len})`, height: "var(--u)" }}
              className={`relative transition-transform active:scale-95 ${tried.includes(len) ? "opacity-40 grayscale" : ""} ${held?.moved && held.item === len ? "opacity-30" : ""} ${!assess && tried.length > 0 && len === r.b && !lit ? "animate-breathe" : ""}`}
            >
              {cubes(len, BAR_TONE[len])}
            </button>
          ),
        )}
      </div>
      {/* 첫 판 — 맞는 막대를 줄에 놓는 길, 놓은 뒤엔 확인 단추 */}
      <HandHint on={idx === 0 && bar === null} from={`[aria-label="블록 ${nameOf(r.b)}"]`} to="[data-hint-spot]" />
      {bar !== null && <HandHint on={idx === 0 && !lit} from={`[aria-label="확인"]`} to={`[aria-label="확인"]`} delay={1200} />}
      <HeldGhost held={held}>
        {(len) => (
          <span className="relative block" style={{ ...vars, width: `calc(${unit} * ${len})`, height: unit }}>
            {cubes(len, BAR_TONE[len])}
          </span>
        )}
      </HeldGhost>
    </div>
  );
}
