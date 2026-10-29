"use client";

import { useEffect, useRef, useState } from "react";
import { LINES } from "@/curriculum/lines";
import { sfx } from "@/lib/sfx";
import { onStar } from "@/lib/stars";
import { say } from "@/lib/voice";

/** 큰 별 — 노란 별에 하얀 동그라미 바탕(업체 정답 별처럼) */
export function BigStar({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }} aria-hidden>
      <circle cx="50" cy="50" r="47" fill="#fff" />
      <path d="M50 14l10.6 21.5 23.7 3.4-17.2 16.7 4.1 23.6L50 68l-21.2 11.2 4.1-23.6-17.2-16.7 23.7-3.4z" fill="var(--butter-deep)" stroke="#e39a1b" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

/** 이만큼 지나면 「완료」를 안 눌러도 다음 놀이로 */
const SUCCESS_AUTO_MS = 5000;

/**
 * 놀이 하나를 마쳤을 때 — 「성공!」 창에 맞힌 수만큼 별이 하나씩 차오르고 「완료」(업체 성공 창처럼).
 * 4살이 버튼을 몰라도 멈추지 않게 조금 기다리면 저절로 넘어간다.
 */
export function SuccessCard({ stars, onNext }: { stars: number; onNext: () => void }) {
  // 「완료」와 저절로 넘어가기가 겹쳐도 한 번만
  const fired = useRef(false);
  const latest = useRef(onNext);
  useEffect(() => {
    latest.current = onNext;
  });
  const [next] = useState(() => () => {
    if (fired.current) return;
    fired.current = true;
    latest.current();
  });
  useEffect(() => {
    void say(LINES.success);
    const timers = [...Array.from({ length: stars }, (_, i) => window.setTimeout(() => sfx.ding(), 450 + i * 220)), window.setTimeout(next, SUCCESS_AUTO_MS)];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stars, next]);
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-ink/35 backdrop-blur-[2px]">
      <div className="flex w-[min(88vw,32rem)] animate-pop-in flex-col items-center gap-4 rounded-[2.4rem] bg-sky px-8 pb-7 pt-5 shadow-[0_30px_60px_-20px_rgb(62_58_82/0.5)] short:gap-2 short:pb-4">
        <p className="title-pop text-6xl short:text-5xl">성공!</p>
        <div className="flex max-w-full flex-wrap justify-center gap-2">
          {Array.from({ length: stars }, (_, i) => (
            <span key={i} className="animate-pop-in" style={{ animationDelay: `${0.4 + i * 0.22}s` }}>
              <BigStar size="min(9vh, 3.6rem)" />
            </span>
          ))}
        </div>
        <button type="button" onClick={next} className="cta rounded-full px-14 py-3.5 text-3xl font-extrabold">
          완료
        </button>
      </div>
    </div>
  );
}

/** 정답 별을 그리는 곳 — 놀이 판 위에 하나. 별이 다 날아가면 지운다 */
export function StarFly() {
  const [stars, setStars] = useState<number[]>([]);
  useEffect(
    () =>
      onStar(() => {
        const id = Date.now() + Math.random();
        setStars((s) => [...s, id]);
        window.setTimeout(() => setStars((s) => s.filter((x) => x !== id)), 1300);
      }),
    [],
  );
  if (!stars.length) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {stars.map((id) => (
        <span key={id} className="absolute left-1/2 top-1/2 animate-star-fly">
          <BigStar size="min(16vh, calc(12*var(--vw)))" />
        </span>
      ))}
    </div>
  );
}
