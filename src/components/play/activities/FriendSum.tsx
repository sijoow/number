"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { FriendTight } from "@/components/Art";
import { ColorCube } from "@/components/games/pieces";
import { blockColor } from "@/curriculum/friends";
import { range } from "@/curriculum/numbers";

/*
 * 숫자 친구로 모으기·더하기·빼기 — 모아 보기(B4)·더하기(B5)·빼기(B7)가 같이 쓰는 장면.
 * 숫자마다 위에 그 숫자 친구가 서 있다(2026-10-27 사용자: 숫자 옆에 넘버블록스 친구가 있어야 보고 기억한다, 모아 보기도 같은 개념).
 * 맞히면 블록이 합쳐지는 걸 눈으로 본다(사용자: "블록이 합쳐져서 되네"):
 *   모으기·더하기  두 친구가 답 자리로 뛰어들어 → 제 색 블록이 한 기둥으로 쌓이고(삼 노랑 셋 + 이 주황 둘) → 그 기둥이 답 친구(오)로 변신
 *   빼기           앞 친구가 답 자리로 뛰어들어 블록 기둥이 되고 → 위 블록 b 개가 날아가며 떠나는 친구도 사라지고 → 남은 기둥이 답 친구로
 * 떠나는 친구(빼기의 b)는 처음부터 흐리게 둥실 떠 있다 — 떠나는 쪽이라는 표시. 모아 보기는 기호 대신 "하고"·화살표(4살은 블록으로 먼저).
 */

export type SumKind = "join" | "add" | "subtract";

/** 답 자리에서 일이 벌어지는 때(ms) — 친구가 뛰어드는 동안 기둥이 쌓이고, 다 보이면 친구로 */
const LAND = 350;
const LEAVE = 950;
const BECOME = 1650;

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** 답 자리 — 모인(남은) 블록 기둥이 답 친구로 바뀌는 장면. 렌더만으로(CSS 지연) 돌아가서 상태가 필요 없다 */
function Merge({ kind, a, b, answer, height }: { kind: SumKind; a: number; b: number; answer: number; height: string }) {
  const cube = `calc(${height} / 6.6)`;
  const minus = kind === "subtract";
  // 아래부터: 모으기·더하기는 a 친구 블록 + b 친구 블록, 빼기는 a 친구 블록(위 b 개가 떠난다)
  const blocks = minus ? range(0, a - 1).map((i) => ({ from: a, i })) : [...range(0, a - 1).map((i) => ({ from: a, i })), ...range(0, b - 1).map((i) => ({ from: b, i }))];
  return (
    <>
      <span className="absolute inset-x-0 bottom-0 flex animate-merge-out flex-col-reverse items-center" style={{ gap: `calc(${cube} * 0.1)`, ...delay(BECOME) }}>
        {blocks.map(({ from, i }, k) => {
          const leaving = minus && k >= a - b;
          const color = blockColor(from, i);
          // 뛰어든 친구 차례로 한 칸씩 톡톡 — b 친구 블록은 b 친구가 조금 늦게 뛰어든 만큼 늦게
          const drop = LAND + k * 70 + (!minus && k >= a ? 120 : 0);
          return (
            <span key={k} className={`flex ${leaving ? "animate-leave-up" : ""}`} style={leaving ? delay(LEAVE) : undefined}>
              <span className="flex animate-drop-in" style={delay(drop)}>
                <ColorCube size={cube} fill={color.fill} edge={color.edge} />
              </span>
            </span>
          );
        })}
      </span>
      <span className="absolute inset-0 flex animate-pop-in items-end justify-center" style={delay(BECOME)}>
        <FriendTight n={answer} height={height} />
      </span>
    </>
  );
}

