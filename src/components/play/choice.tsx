"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { SquishButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "./types";

/*
 * 보기 고르기 — 몇 개일까·숫자 찾기·더 많은 쪽·다음 숫자·모양·규칙·모으기·세기(마지막 물음)가 같이 쓰는 틀.
 * 한글나라 정답 반응 그대로(lib/answer): 누른 보기의 이름("셋")을 먼저 읽고 딩동댕/땡, 맞으면 칭찬을 끝까지 듣고 다음.
 *   보통 판   틀린 보기는 흐려지고 다시. 한 번 틀리면 정답 보기가 숨 쉬듯 커졌다 작아진다(보기가 셋뿐이라 한글나라보다 빨리)
 *   도장 놀이 틀리면 정답을 보여 주고 다음으로 — 첫 시도만 점수
 *   도전 판   마지막 판이 도전 판이면(lib/rounds withChallenge) "도전!" 하고 묻고, 처음에 맞히면 bonus 1
 * 보기는 글자 열쇠(key)로 구분한다 — 숫자는 "3", 모양 카드는 카드 key, 물건은 물건 id.
 */

export type CardState = "idle" | "right" | "wrong" | "reveal";

export interface Choice {
  idx: number;
  choose: (key: string) => void;
  stateOf: (key: string) => CardState;
  wasWrong: (key: string) => boolean;
  hintOn: (key: string) => boolean;
  /** 지금 판에서 정답을 골랐나(또는 도장 놀이에서 정답을 보여 주는 중) */
  settled: boolean;
  /** 지금 판이 도전 판 */
  challenge: boolean;
}

export function useChoice({
  intro,
  prompts,
  again,
  answers,
  assess,
  nameOf,
  challenge = false,
  onDone,
}: {
  /** 놀이를 시작할 때 한 번 */
  intro: string;
  /** 판마다 묻는 말 — 부르는 쪽에서 useMemo 로 (바뀌면 처음부터 다시 말한다) */
  prompts: readonly (readonly string[])[];
  /** 틀린 뒤 다시 물을 말 — 없으면 prompts */
  again?: readonly (readonly string[])[];
  /** 판마다 정답 보기의 key */
  answers: readonly string[];
  assess: boolean;
  /** 누른 보기를 읽는 말 — idx 는 지금 판 번호 */
  nameOf: (key: string, idx: number) => readonly string[];
  /** 마지막 판이 도전 판 */
  challenge?: boolean;
  onDone: OnDone;
}): Choice {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<CardState>("idle");
  const [tried, setTried] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const count = answers.length;

  useEffect(() => {
    void say([intro, ...(prompts[0] ?? [])].filter(Boolean));
    return () => stopVoice();
  }, [intro, prompts]);

  const isChallenge = (i: number) => challenge && i === count - 1;

  const advance = (nextScore: number, bonus = 0) => {
    if (idx + 1 >= count) {
      onDone({ correct: nextScore, total: count, bonus });
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setState("idle");
    setTried([]);
    void say([...(isChallenge(idx + 1) ? [LINES.challenge] : []), ...(prompts[idx + 1] ?? [])]);
  };

  const choose = (key: string) => {
    if (state === "right" || state === "reveal" || tried.includes(key)) return;
    setPicked(key);
    const alive = turn();
    const name = nameOf(key, idx);
    if (key === answers[idx]) {
      const nextScore = tried.length === 0 ? score + 1 : score;
      const won = isChallenge(idx) && tried.length === 0;
      setScore(nextScore);
      setState("right");
      void answerFeedback({ name, right: true, then: [won ? LINES.challengeWin : pick(LINES.praise)], alive }).then((ok) => ok && later(() => advance(nextScore, won ? 1 : 0), 600));
      return;
    }
    if (assess) {
      setState("reveal");
      void answerFeedback({ name, right: false, then: [LINES.revealHere], alive }).then((ok) => ok && later(() => advance(score), 900));
      return;
    }
    setState("wrong");
    setTried((t) => [...t, key]);
    void answerFeedback({ name, right: false, then: [pick(LINES.retry), ...((again ?? prompts)[idx] ?? [])], alive });
    later(() => setState((s) => (s === "wrong" ? "idle" : s)), 600);
  };

  return {
    idx,
    choose,
    stateOf: (key) => (picked === key ? state : state === "reveal" && key === answers[idx] ? "right" : "idle"),
    wasWrong: (key) => tried.includes(key),
    hintOn: (key) => !assess && tried.length >= 1 && key === answers[idx] && state !== "right",
    settled: state === "right" || state === "reveal",
    challenge: isChallenge(idx),
  };
}

/** 보기 카드 — 맞으면 민트 + ✓, 틀리면 복숭아 + 흔들기, 힌트면 숨쉬기 */
export function ChoiceCard({ c, k, label, style, className = "", children }: { c: Choice; k: string; label: string; style?: CSSProperties; className?: string; children: ReactNode }) {
  const cs = c.stateOf(k);
  const wrong = c.wasWrong(k);
  const tone = cs === "right" ? "mint" : cs === "wrong" || cs === "reveal" ? "peach" : "card";
  return (
    <SquishButton
      tone={tone}
      aria-label={label}
      onClick={() => c.choose(k)}
      className={`relative grid place-items-center rounded-[2.2rem] ${cs === "wrong" ? "animate-shake" : ""} ${cs === "right" ? "animate-wiggle" : ""} ${c.hintOn(k) ? "animate-breathe ring-8 ring-butter" : ""} ${className}`}
      style={style}
    >
      {/* 틀린 카드는 그림·숫자만 흐리게 — ✕ 는 또렷하게 */}
      <span className={`grid place-items-center ${wrong ? "opacity-45 grayscale" : ""}`}>{children}</span>
      {cs === "right" && <span className="absolute -right-3 -top-3 grid h-12 w-12 place-items-center rounded-full bg-mint-deep text-3xl text-white">✓</span>}
      {wrong && <span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-full bg-peach-deep text-2xl text-white shadow">✕</span>}
    </SquishButton>
  );
}

/** 놀이 판 틀 — 넘치면 위부터 보이게(가운데 정렬이 위를 잘라 먹지 않게). 도전 판이면 위에 「도전!」 */
export function ActivityFrame({ children, className = "", challenge = false }: { children: ReactNode; className?: string; challenge?: boolean }) {
  return (
    <div className={`flex min-h-full flex-col items-center justify-center-safe gap-[4vh] px-6 py-4 portrait:px-3 ${className}`}>
      {challenge && <ChallengeBadge />}
      {children}
    </div>
  );
}

/** 「도전!」 리본 — 별 둘 사이에 */
export function ChallengeBadge() {
  const star = (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
      <path d="M12 3.2l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.5l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" fill="var(--butter-deep)" />
    </svg>
  );
  return (
    <span className="flex animate-pop-in items-center gap-2 rounded-full bg-brand px-6 py-1.5 text-3xl font-extrabold text-white shadow-[0_6px_0_var(--brand-deep)] short:text-2xl">
      {star}
      도전!
      {star}
    </span>
  );
}

/** 숫자 보기 카드 크기 */
export const NUM_CARD: CSSProperties = { width: "min(22vh, calc(17*var(--vw)))", height: "min(22vh, calc(17*var(--vw)))" };
export const NUM_FONT: CSSProperties = { fontSize: "min(14vh, calc(10.5*var(--vw)))" };
