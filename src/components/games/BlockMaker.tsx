"use client";

import { useEffect, useState } from "react";
import { FriendArt, FriendTight } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { blockColor, layoutOf } from "@/curriculum/friends";
import { LINES, meetBlocks, meetHello } from "@/curriculum/lines";
import { nameOf, range, sinoOf } from "@/curriculum/numbers";
import { answerFeedback, useTurn } from "@/lib/answer";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { DragGhost, useDragDrop } from "./drag";
import { ColorCube } from "./pieces";

/**
 * 블록 친구 만들기 — 예시 친구가 "안녕! 나는 사야." 하고, 그 친구 모양(4는 2×2, 9는 3×3, 7은 일곱 칸 기둥) 빈 틀을 아래 상자의
 * 숫자 친구로 채운다(2026-10-27 사용자: 숫자 눌러 쌓기 말고 예시를 주고 채우기). 넘버블록스처럼 모든 수는 일이 모여서 된다
 * (사용자: "블록 2개나 3개나 다 1이 하나씩 들어가서 되는 거니깐", "블록 자체를 1로", 묶음도 같이 = "둘 다") —
 *   일    남은 칸 수만큼 상자에 있다. 하나 넣으면 한 칸("하나, 둘…")
 *   이·삼 몇 번이고 꺼낼 수 있는 묶음 — 한꺼번에 두 칸·세 칸, 이어 센다("셋, 넷"). 남은 칸보다 크면 흐려서 못 집는다
 * 넣은 블록은 들어온 친구 색(일 빨강·이 주황·삼 노랑)으로 쌓이고, 다 차면 만들 친구 색으로 바뀌며 그 친구로 변신 — "넷! 블록이 네 개야."
 * 블록은 아래 칸부터 차곡차곡(4살이 작은 칸을 겨누지 않아도 되게).
 */

type Size = 1 | 2 | 3;
const BUNDLES: Size[] = [2, 3];
/** 상자 속 키 — 블록 한 칸이 같은 크기로 보이게(친구 그림은 저마다 캔버스를 채워서, 이·삼을 그만큼 크게) */
const SCALE: Record<Size, number> = { 1: 1, 2: 1.3, 3: 1.6 };
/** 블록이 다 찬 뒤 친구 색으로 바뀌는 시간, 그다음 친구로 변신 */
const JOIN_MS = 700;

