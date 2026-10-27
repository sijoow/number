"use client";

import { useMemo } from "react";
import { LINES } from "@/curriculum/lines";
import { nameOf } from "@/curriculum/numbers";
import type { JoinRound } from "@/lib/rounds";
import { ActivityFrame, ChoiceCard, useChoice } from "../choice";
import type { OnDone } from "../types";
import { FRIEND_CARD, FriendChoice, FriendSum } from "./FriendSum";

/**
 * 모아 보기 — 숫자 친구 둘("셋 하고 둘")을 모으면 모두 몇 개? 숫자마다 위에 그 친구, 보기 카드도 숫자 옆에 친구.
 * 맞히면 두 친구가 답 자리로 뛰어들어 제 색 블록이 한 기둥으로 쌓였다가 답 친구로 변신(2026-10-27 사용자: 더하기와 같은 개념).
 * 기호(+ =)는 아직 쓰지 않는다 — "하고"와 화살표(4살은 "모으기"를 블록으로 먼저). 장면은 FriendSum.
 */
export function Join({ rounds, assess, onDone }: { rounds: JoinRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [nameOf(r.a), LINES.and, nameOf(r.b), LINES.joinQ]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => String(r.a + r.b)), [rounds]);
  const c = useChoice({ intro: LINES.join, prompts, answers, assess, nameOf: (k) => [nameOf(Number(k))], onDone });
  const r = rounds[c.idx];

  return (
    <ActivityFrame>
      <FriendSum key={c.idx} kind="join" a={r.a} b={r.b} answer={r.a + r.b} settled={c.settled} />
      <div className="flex flex-wrap items-center justify-center gap-5 portrait:gap-3">
        {r.choices.map((n) => (
          <ChoiceCard key={`${c.idx}-${n}`} c={c} k={String(n)} label={nameOf(n)} style={FRIEND_CARD}>
            <FriendChoice n={n} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
