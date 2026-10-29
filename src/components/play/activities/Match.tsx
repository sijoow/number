"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Numeral, ThingArt } from "@/components/Art";
import { LINES } from "@/curriculum/lines";
import type { MatchRound } from "@/lib/rounds";
import { useStep } from "@/lib/steps";
import { sfx } from "@/lib/sfx";
import { starBurst } from "@/lib/stars";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { Dots } from "../Dots";
import { HandHint } from "../HandHint";
import type { OnDone } from "../types";

/*
 * 짝 연결하기 — 위 줄과 아래 줄의 짝을 선으로 잇는다(업체 판 그대로: 첫 판은 같은 차례라 선이 곧고, 다음 판은 섞여서 엇갈린다).
 *   same    같은 물건끼리
 *   number  숫자와 그 수만큼의 점
 * 카드에서 손가락을 떼지 않고 짝 카드까지 끌면 선이 따라오고, 짝이면 노란 선으로 남는다. 4살이 끌기 어려우면 위·아래를 차례로 눌러도 된다.
 * 점수는 판마다 — 한 번도 안 틀리고 다 이은 판 수.
 */

type Side = "t" | "b";
type End = { side: Side; key: string };
type Pt = { x: number; y: number };

const CARD = "min(17vh, calc(13*var(--vw)))";
const MOVE_PX = 12;

const idOf = (e: End) => `${e.side}:${e.key}`;

