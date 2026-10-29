"use client";

import { range } from "@/curriculum/numbers";
import { doneOf, useSteps } from "@/lib/steps";

/** 작은 별 — 맞힌 문제 */
function TinyStar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[1.55rem] w-[1.55rem] animate-pop-in short:h-5 short:w-5">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill="var(--butter-deep)" stroke="#e39a1b" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 문제 진행 — 맞힌 문제는 ★, 지금 문제는 빨간 테두리 ●, 남은 문제는 흐린 ●(업체 놀이 위 진행 표시처럼, 2026-10-29).
 * 정답 별(StarFly)이 위로 날아오면 그 자리가 ★ 로 바뀐다. 놀이가 알려 준 게 없으면(lib/steps) 그리지 않는다.
 */
export function StepDots() {
  const s = useSteps();
  if (s.total < 2) return null;
  const done = doneOf(s);
  return (
    <div className="relative z-10 flex justify-center pt-1.5 short:pt-1">
      <ol className="glass flex items-center gap-1.5 rounded-full px-3 py-1 short:py-0.5" aria-label={`${s.total}문제 중 ${done}문제`}>
        {range(0, s.total - 1).map((i) => (
          <li key={i} className="grid h-[1.55rem] w-[1.55rem] place-items-center short:h-5 short:w-5">
            {i < done ? (
              <TinyStar />
            ) : (
              <span className={`block rounded-full ${i === s.idx ? "h-3.5 w-3.5 bg-white ring-[3px] ring-brand" : "h-2.5 w-2.5 bg-ink-soft/35"}`} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
