"use client";

import { useEffect, useState } from "react";
import type { OnDone } from "@/components/play/types";
import { SquishButton, UiIcon } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import { sfx } from "@/lib/sfx";
import { MIRROR_COLS, MIRROR_ROWS, type MirrorRound } from "@/lib/thinks";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";

/*
 * 거울 그림 — 가운데 점선이 접는 선. 왼쪽 점 무늬를 거울처럼 오른쪽에 찍는다(업체 「데칼코마니」: 점을 찍고 ✓).
 * 맞으면 두 판이 가운데 접는 선으로 모였다가(책을 덮듯) 다시 펴진다 — 모이는 때 딩동댕(2026-10-29 사용자: 접히는 것까지, 양쪽이 같이).
 * 판이 시작되면 오른쪽 판이 두 번 반짝 — 여기에 찍는다(업체도 할 곳을 잠깐 밝힌다).
 * 오른쪽 칸을 누르면 점이 찍히고, 다시 누르면 지워진다. 「처음부터」는 오른쪽을 비운다.
 * 틀리면 잘못 찍은 점과 빠진 자리에 빨간 동그라미 — 그 칸을 고치면 동그라미가 사라진다(업체 데칼코마니처럼).
 * 점수는 판마다 — 처음 ✓ 에 맞힌 판 수.
 */

/** 점 칸 — 세로 폰(390px)에서도 두 판이 한 줄에 들어가게 */
const CELL = "min(14vh, calc(7.4*var(--vw)))";
/** 판과 접는 선 사이 틈 — 접을 때 축이 정확히 점선 위에 오게 같은 값을 쓴다 */
const GAP = "2.4vw";
/** 접혔다 펴지는 2초(globals.css fold-l·fold-r) 중 두 판이 다 모인 때 */
const FOLD_SHUT_MS = 780;

