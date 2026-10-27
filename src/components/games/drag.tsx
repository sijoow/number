"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

/*
 * 끌어 놓기 — 손가락(포인터)으로 집어서 놓을 곳([data-drop="이름"])에 놓는다(2026-10-27 사용자: 그림자·간식은 고르기 말고 끌어다 놓기).
 * 집은 것은 손가락을 따라오는 그림(ghost)으로 그린다 — ghost 는 포인터를 받지 않아서 손가락 아래의 놓을 곳이 잡힌다.
 * 집는 쪽에는 style={{ touchAction: "none" }} 을 줘서 끄는 동안 화면이 스크롤되지 않게 한다.
 */

export interface Drag<T> {
  item: T;
  x: number;
  y: number;
  /** 지금 손가락 아래 놓을 곳 — 놓을 곳을 반짝이게 할 때 */
  over: string | null;
}

function dropAt(x: number, y: number): string | null {
  return document.elementFromPoint(x, y)?.closest("[data-drop]")?.getAttribute("data-drop") ?? null;
}

export function useDragDrop<T>(onDrop: (item: T, zone: string | null) => void): { drag: Drag<T> | null; begin: (item: T) => (e: ReactPointerEvent) => void } {
  const [drag, setDrag] = useState<Drag<T> | null>(null);
  const cur = useRef<Drag<T> | null>(null);
  const dropRef = useRef(onDrop);
  useEffect(() => {
    dropRef.current = onDrop;
  });
  const active = drag !== null;

  useEffect(() => {
    if (!active) return;
    const move = (e: PointerEvent) => {
      if (!cur.current) return;
      const d = { ...cur.current, x: e.clientX, y: e.clientY, over: dropAt(e.clientX, e.clientY) };
      cur.current = d;
      setDrag(d);
    };
    const end = (e: PointerEvent, drop: boolean) => {
      const d = cur.current;
      cur.current = null;
      setDrag(null);
      if (d) dropRef.current(d.item, drop ? dropAt(e.clientX, e.clientY) : null);
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
    const d = { item, x: e.clientX, y: e.clientY, over: dropAt(e.clientX, e.clientY) };
    cur.current = d;
    setDrag(d);
  };

  return { drag, begin };
}

/** 손가락을 따라오는 그림 */
export function DragGhost<T>({ drag, children }: { drag: Drag<T> | null; children: (item: T) => ReactNode }) {
  if (!drag) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 scale-110 drop-shadow-[0_10px_14px_rgb(62_58_82/0.35)]" style={{ left: drag.x, top: drag.y }}>
      {children(drag.item)}
    </div>
  );
}
