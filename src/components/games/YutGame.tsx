"use client";

import { useEffect, useRef, useState } from "react";
import { FriendArt } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { toneStyle } from "@/components/ui";
import { CHILD } from "@/curriculum/child";
import { FAMILY_NAMES, humanHome, humanTurn, LINES, rankOf, stepAsk, stepCount, turnOf } from "@/curriculum/lines";
import { nameOf, range, sinoOf } from "@/curriculum/numbers";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";
import { finished, sameSpot, START, stationOf, STATIONS, walk, type Piece, type Station } from "@/lib/yut";
import type { OnDone } from "../play/types";
import { Die } from "./pieces";

/*
 * 주사위 윷놀이(2026-10-27 사용자) — 몇 명이서(둘이·셋이 — 혼자는 상대가 없어 게임이 안 돼서 뺐다, 사용자) → 컴퓨터랑(스스로 굴림) 또는 친구랑(사람이 직접, 이름도)
 * → 저마다 숫자 친구 고르기(십까지). 「주사위 굴리기」를 누르면 큰 주사위가 하늘에서 쿵 떨어져 도로로로 굴러가다 멈추고, 나온 수를 크게 말해 준다.
 * 차례인 사람이 반짝이는 칸을 하나씩 누르며 "한 칸, 두 칸"(컴퓨터는 스스로 세며 간다). 윷판 그대로: 모서리·가운데에 딱 멈추면 지름길,
 * 다른 말이 있는 칸에 멈추면 잡기(그 말은 처음부터 다시 출발, 잡은 쪽은 한 번 더), 6 도 한 번 더. 하온이가 도착하면 끝 — 몇 등인지.
 * 판 규칙은 lib/yut(순수 함수 + 테스트).
 */

type Kind = "me" | "cpu" | "human";

/** 고르는 중인 자리 — 이름(친구랑 하기)과 숫자 친구 */
interface Seat {
  kind: Kind;
  name: string;
  n: number | null;
}

interface Player {
  kind: Kind;
  /** 판에 보일 이름 — 하온이·엄마·(컴퓨터는) 숫자 친구 이름 */
  name: string;
  n: number;
  piece: Piece;
  /** 가는 동안 보여 줄 칸(한 칸씩) — 멈추면 null */
  show: Station | null;
  /** 도착 등수(아직이면 0) */
  rank: number;
}

interface Move {
  path: Station[];
  next: Piece;
  shortcut: boolean;
  k: number;
  done: number;
}

/** 가운데 큰 주사위 — key 가 바뀌면 다시 떨어진다, reveal 이면 나온 수를 크게 */
interface Drop {
  key: number;
  face: number;
  reveal: boolean;
}

/** 몇 명이서 — 늘 상대가 있다(LINES.yutModes 와 같은 차례) */
const SIZES = [2, 3] as const;

/** 주사위 — 1~6 */
function d6(): number {
  return 1 + Math.floor(Math.random() * 6);
}

/** 칸 자리 — 도착("end")은 출발 모서리에 */
function spot(st: Station): { x: number; y: number } {
  return STATIONS[st === "end" ? "o0" : st];
}

