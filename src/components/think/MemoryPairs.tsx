"use client";

import { useEffect, useState } from "react";
import { FriendArt } from "@/components/Art";
import type { OnDone } from "@/components/play/types";
import { LINES } from "@/curriculum/lines";
import { sinoOf } from "@/curriculum/numbers";
import { sfx } from "@/lib/sfx";
import { starBurst } from "@/lib/stars";
import type { MemoryRound } from "@/lib/thinks";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";

/*
 * 짝 맞추기 — 숫자 친구 카드가 잠깐 보였다가 뒤집힌다. 두 장씩 뒤집어 같은 친구를 찾는다(업체 「짝 맞추기」처럼 처음에 보여 주고 덮는다).
 * 같으면 열린 채로 남고, 다르면 잠깐 뒤 다시 덮인다. 뒤집을 때 친구 이름("삼!")을 들려준다.
 * 점수는 판마다 — 덜 헤맨 판(틀린 뒤집기가 짝 수 이하) 수.
 */

/** 처음에 보여 주는 시간 — 짝이 많을수록 조금 더 */
const PEEK_MS = 1800;
const PEEK_PER_PAIR = 500;

export function MemoryPairs({ rounds, onDone }: { rounds: MemoryRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [peek, setPeek] = useState(true);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const r = rounds[idx];
  const pairs = r.cards.length / 2;
  const cols = pairs <= 2 ? 2 : pairs === 3 ? 3 : 4;
  const card = `min(${pairs > 3 ? 27 : 30}vh, calc(${cols > 3 ? 13 : 16}*var(--vw)))`;

  useEffect(() => {
    void say(LINES.memoryLook);
    const t = window.setTimeout(
      () => {
        setPeek(false);
        void say(LINES.memory);
      },
      PEEK_MS + pairs * PEEK_PER_PAIR,
    );
    return () => {
      window.clearTimeout(t);
      stopVoice();
    };
  }, [idx, pairs]);

  const finishRound = (missed: number) => {
    const s = missed <= pairs ? score + 1 : score;
    setScore(s);
    sfx.cheer();
    void say(pick(LINES.praise));
    later(() => {
      if (idx + 1 >= rounds.length) {
        onDone({ correct: s, total: rounds.length });
        return;
      }
      setIdx(idx + 1);
      setPeek(true);
      setOpen([]);
      setFound([]);
      setMisses(0);
    }, 1700);
  };

  const flip = (i: number) => {
    if (peek || open.length >= 2 || open.includes(i) || found.includes(r.cards[i])) return;
    sfx.pop();
    void say(sinoOf(r.cards[i]));
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    const [a, b] = next;
    if (r.cards[a] === r.cards[b]) {
      const got = [...found, r.cards[a]];
      later(() => {
        sfx.dingdong();
        starBurst();
        setFound(got);
        setOpen([]);
        if (got.length === pairs) finishRound(misses);
      }, 450);
      return;
    }
    setMisses(misses + 1);
    later(() => {
      sfx.boop();
      setOpen([]);
    }, 1100);
  };

  return (
    <div className="flex min-h-full items-center justify-center-safe px-4 py-4">
      <div key={idx} className="grid animate-pop-in gap-[2vh]" style={{ gridTemplateColumns: `repeat(${cols}, ${card})` }}>
        {r.cards.map((n, i) => {
          const up = peek || open.includes(i) || found.includes(n);
          const got = found.includes(n);
          return (
            <button
              key={`${idx}-${i}`}
              type="button"
              aria-label={up ? `숫자 친구 ${n}` : "뒤집힌 카드"}
              onClick={() => flip(i)}
              className={`grid place-items-center rounded-[1.6rem] transition-transform active:scale-95 ${up ? "bg-card" : "bg-butter"} ${got ? "ring-4 ring-mint-deep" : ""}`}
              style={{ width: card, height: card, boxShadow: `0 7px 0 ${up ? "var(--card-deep)" : "var(--butter-deep)"}, 0 14px 26px -12px rgb(62 58 82 / 0.35)` }}
            >
              {up ? (
                <span key="up" className="animate-pop-in">
                  <FriendArt n={n} height={`calc(${card} * 0.82)`} />
                </span>
              ) : (
                <span key="down" className="font-letter text-[min(10vh,3.4rem)] font-black text-white/90">
                  ?
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