export function Mirror({ rounds, onDone }: { rounds: MirrorRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [mine, setMine] = useState<number[]>([]);
  const [shake, setShake] = useState<number[]>([]);
  // 틀린 뒤 고칠 칸 — 잘못 찍은 점 + 빠진 자리
  const [marks, setMarks] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  // 맞힌 뒤 접는 중
  const [fold, setFold] = useState(false);
  const later = useTimers();
  const turn = useTurn();
  const r = rounds[idx];

  useEffect(() => {
    void say(LINES.mirror);
    return () => stopVoice();
  }, []);

  const toggle = (cell: number) => {
    if (done) return;
    sfx.tick();
    const next = mine.includes(cell) ? mine.filter((x) => x !== cell) : [...mine, cell];
    setMine(next);
    setMarks(marks.filter((x) => x !== cell));
    // 왼쪽만큼 찍었으면 확인을 알려 준다
    if (next.length === r.left.length && next.length > mine.length) void say(LINES.mirrorCheck);
  };

  const check = () => {
    if (done || mine.length === 0) return;
    const alive = turn();
    const right = mine.length === r.answer.length && r.answer.every((c) => mine.includes(c));
    if (right) {
      const s = tries === 0 ? score + 1 : score;
      setScore(s);
      setDone(true);
      // 두 판을 가운데로 접는다 — 다 모였을 때 딩동댕
      setFold(true);
      sfx.pop();
      later(() => {
        void answerFeedback({ name: [], right: true, then: [pick(LINES.praise)], alive }).then((ok) => {
          if (!ok) return;
          later(() => {
            if (idx + 1 >= rounds.length) {
              onDone({ correct: s, total: rounds.length });
              return;
            }
            setIdx(idx + 1);
            setMine([]);
            setTries(0);
            setMarks([]);
            setDone(false);
            setFold(false);
          }, 700);
        });
      }, FOLD_SHUT_MS);
      return;
    }
    setTries(tries + 1);
    const wrong = mine.filter((c) => !r.answer.includes(c));
    setShake(wrong);
    setMarks([...wrong, ...r.answer.filter((c) => !mine.includes(c))]);
    later(() => setShake([]), 600);
    void answerFeedback({ name: [], right: false, then: [LINES.mirrorWrong], alive });
  };

  const grid = (side: "left" | "right") => (
    <div className="grid gap-[1.6vh]" style={{ gridTemplateColumns: `repeat(${MIRROR_COLS}, ${CELL})` }}>
      {Array.from({ length: MIRROR_ROWS * MIRROR_COLS }, (_, cell) => {
        const on = side === "left" ? r.left.includes(cell) : mine.includes(cell) || (done && r.answer.includes(cell));
        const marked = side === "right" && !done && marks.includes(cell);
        const dot = (
          <span
            className={`block rounded-full transition-colors ${on ? "" : "bg-white"} ${shake.includes(cell) && side === "right" ? "animate-shake" : ""} ${done && on ? "animate-wiggle" : ""}`}
            style={{
              width: CELL,
              height: CELL,
              background: on ? r.color : undefined,
              boxShadow: on ? "inset 0 -0.35rem 0 rgb(0 0 0 / 0.12)" : "inset 0 0.25rem 0 rgb(62 58 82 / 0.08)",
              outline: marked ? "0.3rem solid #e04a3a" : undefined,
              outlineOffset: "0.18rem",
            }}
          />
        );
        return side === "left" ? (
          <span key={cell}>{dot}</span>
        ) : (
          <button key={cell} type="button" aria-label={`${Math.floor(cell / MIRROR_COLS) + 1}째 줄 ${(cell % MIRROR_COLS) + 1}째 칸`} onClick={() => toggle(cell)} className="transition-transform active:scale-90">
            {dot}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-[3vw] px-4 py-4 portrait:flex-col portrait:gap-5">
      <div key={idx} className="flex animate-pop-in items-stretch rounded-[2rem] bg-sky/90 px-[3vw] py-[3vh] ring-4 ring-white/80" style={{ gap: GAP }}>
        {/* 왼쪽 판 — 맞으면 접는 선(오른쪽 틈 + 점선 가운데)을 축으로 접힌다 */}
        <div className={fold ? "relative z-10 animate-fold-l" : "relative"} style={{ transformOrigin: `calc(100% + ${GAP} + 2.5px) 50%` }}>
          {grid("left")}
        </div>
        <span aria-hidden className="w-0 border-l-[5px] border-dashed border-white" />
        {/* 오른쪽 판 — 같은 접는 선(왼쪽 틈 + 점선 가운데)을 축으로 마주 접힌다 */}
        <div className={fold ? "relative z-10 animate-fold-r" : "relative"} style={{ transformOrigin: `calc(-1 * ${GAP} - 2.5px) 50%` }}>
          {/* 여기에 찍어 — 판이 시작될 때 두 번 반짝(판마다 key 로 다시 그려져 매번 반짝인다) */}
          <span aria-hidden className="pointer-events-none absolute -inset-[1.4vh] animate-here rounded-[1.2rem] bg-white/40 shadow-[0_0_0_0.35rem_#ffd34d,0_0_1.8rem_0.5rem_rgb(255_211_77/0.8)]" />
          {grid("right")}
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 portrait:flex-row">
        <SquishButton
          tone="mint"
          aria-label="확인"
          disabled={done || mine.length === 0}
          onClick={check}
          className={`grid place-items-center rounded-full text-4xl text-white ${mine.length > 0 && !done ? "animate-breathe" : ""}`}
          style={{ width: "min(14vh, 5.5rem)", height: "min(14vh, 5.5rem)" }}
        >
          <UiIcon name="check" />
        </SquishButton>
        <SquishButton
          tone="butter"
          disabled={done || mine.length === 0}
          onClick={() => {
            setMine([]);
            setMarks([]);
          }}
          className="whitespace-nowrap rounded-full px-5 py-3 text-2xl"
        >
          처음부터
        </SquishButton>
      </div>
    </div>
  );
}