export function YutGame({ known, onDone }: { known: number; onDone: OnDone }) {
  const [size, setSize] = useState<number | null>(null);
  const [vs, setVs] = useState<"cpu" | "human" | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [draft, setDraft] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const pRef = useRef<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [face, setFace] = useState(1);
  const [drop, setDrop] = useState<Drop | null>(null);
  const drops = useRef(0);
  const [waiting, setWaiting] = useState<"roll" | "step" | null>(null);
  const [move, setMove] = useState<Move | null>(null);
  const [caption, setCaption] = useState("");
  const alive = useRef(true);
  const later = useTimers();

  useEffect(() => {
    alive.current = true;
    void say(LINES.yutHowMany);
    return () => {
      alive.current = false;
      stopVoice();
    };
  }, []);

  const sleep = (ms: number) => new Promise<void>((res) => later(res, ms));
  /** 말하고 기다리기 — 화면을 떠났으면 false(그 뒤 차례를 이어 가지 않는다) */
  const speak = async (texts: string | string[]) => {
    await say(texts);
    return alive.current;
  };
  const commit = (next: Player[]) => {
    pRef.current = next;
    setPlayers(next);
  };
  const showAt = (i: number, st: Station) => commit(pRef.current.map((p, j) => (j === i ? { ...p, show: st } : p)));
  const nextIndex = (i: number) => {
    const list = pRef.current;
    for (let s = 1; s <= list.length; s++) {
      const j = (i + s) % list.length;
      if (!list[j].rank) return j;
    }
    return i;
  };

  /** 주사위 — 하늘에서 쿵 떨어져 도로로로 구르다 멈추고(globals.css die-tumble), 나온 수를 크게 보여 주며 말한다 */
  const roll = async (): Promise<number> => {
    const k = d6();
    drops.current += 1;
    setDrop({ key: drops.current, face: d6(), reveal: false });
    for (let i = 0; i < 13; i++) later(() => setDrop((d) => d && { ...d, face: d6() }), i * 110);
    later(() => sfx.drum(), 510);
    for (const t of [830, 1060, 1280, 1400, 1480, 1540]) later(() => sfx.tick(), t);
    later(() => setDrop((d) => d && { ...d, face: k }), 1420);
    await sleep(1650);
    sfx.ding();
    setFace(k);
    setDrop((d) => d && { ...d, face: k, reveal: true });
    if (!(await speak(nameOf(k)))) return k;
    await sleep(450);
    setDrop(null);
    return k;
  };

  /** 멈춘 뒤 — 도착·지름길·잡기·한 번 더, 그리고 다음 차례 */
  const land = async (i: number, next: Piece, shortcut: boolean, k: number): Promise<void> => {
    if (!alive.current) return;
    let list = pRef.current.map((p, j) => (j === i ? { ...p, piece: next, show: null } : p));
    commit(list);
    const mover = list[i];

    if (finished(mover.piece)) {
      const rank = list.filter((p) => p.rank).length + 1;
      commit(list.map((p, j) => (j === i ? { ...p, rank } : p)));
      sfx.cheer();
      if (mover.kind === "me") {
        const words = list.length > 1 ? [LINES.yutHome, rankOf(rank)] : [LINES.yutHome];
        setCaption(words.join(" "));
        if (!(await speak(words))) return;
        await sleep(600);
        onDone({ correct: rank === 1 ? 1 : 0, total: 1 });
        return;
      }
      const words = mover.kind === "human" ? [humanHome(mover.name)] : [sinoOf(mover.n), LINES.yutHome];
      setCaption(mover.kind === "human" ? humanHome(mover.name) : `${mover.name} ${LINES.yutHome}`);
      if (!(await speak(words))) return;
      return startTurn(nextIndex(i));
    }

    let again = k === 6;
    if (shortcut) {
      sfx.ding();
      setCaption(LINES.yutShortcut);
      if (!(await speak(LINES.yutShortcut))) return;
    }
    const caught = list.map((p, j) => j !== i && !p.rank && sameSpot(p.piece, mover.piece));
    if (caught.some(Boolean)) {
      list = list.map((p, j) => (caught[j] ? { ...p, piece: START, show: null } : p));
      commit(list);
      sfx.boop();
      setCaption(`${LINES.yutCatch} ${LINES.yutBack}`);
      if (!(await speak([LINES.yutCatch, LINES.yutBack]))) return;
      again = true;
    }
    if (again) {
      setCaption(LINES.yutAgain);
      if (!(await speak(LINES.yutAgain))) return;
      return startTurn(i);
    }
    return startTurn(nextIndex(i));
  };

  /** 차례 — 사람(하온이·친구)이면 「주사위 굴리기」를 기다리고, 컴퓨터면 스스로 굴려서 한 칸씩 */
  const startTurn = async (i: number): Promise<void> => {
    if (!alive.current) return;
    setTurn(i);
    const p = pRef.current[i];
    if (p.kind !== "cpu") {
      const words = p.kind === "me" ? LINES.yutMyTurn : humanTurn(p.name);
      setCaption(words);
      setWaiting("roll");
      await speak(words);
      return;
    }
    setCaption(turnOf(p.n));
    if (!(await speak(turnOf(p.n)))) return;
    await sleep(250);
    const k = await roll();
    if (!alive.current) return;
    const w = walk(pRef.current[i].piece, k);
    for (let j = 0; j < w.path.length; j++) {
      showAt(i, w.path[j]);
      sfx.pop();
      setCaption(stepCount(j + 1));
      if (!(await speak(stepCount(j + 1)))) return;
    }
    return land(i, w.next, w.shortcut, k);
  };

  // ── 고르기 ──
  const cur = seats.findIndex((s) => s.n === null);
  const seat = cur >= 0 ? seats[cur] : null;
  const askOf = (s: Seat | undefined) => (!s ? null : s.kind === "human" && !s.name ? LINES.yutName : s.kind === "cpu" ? LINES.yutMode : LINES.yutPick);

  const chooseSize = (s: number) => {
    sfx.wake();
    sfx.pop();
    setSize(s);
    void say([LINES.yutModes[s - SIZES[0]], LINES.yutVs]);
  };

  const chooseVs = (v: "cpu" | "human") => {
    if (size === null) return;
    sfx.wake();
    sfx.pop();
    setVs(v);
    setSeats([{ kind: "me", name: CHILD.nick, n: null }, ...range(1, size - 1).map((): Seat => ({ kind: v, name: "", n: null }))]);
    void say([LINES.yutVsModes[v === "cpu" ? 0 : 1], LINES.yutPick]);
  };

  /** 친구랑 하기 — 이름 정하기(눌러서 고르거나 직접 써서) */
  const chooseName = (raw: string) => {
    const name = raw.trim().slice(0, 6);
    if (!name || cur < 0) return;
    sfx.wake();
    sfx.pop();
    setSeats(seats.map((s, j) => (j === cur ? { ...s, name } : s)));
    setDraft("");
    void say([name, LINES.yutPick]);
  };

  /** 숫자 친구 고르기 — 다 고르면 바로 시작 */
  const chooseFriend = (n: number) => {
    if (cur < 0 || seats.some((s) => s.n === n)) return;
    sfx.wake();
    sfx.pop();
    const next = seats.map((s, j) => (j === cur ? { ...s, n, name: s.kind === "cpu" ? sinoOf(n) : s.name } : s));
    setSeats(next);
    const ask = askOf(next[cur + 1]);
    if (ask) {
      void say([sinoOf(n), ask]);
      return;
    }
    sfx.ding();
    commit(next.map((s) => ({ kind: s.kind, name: s.name, n: s.n ?? 1, piece: START, show: null, rank: 0 })));
    void say(sinoOf(n)).then(() => startTurn(0));
  };

  // ── 판 위에서 — 사람 차례 ──
  const onRoll = async () => {
    if (waiting !== "roll") return;
    sfx.wake();
    setWaiting(null);
    const i = turn;
    const k = await roll();
    if (!alive.current) return;
    const w = walk(pRef.current[i].piece, k);
    setMove({ path: w.path, next: w.next, shortcut: w.shortcut, k, done: 0 });
    setCaption(stepAsk(k));
    setWaiting("step");
    void say(stepAsk(k));
  };

  // 차례인 사람이 누를 다음 칸 — 도착("end")은 출발 모서리(o0)를 누른다
  const target = waiting === "step" && move ? (move.path[move.done] === "end" ? "o0" : move.path[move.done]) : null;

  const onStation = (id: Station) => {
    if (!move || id !== target) return;
    sfx.wake();
    sfx.pop();
    const i = turn;
    const done = move.done + 1;
    showAt(i, move.path[move.done]);
    setCaption(stepCount(done));
    if (done < move.path.length) {
      setMove({ ...move, done });
      void say(stepCount(done));
      return;
    }
    const m = move;
    setMove(null);
    setWaiting(null);
    void say(stepCount(done)).then(() => land(i, m.next, m.shortcut, m.k));
  };

  const prompt = (text: string) => (
    <p className="glass rounded-full px-6 py-2 text-center text-2xl font-extrabold">
      <ReadAlong text={text} />
    </p>
  );

  // ── 1) 몇 명이서 ──
  if (size === null) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center-safe gap-[4vh] px-4 py-4">
        {prompt(LINES.yutHowMany)}
        <div className="flex flex-wrap items-stretch justify-center gap-4">
          {SIZES.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => chooseSize(s)}
              className="squish flex min-w-[min(28vw,12rem)] flex-col items-center justify-end gap-3 rounded-[2rem] px-5 pb-4 pt-5"
              style={toneStyle(i === 0 ? "mint" : "butter")}
            >
              <span className="flex items-end gap-1">
                {range(1, s).map((n) => (
                  <FriendArt key={n} n={n} height="min(13vh, 5.6rem)" />
                ))}
              </span>
              <span className="text-2xl font-extrabold">{LINES.yutModes[i]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── 2) 컴퓨터랑·친구랑 ──
  if (vs === null) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center-safe gap-[4vh] px-4 py-4">
        {prompt(LINES.yutVs)}
        <div className="flex flex-wrap items-stretch justify-center gap-4">
          {(["cpu", "human"] as const).map((v, i) => (
            <button
              key={v}
              type="button"
              onClick={() => chooseVs(v)}
              className="squish flex min-w-[min(34vw,14rem)] flex-col items-center justify-end gap-3 rounded-[2rem] px-5 pb-4 pt-5"
              style={toneStyle(v === "cpu" ? "lilac" : "peach")}
            >
              <span className="flex items-end gap-2">
                <FriendArt n={1} height="min(12vh, 5rem)" />
                {v === "cpu" ? (
                  <span className="grid h-[min(10vh,4.4rem)] w-[min(10vh,4.4rem)] place-items-center rounded-2xl bg-white/85 text-center text-sm font-extrabold leading-tight text-ink-soft">
                    스스로
                    <br />
                    굴려요
                  </span>
                ) : (
                  <span className="grid h-[min(10vh,4.4rem)] w-[min(10vh,4.4rem)] place-items-center rounded-2xl bg-white/85 text-center text-sm font-extrabold leading-tight text-ink-soft">
                    엄마
                    <br />
                    아빠
                  </span>
                )}
              </span>
              <span className="text-2xl font-extrabold">{LINES.yutVsModes[i]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 고른 자리 — 하온이·친구, 지금 고를 자리는 반짝
  const seatRow = (
    <div className="flex flex-wrap justify-center gap-3">
      {seats.map((s, j) => (
        <span key={j} className={`flex min-w-[5.5rem] flex-col items-center rounded-2xl px-2 py-1 ${j === cur ? "animate-breathe bg-white ring-4 ring-brand" : "bg-white/70"}`}>
          {s.n ? <FriendArt n={s.n} height="min(9vh, 3.8rem)" /> : <span className="grid h-[min(9vh,3.8rem)] place-items-center font-letter text-3xl font-extrabold text-ink-soft">?</span>}
          <span className="text-sm font-extrabold">{s.kind === "me" ? CHILD.nick : s.name || (s.kind === "cpu" ? "컴퓨터" : "친구")}</span>
        </span>
      ))}
    </div>
  );

  // ── 3) 이름(친구랑 하기) ──
  if (seat && seat.kind === "human" && !seat.name) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-4">
        {prompt(LINES.yutName)}
        {seatRow}
        <div className="flex max-w-[min(92vw,40rem)] flex-wrap justify-center gap-3">
          {FAMILY_NAMES.map((name) => (
            <button key={name} type="button" onClick={() => chooseName(name)} className="squish rounded-full px-6 py-3 text-2xl font-extrabold" style={toneStyle("butter")}>
              {name}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            chooseName(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={6}
            placeholder="직접 쓰기"
            aria-label="친구 이름 직접 쓰기"
            className="w-[11rem] rounded-full border-2 border-paper-deep bg-white px-5 py-3 text-xl font-bold outline-none focus:border-brand"
          />
          <button type="submit" disabled={!draft.trim()} className="cta rounded-full px-6 py-3 text-xl font-extrabold disabled:opacity-40">
            좋아
          </button>
        </form>
      </div>
    );
  }

  // ── 4) 숫자 친구 고르기(십까지) ──
  if (seat) {
    const ask = askOf(seat) ?? LINES.yutPick;
    return (
      <div className="flex min-h-full flex-col items-center gap-3 px-4 py-4">
        <p className="glass rounded-full px-6 py-2 text-center text-2xl font-extrabold">
          {seat.kind === "human" ? <span className="mr-2 text-brand">{seat.name}</span> : null}
          <ReadAlong text={ask} />
        </p>
        {seatRow}
        <div className="grid grid-cols-5 gap-3 portrait:gap-2">
          {range(1, known).map((n) => {
            const taken = seats.some((s) => s.n === n);
            return (
              <button
                key={n}
                type="button"
                aria-label={sinoOf(n)}
                onClick={() => chooseFriend(n)}
                disabled={taken}
                className={`squish flex flex-col items-center gap-1 rounded-[1.4rem] bg-white p-2 ${taken ? "opacity-35 grayscale" : ""}`}
              >
                <FriendArt n={n} height="min(12vh, 6rem)" />
                <span className="text-lg font-extrabold">{sinoOf(n)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 5) 윷판 ──
  const board = "min(74vh, calc(64*var(--vw)))";
  const piece = `calc(${board} * 0.13)`;
  const dot = `calc(${board} * 0.055)`;
  // 같은 칸에 선 말은 옆으로 비켜 선다
  const at = players.map((p) => (p.rank ? null : (p.show ?? stationOf(p.piece))));
  const offsetOf = (j: number) => {
    const here = at.map((s, i) => (s && s === at[j] ? i : -1)).filter((i) => i >= 0);
    return here.indexOf(j) - (here.length - 1) / 2;
  };
  const now = players[turn];

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center-safe gap-[2vh] px-3 py-3 landscape:flex-row landscape:gap-[3vw]">
      <div className="relative shrink-0" style={{ width: board, height: board }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect x="3" y="3" width="94" height="94" rx="6" fill="#fff4dd" stroke="#e7cfa4" strokeWidth="1.2" />
          <rect x="8" y="8" width="84" height="84" fill="none" stroke="#d6b47f" strokeWidth="1.4" />
          <line x1="92" y1="8" x2="8" y2="92" stroke="#d6b47f" strokeWidth="1.4" />
          <line x1="8" y1="8" x2="92" y2="92" stroke="#d6b47f" strokeWidth="1.4" />
        </svg>
        {Object.entries(STATIONS).map(([id, s]) => {
          const next = id === target;
          const size = s.big ? `calc(${dot} * 1.5)` : dot;
          return (
            <button
              key={id}
              type="button"
              aria-label={id === "o0" ? "출발·도착" : "칸"}
              onClick={() => onStation(id)}
              disabled={!next}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] ${s.big ? "border-[#c98a4b] bg-[#ffe3a8]" : "border-[#d6b47f] bg-white"} ${next ? "z-20 animate-breathe ring-8 ring-butter-deep" : ""}`}
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: size, height: size }}
            />
          );
        })}
        <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 text-sm font-extrabold text-brand" style={{ left: `${STATIONS.o0.x}%`, top: `calc(${STATIONS.o0.y}% + ${dot})` }}>
          출발·도착
        </span>
        {players.map((p, j) => {
          const st = at[j];
          if (!st) return null;
          const s = spot(st);
          return (
            <span
              key={j}
              className="pointer-events-none absolute z-10 -translate-x-1/2 transition-[left,top] duration-300 ease-out"
              style={{ left: `calc(${s.x}% + ${piece} * ${offsetOf(j) * 0.55})`, top: `calc(${s.y}% - ${piece} * 0.95)` }}
            >
              <FriendArt key={`${st}`} n={p.n} height={piece} className="animate-pop-in" />
            </span>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 landscape:w-[min(30vw,17rem)]">
        <div className="flex flex-wrap justify-center gap-2">
          {players.map((p, j) => (
            <span key={j} className={`flex flex-col items-center rounded-2xl px-2 py-1 ${j === turn && !p.rank ? "bg-white ring-4 ring-brand" : "bg-white/60"}`}>
              <FriendArt n={p.n} height="min(9vh, 3.6rem)" />
              <span className="text-sm font-extrabold">{p.name}</span>
              {p.rank > 0 && <span className="text-xs font-extrabold text-brand">{rankOf(p.rank)}</span>}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void onRoll()}
          disabled={waiting !== "roll"}
          className={`cta flex items-center gap-3 rounded-full px-6 py-3 text-2xl font-extrabold disabled:opacity-40 ${waiting === "roll" ? "animate-breathe" : ""}`}
        >
          <Die face={face} size="min(7vh, 2.8rem)" />
          주사위 굴리기
        </button>
        <p className="glass min-h-[2.6rem] min-w-[10rem] max-w-[min(90vw,18rem)] rounded-full px-5 py-2 text-center text-xl font-extrabold">
          {now && now.kind === "human" && waiting ? <span className="mr-1 text-brand">{now.name}</span> : null}
          {caption}
        </p>
      </div>

      {/* 가운데 큰 주사위 — 하늘에서 떨어져 구르다 멈추면 나온 수를 크게 */}
      {drop && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-white/25">
          <div className="relative grid place-items-center">
            <span key={drop.key} className="inline-block animate-die-tumble" style={{ filter: "drop-shadow(0 14px 10px rgb(62 58 82 / 0.3))" }}>
              <Die face={drop.face} size="min(30vh, calc(24*var(--vw)))" />
            </span>
            {drop.reveal && (
              <span className="absolute -top-[22%] grid animate-pop-in place-items-center rounded-full bg-white px-8 py-1 shadow-[0_10px_0_var(--paper-deep)]">
                <span className="font-letter font-extrabold leading-none text-brand" style={{ fontSize: "min(16vh, calc(12*var(--vw)))" }}>
                  {drop.face}
                </span>
                <span className="text-3xl font-extrabold">{nameOf(drop.face)}!</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
