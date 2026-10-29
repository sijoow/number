"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { HandHint } from "@/components/play/HandHint";
import { sfx } from "@/lib/sfx";
import { starBurst } from "@/lib/stars";
import { BOTTOM, DIGIT_H, DIGIT_W, HEAD_REACH, LANE, lengthsOf, MID, pathOf, pointAt, strokeDone, strokesOf, TOP, traceStep, type Pt } from "@/lib/strokes";

/*
 * 숫자 따라쓰기 판 — 업체 따라쓰기처럼(2026-10-29 사용자: 아이들이 숫자를 똑바로 못 쓴다, 범위를 벗어나지 않게 / 다 쓰면 저절로 성공).
 * 숫자가 굵은 획 길로 그려져 있고, 노란 펜 머리(화살표)가 그을 곳과 방향을 알려 준다. 펜 머리를 잡고 길을 따라 그으면
 * 지나간 곳만 칠해진다 — 길을 벗어나거나 뒤로 가면 더 칠해지지 않는다(lib/strokes traceStep). 한 획을 다 그으면 다음 획의 머리가 나오고,
 * 숫자를 다 쓰면 정답 별이 날아가고 onSuccess. 지우기는 없다(길 밖으로는 칠해지지 않으니 지울 게 없다).
 */

const LANE_EDGE = "#cbbdf0";
const LANE_FILL = "#efe9fb";
const INK = "var(--brand)";