export function BlockMaker({ rounds, onDone }: { rounds: number[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  /** 넣은 조각 — 넣은 차례대로 크기(1·2·3) */
  const [fills, setFills] = useState<Size[]>([]);
  /** fill 채우는 중 → join 다 차서 친구 색으로 바뀌는 중 → done 친구로 변신 */
  const [stage, setStage] = useState<"fill" | "join" | "done">("fill");
  const later = useTimers();
  const turn = useTurn();
  const n = rounds[idx];
  const { cols, rows } = layoutOf(n, "shape");
  const count = fills.reduce<number>((s, f) => s + f, 0);
  const left = n - count;

  useEffect(() => {
    void say([LINES.maker, meetHello(rounds[0]), LINES.makerFill]);
    return () => stopVoice();
  }, [rounds]);

  const advance = () => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: rounds.length, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setFills([]);
    setStage("fill");
    void say([meetHello(rounds[idx + 1]), LINES.makerFill]);
  };

  const { drag, begin } = useDragDrop<Size>((size, zone) => {
    if (zone !== "frame" || stage !== "fill" || size > left) return;
    sfx.wake();
    sfx.pop();
    const next = count + size;
    setFills([...fills, size]);
    // 이어 세기 — 일이면 한 마디, 삼이면 "셋, 넷, 다섯"
    const counted = range(count + 1, next).map((k) => nameOf(k));
    if (next < n) {
      void say(counted);
      return;
    }
    // 다 찼다 — 블록이 그 친구 색으로 바뀌고 친구로 변신
    setStage("join");
    later(() => {
      setStage("done");
      sfx.cheer();
    }, JOIN_MS);
    const alive = turn();
    void answerFeedback({ name: counted, right: true, then: [meetBlocks(n), pick(LINES.praise)], alive }).then((ok) => ok && later(advance, 600));
  });

  // 칸마다 — 어느 조각의 몇 번째 블록인지(아래 칸부터 넣은 차례대로)
  const slots = fills.flatMap((f) => range(0, f - 1).map((j) => ({ size: f, j })));
  // 블록 색 — 채우는 동안은 들어온 친구 색, 다 차면 만들 친구 색(7 무지개·9 회색은 줄마다)
  const target = (i: number) => blockColor(n, Math.floor(i / cols));
  const slot = `min(10vh, calc(42vh / ${rows}), calc(30*var(--vw) / ${cols}))`;
  const cube = `calc(${slot} * 0.92)`;
  const piece = "min(11vh, calc(8.5*var(--vw)))";
  const tall = (k: Size) => `calc(${piece} * ${SCALE[k]})`;

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[2.5vh] px-4 py-3">
      <p className="glass rounded-full px-6 py-2 text-2xl font-extrabold">
        <ReadAlong text={stage === "fill" ? LINES.makerFill : meetBlocks(n)} />
      </p>
      <div className="flex items-center justify-center gap-[5vw]">
        {/* 예시 — 이 친구를 만든다 */}
        <div key={`ex-${idx}`} className="flex animate-pop-in flex-col items-center gap-1 rounded-[1.8rem] bg-white/75 px-3 py-2 ring-1 ring-white">
          <FriendArt n={n} height="min(22vh, calc(17*var(--vw)))" />
          <span className="text-xl font-extrabold">
            {sinoOf(n)} <span className="text-brand">{n}</span>
          </span>
        </div>
        {/* 틀 — 여기에 친구를 놓는다. 다 채우면 그 친구가 된다 */}
        <div
          key={`frame-${idx}`}
          data-drop="frame"
          className={`grid min-h-[min(22vh,10rem)] min-w-[min(22vh,10rem)] place-items-center rounded-[1.8rem] bg-white/60 p-3 ring-1 ring-white transition-transform ${drag?.over === "frame" ? "scale-105 ring-8 ring-brand/40" : ""}`}
        >
          {stage === "done" ? (
            <FriendArt n={n} height={`calc(${slot} * ${rows} * 1.15)`} className="animate-pop-in" />
          ) : (
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, ${slot})` }}>
              {range(0, rows - 1)
                .reverse()
                .flatMap((r) => range(0, cols - 1).map((c) => r * cols + c))
                .map((i) => {
                  const s = slots[i];
                  const want = target(i);
                  const color = s && stage === "fill" ? blockColor(s.size, 0) : want;
                  return (
                    <span key={i} className="grid place-items-center rounded-[18%]" style={{ width: slot, height: slot, border: s ? undefined : `3px dashed ${want.edge ?? want.fill}`, opacity: s ? 1 : 0.6 }}>
                      {s && (
                        // 묶음은 한 칸씩 톡톡 차례로
                        <span className="flex animate-drop-in" style={{ animationDelay: `${s.j * 110}ms` }}>
                          <ColorCube size={cube} fill={color.fill} edge={color.edge} className="transition-colors duration-500" />
                        </span>
                      )}
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      {/* 블록 상자 — 일은 남은 칸만큼, 칸막이 너머 이·삼 묶음. 변신하는 동안은 자리만 남기고 숨긴다 */}
      <div
        className={`flex min-h-[calc(min(11vh,calc(8.5*var(--vw)))*1.6_+_1rem)] max-w-[min(94vw,60rem)] flex-wrap items-end justify-center gap-x-2 gap-y-1 rounded-[1.6rem] bg-white/60 px-4 py-2 ring-1 ring-white ${stage === "fill" ? "" : "invisible"}`}
      >
        {stage === "fill" && (
          <>
            {range(1, left).map((i) => (
              <button
                key={`${idx}-${i}`}
                type="button"
                aria-label={sinoOf(1)}
                onPointerDown={begin(1)}
                onClick={() => void say(LINES.makerDrag)}
                style={{ touchAction: "none" }}
                className={`cursor-grab ${drag?.item === 1 && i === left ? "opacity-0" : ""}`}
              >
                <FriendTight n={1} height={tall(1)} />
              </button>
            ))}
            <span aria-hidden className="mx-2 w-[3px] self-stretch rounded-full bg-ink/10" />
            {BUNDLES.map((k) => {
              const fits = k <= left;
              return (
                <button
                  key={k}
                  type="button"
                  aria-label={sinoOf(k)}
                  aria-disabled={!fits}
                  onPointerDown={fits ? begin(k) : undefined}
                  onClick={() => {
                    if (fits) void say(LINES.makerDrag);
                  }}
                  style={{ touchAction: "none" }}
                  className={fits ? "cursor-grab" : "opacity-30 grayscale"}
                >
                  <FriendTight n={k} height={tall(k)} />
                </button>
              );
            })}
          </>
        )}
      </div>
      <DragGhost drag={drag}>{(k) => <FriendTight n={k} height={tall(k)} />}</DragGhost>
    </div>
  );
}
