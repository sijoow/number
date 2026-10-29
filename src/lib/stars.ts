/**
 * 정답 별 — 문제를 맞히면 큰 별이 화면 가운데서 톡 나와 위로 날아간다(업체 정답 반응, 2026-10-28).
 * 놀이 쪽은 starBurst() 만 부르고, 그리는 건 놀이 판 위의 StarFly(components/play) 한 곳.
 */

const listeners = new Set<() => void>();

export function starBurst(): void {
  for (const l of listeners) l();
}

export function onStar(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