/** 위에 친구, 아래에 숫자 — 3 + 2 = ? (모아 보기는 3 하고 2 → ?). 판이 바뀌면 key 로 새로 그린다 */
export function FriendSum({ kind, a, b, answer, settled }: { kind: SumKind; a: number; b: number; answer: number; settled: boolean }) {
  const friend = "min(20vh, calc(15*var(--vw)))";
  const minus = kind === "subtract";
  const aRef = useRef<HTMLSpanElement>(null);
  const bRef = useRef<HTMLSpanElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);

  // 맞히면(도장 놀이에서 정답을 보여 줄 때도) 친구가 답 자리로 뛰어든다 — 자리를 재서 그쪽으로 폴짝
  useEffect(() => {
    if (!settled) return;
    const slot = slotRef.current?.getBoundingClientRect();
    if (!slot) return;
    const jump = (el: HTMLElement | null, wait: number) => {
      if (!el) return;
      const box = el.getBoundingClientRect();
      const dx = slot.left + slot.width / 2 - (box.left + box.width / 2);
      const dy = slot.top + slot.height / 2 - (box.top + box.height / 2);
      el.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: `translate(${dx * 0.5}px, ${dy - slot.height * 0.45}px) scale(0.85)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0 },
        ],
        { duration: 600, delay: wait, easing: "ease-in-out", fill: "forwards" },
      );
    };
    jump(aRef.current, 0);
    if (!minus) jump(bRef.current, 120);
    else bRef.current?.animate([{ opacity: 0.55 }, { transform: "translateY(-60%)", opacity: 0 }], { duration: 600, delay: LEAVE, easing: "ease-in", fill: "forwards" });
  }, [settled, minus]);

  // 식 한 칸 — 위에 친구(없으면 빈 자리), 아래에 숫자·기호
  const col = (top: ReactNode, bottom: ReactNode) => (
    <span className="flex flex-col items-center gap-[1.2vh]">
      <span className="relative flex items-end justify-center" style={{ height: friend }}>
        {top}
      </span>
      {bottom}
    </span>
  );
  const sign = (text: string, className = "") => <span className={`text-ink-soft ${className}`}>{text}</span>;

  return (
    <div className="flex animate-pop-in flex-col items-center rounded-[2rem] bg-white/75 px-8 pb-5 pt-4 ring-1 ring-white portrait:px-4">
      <p className="flex items-end gap-[0.3em] font-letter font-extrabold leading-none" style={{ fontSize: "min(10vh, calc(8*var(--vw)))" }}>
        {col(
          <span ref={aRef} className="block">
            <FriendTight n={a} height={friend} />
          </span>,
          <span>{a}</span>,
        )}
        {col(null, kind === "join" ? sign("하고", "pb-[0.15em] text-[0.42em]") : sign(minus ? "−" : "+"))}
        {col(
          // 빼기의 b 는 떠나는 친구 — 흐리게 둥실
          <span ref={bRef} className={`block ${minus ? "opacity-55" : ""}`}>
            <span className={minus ? "block animate-float" : ""}>
              <FriendTight n={b} height={friend} />
            </span>
          </span>,
          <span>{b}</span>,
        )}
        {col(null, kind === "join" ? sign("→", "text-[0.7em]") : sign("="))}
        {col(
          <span ref={slotRef} className="relative block" style={{ width: `calc(${friend} * 0.62)`, height: friend }}>
            {settled ? <Merge kind={kind} a={a} b={b} answer={answer} height={friend} /> : <span className="absolute inset-0 rounded-[1.2rem] border-4 border-dashed border-brand/25" />}
          </span>,
          settled ? (
            <span className="animate-pop-in text-brand">{answer}</span>
          ) : (
            <span className="grid animate-breathe place-items-center rounded-[0.3em] border-4 border-dashed border-brand bg-brand-soft px-[0.25em] text-brand">?</span>
          ),
        )}
      </p>
    </div>
  );
}

/** 보기 카드 크기 — 숫자 옆에 친구가 서도록 가로로 조금 길게 */
export const FRIEND_CARD: CSSProperties = { width: "min(26vh, calc(19*var(--vw)))", height: "min(19vh, calc(14*var(--vw)))" };

/** 보기 카드 속 — 숫자 옆에 그 숫자 친구 */
export function FriendChoice({ n }: { n: number }) {
  return (
    <span className="flex items-end gap-[1vh]">
      <span className="font-letter font-extrabold leading-none tabular-nums" style={{ fontSize: "min(11vh, calc(8*var(--vw)))" }}>
        {n}
      </span>
      <FriendTight n={n} height="min(14vh, calc(10.5*var(--vw)))" />
    </span>
  );
}
