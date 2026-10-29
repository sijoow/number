"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

/*
 * 끌어 놓기 + 누르기 — 업체 놀이처럼 보기를 끌어다 칸([data-drop="이름"])에 놓는다. 4살 손이 서툴면 그냥 눌러도 된다
 * (손가락이 거의 안 움직이고 떼면 누른 것). 끄는 동안 손가락을 따라오는 그림은 games/drag 와 같은 방식(ghost 는 포인터를 받지 않는다).
 * 집는 쪽에는 style={{ touchAction: "none" }}.
 */

/** 이만큼(px) 움직여야 끄는 것으로 본다 — 그보다 적으면 누른 것 */
const MOVE_PX = 12;

export interface Held<T> {
  item: T;
  x: number;
  y: number;
  /** 끌기 시작했나(누르기와 구분) */
  moved: boolean;
  /** 지금 손가락 아래 놓을 곳 */
  over: string | null;
}

function dropAt(x: number, y: number): string | null {
  return document.elementFromPoint(x, y)?.closest("[data-drop]")?.getAttribute("data-drop") ?? null;
}

/** onRelease(item, 놓은 곳, 누른 것인지) — 누른 것이면 놓은 곳은 null */
export function useDragPick<T>(onRelease: (item: T, zone: string | null, tapped: boolean) => void): { held: Held<T> | null; begin: (item: T) => (e: ReactPointerEvent) => void } {
  const [held, setHeld] = useState<Held<T> | null>(null);
  const cur = useRef<(Held<T> & { x0: number; y0: number }) | null>(null);
  const cb = useRef(onRelease);
  useEffect(() => {
    cb.current = onRelease;
  });
  const active = held !== null;

  useEffect(() => {
    if (!active) return;
    const move = (e: PointerEvent) => {
      const c = cur.current;
      if (!c) return;
      const moved = c.moved || Math.hypot(e.clientX - c.x0, e.clientY - c.y0) > MOVE_PX;
      const next = { ...c, x: e.clientX, y: e.clientY, moved, over: moved ? dropAt(e.clientX, e.clientY) : null };
      cur.current = next;
      setHeld(next);
    };
    const end = (e: PointerEvent, ok: boolean) => {
      const c = cur.current;
      cur.current = null;
      setHeld(null);
      if (!c || !ok) return;
      if (c.moved) cb.current(c.item, dropAt(e.clientX, e.clientY), false);
      else cb.current(c.item, null, true);
    };
    const up = (e: PointerEvent) => end(e, true);
    const cancel = (e: PointerEvent) => end(e, false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [active]);

  const begin = (item: T) => (e: ReactPointerEvent) => {
    e.preventDefault();
    const c = { item, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, over: null };
    cur.current = c;
    setHeld(c);
  };

  return { held, begin };
}

/** 끄는 동안 손가락을 따라오는 그림 — 움직이기 시작한 뒤에만 */
export function HeldGhost<T>({ held, children }: { held: Held<T> | null; children: (item: T) => ReactNode }) {
  if (!held?.moved) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 scale-110 drop-shadow-[0_10px_14px_rgb(62_58_82/0.35)]" style={{ left: held.x, top: held.y }}>
      {children(held.item)}
    </div>
  );
}
