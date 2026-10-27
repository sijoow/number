"use client";

import { useEffect, useState } from "react";
import { FriendArt, ThingArt } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { LINES, shareEach } from "@/curriculum/lines";
import { nameOf, range, sinoOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { ShareRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { DragGhost, useDragDrop } from "./drag";

/** 끌고 있는 쿠키가 어디서 왔나 — 쿠키 더미 또는 친구 접시(번호) */
type From = "pile" | number;

/**
 * 간식 나누기 — 쿠키를 손가락으로 끌어서 친구에게 직접 가져다준다(2026-10-27 사용자). 접시의 쿠키는 다른 친구에게 옮기거나 더미로 도로 가져올 수 있다.
 * 놓을 때마다 그 접시를 세어 준다("하나, 둘"). 다 나누면 똑같은지 — 똑같으면 "둘씩 똑같아!", 아니면 옮겨서 고쳐 보게. 한 번에 똑같이 나눈 판만 점수.
 */
export function ShareSnack({ rounds, onDone }: { rounds: ShareRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [plates, setPlates] = useState<number[]>(() => rounds[0].friends.map(() => 0));
  const [state, setState] = useState<"giving" | "uneven" | "done">("giving");
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const r = rounds[idx];
  const pile = r.cookies - plates.reduce((a, b) => a + b, 0);

  useEffect(() => {
    void say([LINES.share, LINES.shareDrag]);
    return () => stopVoice();
  }, []);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setPlates(rounds[idx + 1].friends.map(() => 0));
    setMissed(false);
    setState("giving");
    void say(LINES.share);
  };

  /** 접시가 바뀐 뒤 — 쿠키가 남았으면 그 접시를 세고, 다 나눴으면 똑같은지 본다 */
  const after = (next: number[], k: number | null) => {
    setPlates(next);
    const left = r.cookies - next.reduce((a, b) => a + b, 0);
    if (left > 0) {
      setState("giving");
      if (k !== null) void say(nameOf(next[k]));
      return;
    }
    const alive = turn();
    if (next.every((v) => v === next[0])) {
      const nextScore = missed ? score : score + 1;
      setScore(nextScore);
      setState("done");
      void answerFeedback({ name: k !== null ? [nameOf(next[k])] : [], right: true, then: [shareEach(next[0]), pick(LINES.praise)], alive }).then(
        (ok) => ok && later(() => advance(nextScore), 700),
      );
      return;
    }
    setMissed(true);
    setState("uneven");
    void answerFeedback({ name: k !== null ? [nameOf(next[k])] : [], right: false, then: [LINES.shareNot], alive });
  };

  const { drag, begin } = useDragDrop<From>((from, zone) => {
    if (state === "done" || !zone) return;
    const to: From = zone === "pile" ? "pile" : Number(zone.replace("plate-", ""));
    if (to === from) return;
    sfx.wake();
    if (to === "pile") {
      if (from === "pile") return;
      sfx.tick();
      after(
        plates.map((v, i) => (i === from ? v - 1 : v)),
        null,
      );
      return;
    }
    sfx.pop();
    after(
      plates.map((v, i) => (i === to ? v + 1 : i === from ? v - 1 : v)),
      to,
    );
  });

  // 끌고 있는 쿠키는 제자리에서 빠져 보이게(손가락을 따라오는 쪽만 보이게)
  const lifting = drag?.item;
  const shown = (from: From, n: number) => (lifting === from ? Math.max(0, n - 1) : n);
  const many = r.friends.length;
  const friend = `min(${many > 2 ? 17 : 21}vh, calc(${many > 2 ? 15 : 19}*var(--vw)))`;
  const cookie = "min(5.4vh, calc(4.6*var(--vw)))";
  const grab = (from: From, key: string) => (
    <button key={key} type="button" aria-label="쿠키" onPointerDown={begin(from)} style={{ touchAction: "none" }} disabled={state === "done"} className="cursor-grab animate-drop-in">
      <ThingArt id="cookie" size={cookie} />
    </button>
  );

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[2.5vh] px-4 py-3">
      <p key={idx} className="glass animate-pop-in rounded-full px-6 py-2 text-2xl font-extrabold">
        <ReadAlong text={state === "uneven" ? LINES.shareNot : LINES.shareDrag} />
      </p>
      <div className="flex items-end justify-center gap-[4vw]">
        {r.friends.map((n, k) => (
          // 친구와 접시 전체가 놓을 곳
          <div
            key={`${idx}-${k}`}
            data-drop={`plate-${k}`}
            className={`flex flex-col items-center gap-2 rounded-[1.8rem] p-1 transition-transform ${drag?.over === `plate-${k}` ? "scale-105 bg-white/60 ring-4 ring-brand/40" : ""}`}
            aria-label={`${sinoOf(n)} 접시`}
          >
            <FriendArt n={n} height={friend} />
            <div
              className={`flex min-h-[calc(var(--cookie)*1.2)] flex-wrap content-start items-center justify-center gap-1 rounded-[50%] bg-white px-4 py-2 shadow-[0_6px_0_var(--paper-deep)] ${state === "done" ? "ring-4 ring-mint-deep" : ""}`}
              style={{ width: `calc(${friend} * 1.05)`, ["--cookie" as string]: cookie }}
            >
              {range(1, shown(k, plates[k])).map((c) => grab(k, `p${k}-${c}`))}
            </div>
          </div>
        ))}
      </div>
      {/* 아직 안 나눈 쿠키 — 여기서 끌어 가고, 접시 쿠키를 여기 놓으면 도로 가져온다 */}
      <div
        data-drop="pile"
        className={`flex min-h-[calc(min(5.4vh,calc(4.6*var(--vw)))*1.6)] max-w-[min(90vw,40rem)] flex-wrap items-center justify-center gap-1.5 rounded-[1.6rem] bg-white/60 px-4 py-2 ring-1 ring-white ${drag?.over === "pile" ? "ring-4 ring-brand/40" : ""}`}
        aria-label={`남은 쿠키 ${pile}개`}
      >
        {pile > 0 ? range(1, shown("pile", pile)).map((c) => grab("pile", `pile-${c}`)) :<span className="text-lg font-bold text-ink-soft">{state === "done" ? shareEach(plates[0]) : "다 나눴어!"}</span>}
      </div>
      <DragGhost drag={drag}>{() => <ThingArt id="cookie" size={`calc(${cookie} * 1.3)`} />}</DragGhost>
    </div>
  );
}
