"use client";

import { useEffect, useSyncExternalStore } from "react";
import { onStar } from "@/lib/stars";

/*
 * 지금 놀이의 문제 진행 — 위쪽 ●●●●● 가 맞힐 때마다 ★ 로 바뀐다(2026-10-29 사용자: 업체 놀이처럼 문제별 진행 표시).
 * 놀이는 useStep(지금 문제 번호, 모두 몇 문제) 한 줄만 — 보기 놀이(useChoice)는 거기서 대신 부른다.
 * 맞혔는지는 정답 별(lib/stars)로 안다: 한 문제 안에서 별이 나오면 그 문제가 ★. 그리는 건 components/play/StepDots.
 */

export interface Steps {
  /** 모두 몇 문제 — 0 이면 보이지 않는다 */
  total: number;
  /** 지금 문제(0부터) */
  idx: number;
  /** 지금 문제를 맞혔나 — 다음 문제로 넘어가기 전 잠깐 */
  solved: boolean;
}

const EMPTY: Steps = { total: 0, idx: 0, solved: false };
let cur: Steps = EMPTY;
const listeners = new Set<() => void>();

function set(next: Steps): void {
  cur = next;
  listeners.forEach((l) => l());
}

onStar(() => {
  if (cur.total) set({ ...cur, solved: true });
});

/** 맞힌 문제 수 — ★ 개수 */
export function doneOf(s: Steps): number {
  return Math.min(s.total, s.idx + (s.solved ? 1 : 0));
}

/** 놀이가 지금 문제를 알린다 — 판이 사라지면 표시도 지운다 */
export function useStep(idx: number, total: number): void {
  useEffect(() => {
    if (cur.total !== total || cur.idx !== idx) set({ total, idx, solved: false });
  }, [idx, total]);
  useEffect(() => () => set(EMPTY), []);
}

export function useSteps(): Steps {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => cur,
    () => EMPTY,
  );
}
