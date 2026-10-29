"use client";

import { useEffect, useRef, useState } from "react";

/** 손 — 검지를 편 하얀 장갑(손끝이 그림의 (28, 5) 쯤) */
function Hand({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <g fill="#fff" stroke="var(--ink)" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M22 30V10a6 6 0 0 1 12 0v18" />
        <path d="M34 28v-3a5.5 5.5 0 0 1 11 0v5" />
        <path d="M45 30v-2a5 5 0 0 1 10 0v12c0 12-8 20-19 20h-3c-8 0-13-4-17-10l-7-11a5 5 0 0 1 8-6l5 6V30" />
      </g>
    </svg>
  );
}

const SIZE = 64;
/** 손끝 자리 — 그림 왼쪽 위에서 */
const TIP = { x: 26, y: 4 };

/**
 * 손가락 시범 — from 에서 집어 to 에 놓는 길을 되풀이해서 보여 준다(2026-10-29 사용자: 업체 놀이 첫 판의 손가락 힌트처럼).
 * from·to 는 CSS 선택자. 아이가 화면을 한 번이라도 만지면 이 놀이에서는 다시 안 나온다. on 이 거짓이면(첫 판이 아니면 등) 쉰다.
 */
export function HandHint({ from, to, on = true, delay = 1600 }: { from: string; to: string; on?: boolean; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);
  const show = on && !touched;

  useEffect(() => {
    if (!show) return;
    const stop = () => setTouched(true);
    document.addEventListener("pointerdown", stop, true);
    return () => document.removeEventListener("pointerdown", stop, true);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    let anim: Animation | undefined;
    const id = window.setTimeout(() => {
      const a = document.querySelector(from)?.getBoundingClientRect();
      const b = document.querySelector(to)?.getBoundingClientRect();
      const el = ref.current;
      if (!a || !b || !el) return;
      const at = (r: DOMRect, s: number) => `translate(${r.left + r.width / 2 - TIP.x}px, ${r.top + r.height / 2 - TIP.y}px) scale(${s})`;
      anim = el.animate(
        [
          { transform: at(a, 1.1), opacity: 0 },
          { transform: at(a, 1.1), opacity: 1, offset: 0.12 },
          { transform: at(a, 0.92), opacity: 1, offset: 0.22 },
          { transform: at(b, 0.92), opacity: 1, offset: 0.68 },
          { transform: at(b, 1.05), opacity: 1, offset: 0.78 },
          { transform: at(b, 1.05), opacity: 0 },
        ],
        { duration: 2400, iterations: Infinity, easing: "ease-in-out" },
      );
    }, delay);
    return () => {
      window.clearTimeout(id);
      anim?.cancel();
    };
  }, [show, from, to, delay]);

  if (!show) return null;
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 z-40 opacity-0 drop-shadow-[0_6px_10px_rgb(62_58_82/0.35)]" style={{ transformOrigin: `${TIP.x}px ${TIP.y}px` }}>
      <Hand size={SIZE} />
    </div>
  );
}