export function StrokeBoard({ text, width, onSuccess }: { text: string; width: string; onSuccess: () => void }) {
  const strokes = useMemo(() => strokesOf(text), [text]);
  const lens = useMemo(() => strokes.map(lengthsOf), [strokes]);
  const vbw = DIGIT_W * Math.max(1, text.length);
  const [idx, setIdx] = useState(0);
  const [s, setS] = useState(0);
  const [done, setDone] = useState(false);
  const [off, setOff] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  // 지금 긋는 중인가(펜 머리 근처를 눌렀나) — 움직일 때마다 렌더하지 않게 ref
  const active = useRef(false);
  const cur = useRef({ idx: 0, s: 0 });

  const stroke = strokes[idx];
  const len = lens[idx];
  const head = stroke && len ? pointAt(stroke, len, s) : null;
  const aim = strokes[0] && lens[0] ? pointAt(strokes[0], lens[0], lens[0][lens[0].length - 1] * 0.45).p : null;

  /** 화면 좌표 → 판 좌표 */
  const local = (e: PointerEvent): Pt | null => {
    const r = svg.current?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return [((e.clientX - r.left) / r.width) * vbw, ((e.clientY - r.top) / r.height) * DIGIT_H];
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (done || !stroke || !len) return;
    const p = local(e);
    if (!p) return;
    const h = pointAt(stroke, len, cur.current.s).p;
    // 펜 머리 근처를 눌러야 시작 — 엉뚱한 데를 누르면 머리가 톡 흔들려 여기라고 알려 준다
    if (Math.hypot(p[0] - h[0], p[1] - h[1]) > HEAD_REACH) {
      setOff(true);
      sfx.tick();
      return;
    }
    active.current = true;
    setOff(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!active.current || done) return;
    const p = local(e);
    const { idx: i, s: now } = cur.current;
    const st = strokes[i];
    const ln = lens[i];
    if (!p || !st || !ln) return;
    const r = traceStep(st, ln, now, p);
    if (r.off) {
      // 길을 벗어났다 — 칠해지지 않고 머리가 흔들린다(한 번만 소리)
      if (!off) sfx.boop();
      setOff(true);
      return;
    }
    if (off) setOff(false);
    if (r.s <= now) return;
    if (!strokeDone(ln, r.s)) {
      cur.current = { idx: i, s: r.s };
      setS(r.s);
      return;
    }
    // 한 획 끝
    active.current = false;
    if (i + 1 < strokes.length) {
      sfx.pop();
      cur.current = { idx: i + 1, s: 0 };
      setIdx(i + 1);
      setS(0);
      return;
    }
    cur.current = { idx: i, s: ln[ln.length - 1] };
    setS(ln[ln.length - 1]);
    setDone(true);
    starBurst();
    onSuccess();
  };

  const up = () => {
    active.current = false;
  };

  return (
    <div className={`relative rounded-[2.4rem] bg-card p-3 shadow-[0_8px_0_var(--paper-deep)] ${done ? "animate-wiggle" : ""}`} style={{ width }}>
      <svg
        ref={svg}
        viewBox={`0 0 ${vbw} ${DIGIT_H}`}
        className="block w-full touch-none select-none"
        style={{ aspectRatio: `${vbw} / ${DIGIT_H}` }}
        role="img"
        aria-label={`${text} 따라 쓰기`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {/* 공책 줄 — 위 줄 · 가운데 점선 · 아래 줄 */}
        <line x1="0" x2={vbw} y1={TOP} y2={TOP} stroke="#e6e0f0" strokeWidth="1.2" />
        <line x1="0" x2={vbw} y1={MID} y2={MID} stroke="#e6e0f0" strokeWidth="1.2" strokeDasharray="4 4" />
        <line x1="0" x2={vbw} y1={BOTTOM} y2={BOTTOM} stroke="#e6e0f0" strokeWidth="1.2" />
        {/* 획 길 */}
        {strokes.map((st, k) => (
          <g key={`lane-${k}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={pathOf(st)} stroke={LANE_EDGE} strokeWidth={LANE + 3} />
            <path d={pathOf(st)} stroke={LANE_FILL} strokeWidth={LANE} />
          </g>
        ))}
        {/* 칠한 곳 — 다 그은 획은 끝까지, 지금 획은 그은 만큼 */}
        {strokes.map((st, k) => {
          const total = lens[k][lens[k].length - 1];
          const drawn = done || k < idx ? total : k === idx ? s : 0;
          if (drawn < 0.5) return null;
          return (
            <path
              key={`ink-${k}`}
              d={pathOf(st)}
              fill="none"
              stroke={INK}
              strokeWidth={LANE - 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={total}
              strokeDasharray={`${drawn} ${total}`}
            />
          );
        })}
        {/* 손가락 시범이 가리킬 곳 — 첫 획 가운데쯤 */}
        {aim && <circle data-trace-aim="" cx={aim[0]} cy={aim[1]} r="1" fill="transparent" />}
        {/* 펜 머리 — 그을 곳과 방향 */}
        {head && !done && (
          <g transform={`translate(${head.p[0]} ${head.p[1]}) rotate(${(head.angle * 180) / Math.PI})`}>
            <g data-trace-head="" className={off ? "animate-shake" : "animate-breathe"} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle r="10.5" fill="#f5b52e" stroke="#fff" strokeWidth="2.5" />
              <path d="M-4.5 0 H4.5 M1 -3.6 L4.5 0 L1 3.6" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        )}
      </svg>
      {done && <span className="pointer-events-none absolute -right-4 -top-4 grid h-16 w-16 animate-pop-in place-items-center rounded-full bg-mint-deep text-4xl text-white">✓</span>}
      <HandHint on={!done && idx === 0 && s === 0} from="[data-trace-head]" to="[data-trace-aim]" delay={2200} />
    </div>
  );
}

/** 따라쓰기 판 가로 — 숫자 칸(세로로 긴 칸) 수에 맞춰 화면 높이·폭 안에 */
export function strokeBoardWidth(digits: number): string {
  const aspect = (DIGIT_W * Math.max(1, digits)) / DIGIT_H;
  // 세로 화면은 --vw 가 커서(1.45vw) 두 자리 판이 화면을 넘지 않게 90vw 로도 막는다
  return `min(calc(72vh * ${aspect.toFixed(3)}), calc(${digits > 1 ? 84 : 50}*var(--vw)), 90vw, ${digits > 1 ? 56 : 30}rem)`;
}