/** 판 안에서 el 의 가운데 — offset 으로 잰다(판이 톡 커지는 애니메이션 중에도 늘 같은 값. getBoundingClientRect 는 그 순간 크기를 준다) */
function centerIn(el: HTMLElement, root: HTMLElement): Pt {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  let cur: HTMLElement | null = el;
  while (cur && cur !== root) {
    x += cur.offsetLeft;
    y += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

function parse(id: string | null | undefined): End | null {
  const m = /^([tb]):(.+)$/.exec(id ?? "");
  return m ? { side: m[1] as Side, key: m[2] } : null;
}

export function Match({ rounds, onDone }: { rounds: MatchRound[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  useStep(idx, rounds.length);
  const [joined, setJoined] = useState<string[]>([]);
  const [sel, setSel] = useState<End | null>(null);
  const [pen, setPen] = useState<{ from: End; at: Pt; moved: boolean } | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [pts, setPts] = useState<Record<string, Pt>>({});
  const [score, setScore] = useState(0);
  const [clean, setClean] = useState(true);
  const [finished, setFinished] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const anchors = useRef(new Map<string, HTMLElement>());
  const start = useRef<{ x0: number; y0: number } | null>(null);
  const later = useTimers();
  const r = rounds[idx];
  const intro = r.by === "same" ? LINES.matchSame : LINES.matchNumber;

  useEffect(() => {
    void say(intro);
    return () => stopVoice();
  }, [intro]);

  // 이음 점 자리 — 판이 바뀌거나 화면 크기가 바뀌면 다시 잰다
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const next: Record<string, Pt> = {};
      anchors.current.forEach((a, id) => {
        next[id] = centerIn(a, el);
      });
      setPts(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [idx]);

  const finishRound = () => {
    const s = clean ? score + 1 : score;
    setScore(s);
    setFinished(true);
    starBurst();
    sfx.cheer();
    void say(pick(LINES.praise));
    later(() => {
      if (idx + 1 >= rounds.length) {
        onDone({ correct: s, total: rounds.length });
        return;
      }
      setIdx(idx + 1);
      setJoined([]);
      setClean(true);
      setFinished(false);
    }, 1700);
  };

  const attempt = (a: End, b: End) => {
    if (a.side === b.side) {
      setSel(b);
      return;
    }
    if (joined.includes(b.key) || joined.includes(a.key)) return;
    setSel(null);
    if (a.key === b.key) {
      const next = [...joined, a.key];
      setJoined(next);
      sfx.ding();
      if (next.length === r.top.length) finishRound();
      return;
    }
    setClean(false);
    sfx.ddaeng();
    setShake(idOf(b));
    later(() => setShake(null), 500);
    void say(pick(LINES.retry));
  };

  const tap = (e: End) => {
    if (sel && sel.side !== e.side) attempt(sel, e);
    else setSel(sel && idOf(sel) === idOf(e) ? null : e);
    sfx.tick();
  };

  // 손가락을 따라가는 선 — 끝나면(손을 떼면) 짝인지 본다. 판이 그린 그대로 따라가도록 처리기는 ref 로
  const act = useRef({ tap, attempt });
  useEffect(() => {
    act.current = { tap, attempt };
  });
  // 지금 긋는 선 — 창 이벤트 처리기가 최신 값을 읽도록 ref 에도 둔다
  const penRef = useRef(pen);
  const putPen = (p: typeof pen) => {
    penRef.current = p;
    setPen(p);
  };
  const drawing = pen !== null;
  useEffect(() => {
    if (!drawing) return;
    const rel = (e: PointerEvent): Pt => {
      const b = box.current?.getBoundingClientRect();
      return { x: e.clientX - (b?.left ?? 0), y: e.clientY - (b?.top ?? 0) };
    };
    const move = (e: PointerEvent) => {
      const p = penRef.current;
      const s = start.current;
      if (!p) return;
      const moved = p.moved || (!!s && Math.hypot(e.clientX - s.x0, e.clientY - s.y0) > MOVE_PX);
      penRef.current = { ...p, at: rel(e), moved };
      setPen(penRef.current);
    };
    const up = (e: PointerEvent) => {
      const p = penRef.current;
      penRef.current = null;
      start.current = null;
      setPen(null);
      if (!p) return;
      if (!p.moved) {
        act.current.tap(p.from);
        return;
      }
      const hit = parse(document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-card]")?.getAttribute("data-card"));
      if (hit) act.current.attempt(p.from, hit);
    };
    const cancel = () => {
      penRef.current = null;
      start.current = null;
      setPen(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [drawing]);

  const down = (e: End) => (ev: ReactPointerEvent) => {
    if (finished || joined.includes(e.key)) return;
    ev.preventDefault();
    const b = box.current?.getBoundingClientRect();
    start.current = { x0: ev.clientX, y0: ev.clientY };
    putPen({ from: e, at: { x: ev.clientX - (b?.left ?? 0), y: ev.clientY - (b?.top ?? 0) }, moved: false });
  };

  const face = (side: Side, key: string) => {
    if (r.by === "same") return <ThingArt id={key} size={`calc(${CARD} * 0.72)`} />;
    if (side === "t") return <Numeral n={key} style={{ fontSize: `calc(${CARD} * 0.62)` }} />;
    return <Dots n={Number(key)} size={`calc(${CARD} * 0.13)`} />;
  };

  const row = (side: Side, keys: string[]) => (
    <div className="relative z-10 flex w-full items-center justify-around">
      {keys.map((key) => {
        const e = { side, key };
        const id = idOf(e);
        const on = joined.includes(key);
        const picked = (sel && idOf(sel) === id) || (pen && idOf(pen.from) === id);
        return (
          <button
            key={id}
            type="button"
            data-card={id}
            aria-label={key}
            onPointerDown={down(e)}
            style={{ width: CARD, height: CARD, touchAction: "none" }}
            className={`relative grid place-items-center rounded-[1.6rem] bg-card shadow-[0_7px_0_var(--card-deep),0_14px_26px_-12px_rgb(62_58_82/0.35)] transition-transform ${on ? "ring-4 ring-butter-deep" : ""} ${picked ? "scale-105 ring-4 ring-brand" : ""} ${shake === id ? "animate-shake" : ""}`}
          >
            {face(side, key)}
            {/* 이음 점 — 위 줄은 카드 아래, 아래 줄은 카드 위 */}
            <span
              ref={(el) => {
                if (el) anchors.current.set(id, el);
                else anchors.current.delete(id);
              }}
              aria-hidden
              className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full ${on ? "bg-butter-deep" : "bg-ink-soft/50"} ${side === "t" ? "-bottom-6" : "-top-6"}`}
            />
          </button>
        );
      })}
    </div>
  );

  const from = pen?.moved ? pts[idOf(pen.from)] : undefined;

  return (
    <div className="flex min-h-full items-center justify-center-safe px-4 py-4">
      <div key={idx} ref={box} className="relative flex w-[min(94vw,62rem)] animate-pop-in flex-col items-center gap-[min(22vh,11rem)] rounded-[2rem] bg-mint/80 px-[2vw] py-[5vh] ring-4 ring-white/70">
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {joined.map((key) => {
            const a = pts[`t:${key}`];
            const b = pts[`b:${key}`];
            return a && b ? <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--butter-deep)" strokeWidth="7" strokeLinecap="round" /> : null;
          })}
          {from && pen && <line x1={from.x} y1={from.y} x2={pen.at.x} y2={pen.at.y} stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeDasharray="2 12" />}
        </svg>
        {row("t", r.top)}
        {row("b", r.bottom)}
        <HandHint on={idx === 0 && joined.length === 0} from={`[data-card="t:${r.top[0]}"]`} to={`[data-card="b:${r.top[0]}"]`} />
      </div>
    </div>
  );
}
