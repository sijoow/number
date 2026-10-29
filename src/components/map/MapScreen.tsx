"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FriendTight } from "@/components/Art";
import { ModeShell } from "@/components/ModeShell";
import { PlayIcon, Splash, UiIcon } from "@/components/ui";
import {
  CHAPTERS,
  DAYS_PER_CHAPTER,
  isStampDay,
  LEVEL_NAMES,
} from "@/curriculum/course";
import { CHILD } from "@/curriculum/child";
import { LINES } from "@/curriculum/lines";
import { range } from "@/curriculum/numbers";
import type { Chapter, Level } from "@/curriculum/types";
import { imageOf } from "@/lib/assets";
import { useIsMaster } from "@/lib/auth";
import { usePortrait } from "@/lib/orientation";
import { canPlayToday, type Progress } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { useSaved, useToday } from "@/lib/store";
import { say, stopVoice } from "@/lib/voice";

/*
 * 모험 지도 — 장 = 섬, 그 장의 5일 = 섬 안의 길(2026-10-29 사용자: 하루 미션을 깨며 레벨업하는 업체 구성처럼, 모험 지도 화면).
 * 레벨(A 유아 · B 유치원 기초)마다 섬 열 개가 길로 이어진다 — 지나온 섬은 ✓ 와 도장·만난 친구, 지금 섬은 반짝이며 하온이 얼굴, 앞 섬은 잠김.
 * 섬을 누르면 아래에 그 섬의 5일 길(5일째는 도장 놀이 ★) — 오늘 칸의 「시작」으로 바로 오늘의 놀이. 그림·모양은 우리 것(업체 화면을 옮기지 않는다).
 */

type Spot = "done" | "here" | "locked";

function spotOf(p: Progress, c: Chapter): Spot {
  return c.no < p.chapter ? "done" : c.no === p.chapter ? "here" : "locked";
}

/** 그 장의 d일째 — 지나간 날·오늘·앞날 */
function daySpot(p: Progress, c: Chapter, d: number): Spot {
  const s = spotOf(p, c);
  if (s !== "here") return s;
  if (p.practice) return d === DAYS_PER_CHAPTER ? "here" : "done";
  return d < p.day ? "done" : d === p.day ? "here" : "locked";
}

/** 하온이 얼굴 — 지금 섬·오늘 칸 위 */
function Face({ size }: { size: string }) {
  const face = imageOf("child:face");
  return (
    <span
      className="relative grid animate-float place-items-center overflow-hidden rounded-full bg-brand font-extrabold text-white ring-[3px] ring-white"
      style={{ width: size, height: size }}
    >
      {face ? (
        <Image
          src={face}
          alt={CHILD.nick}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        [...CHILD.full][1]
      )}
    </span>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid h-7 w-7 place-items-center rounded-full bg-mint-deep text-sm text-white ring-2 ring-white ${className}`}
    >
      <UiIcon name="check" />
    </span>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 24 24" width="0.9em" height="0.9em" aria-hidden>
      <rect
        x="5"
        y="10.5"
        width="14"
        height="10"
        rx="2.5"
        fill="currentColor"
      />
      <path
        d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
    </svg>
  );
}

/** 섬 하나 — 둥근 섬에 장 번호, 아래에 제목 */
function Island({
  c,
  spot,
  stamp,
  picked,
  size,
  onPick,
}: {
  c: Chapter;
  spot: Spot;
  stamp: boolean;
  picked: boolean;
  size: string;
  onPick: () => void;
}) {
  const tone =
    spot === "here"
      ? "bg-brand text-white"
      : spot === "done"
        ? "bg-butter text-ink"
        : "bg-paper-deep text-ink-soft";
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`${c.no}장 ${c.title}`}
      className="relative flex flex-col items-center gap-1 active:scale-95"
    >
      {spot === "here" && (
        <span className="absolute -top-[1.9rem] z-10">
          <Face size="2.6rem" />
        </span>
      )}
      <span
        className={`relative grid place-items-center rounded-full font-extrabold shadow-[0_7px_0_rgb(62_58_82/0.18)] transition-transform ${tone} ${spot === "here" ? "animate-breathe ring-[6px] ring-brand-soft" : ""} ${picked ? "scale-110 outline outline-4 outline-offset-4 outline-white" : ""}`}
        style={{ width: size, height: size, fontSize: `calc(${size} * 0.42)` }}
      >
        {spot === "locked" ? <Lock /> : c.no}
        {spot === "done" && <Check className="absolute -right-1 -top-1" />}
        {stamp && (
          <span className="absolute -bottom-1 -right-2 rounded-full bg-white px-1.5 text-xs font-extrabold text-brand-deep shadow">
            도장
          </span>
        )}
      </span>
      <span
        className={`max-w-[9rem] text-center text-sm font-extrabold leading-tight break-keep ${spot === "locked" ? "text-ink-soft/70" : "text-ink"} ${spot === "here" ? "mt-2" : ""}`}
      >
        {c.title}
      </span>
      {spot === "done" && c.meets.length > 0 && (
        <span className="flex -space-x-2">
          {c.meets.slice(0, 5).map((n) => (
            <FriendTight key={n} n={n} height="1.8rem" />
          ))}
        </span>
      )}
    </button>
  );
}

/** 고른 섬의 5일 길 — 5일째는 도장 놀이(★) */
function DayPath({
  p,
  c,
  canPlay,
  onStart,
}: {
  p: Progress;
  c: Chapter;
  canPlay: boolean;
  onStart: () => void;
}) {
  return (
    <div className="glass mx-auto flex w-full max-w-[40rem] flex-col items-center gap-2 rounded-[1.8rem] px-4 pb-4 pt-3 landscape:mx-0 landscape:w-[21rem] landscape:shrink-0">
      <p className="text-center text-lg font-extrabold">
        {c.no}장 · {c.title}{" "}
        <span className="text-base text-ink-soft">({c.code})</span>
      </p>
      <div className="relative flex w-full items-end justify-between px-2">
        <span
          aria-hidden
          className="absolute inset-x-6 bottom-[1.6rem] h-1.5 rounded-full bg-white/80"
        />
        {range(1, DAYS_PER_CHAPTER).map((d) => {
          const s = daySpot(p, c, d);
          const stamp = isStampDay(d);
          return (
            <span key={d} className="relative flex flex-col items-center gap-1">
              {s === "here" && <Face size="2.2rem" />}
              <span
                className={`relative grid h-[3.2rem] w-[3.2rem] place-items-center rounded-full text-xl font-extrabold ${s === "here" ? "bg-brand text-white ring-4 ring-brand-soft" : s === "done" ? "bg-butter" : "bg-paper-deep text-ink-soft"}`}
              >
                {stamp ? "★" : d}
                {s === "done" && (
                  <Check className="absolute -right-1.5 -top-1.5 h-5 w-5 text-[0.65rem]" />
                )}
              </span>
              <span className="text-xs font-bold text-ink-soft">
                {stamp
                  ? p.practice && s === "here"
                    ? "연습"
                    : "도장"
                  : `${d}일`}
              </span>
            </span>
          );
        })}
      </div>
      {spotOf(p, c) === "here" &&
        (canPlay ? (
          <button
            type="button"
            onClick={onStart}
            className="cta mt-1 flex items-center gap-2 rounded-full px-10 py-2.5 text-2xl font-extrabold"
          >
            <PlayIcon /> 시작
          </button>
        ) : (
          <p className="text-base font-bold text-ink-soft">
            오늘 놀이는 끝 — 내일 또 만나요
          </p>
        ))}
      {spotOf(p, c) === "locked" && (
        <p className="text-base font-bold text-ink-soft">
          앞 섬을 다 지나면 열려요
        </p>
      )}
    </div>
  );
}

export default function MapScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const today = useToday();
  const router = useRouter();
  const portrait = usePortrait();
  const here = saved
    ? CHAPTERS.find((c) => c.no === saved.progress.chapter)
    : undefined;
  const [level, setLevel] = useState<Level | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    void say(LINES.map);
    return () => stopVoice();
  }, []);

  if (!saved) return <Splash />;
  const p = saved.progress;
  const lv: Level = level ?? here?.level ?? "B";
  const list = CHAPTERS.filter((c) => c.level === lv);
  const chosen = list.find((c) => c.no === (picked ?? here?.no)) ?? list[0];
  const levels = [...new Set(CHAPTERS.map((c) => c.level))];
  const cols = portrait ? 2 : 5;
  const rows = Math.ceil(list.length / cols);
  // 뱀 모양 길 — 짝수 줄은 왼쪽→오른쪽, 홀수 줄은 오른쪽→왼쪽
  const cell = (i: number) => {
    const row = Math.floor(i / cols);
    const col = row % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    return { row, col };
  };
  const size = portrait ? "min(9vh, 4.6rem)" : "min(11vh, 4.6rem)";
  const canPlay = master || canPlayToday(p, saved.settings, today);

  return (
    <ModeShell title="모험 지도" icon="🗺️" iconId="menu:map" scene="home">
      <div className="mx-auto flex min-h-full w-full max-w-[76rem] flex-col gap-3 px-4 pb-4 pt-1">
        {/* 레벨 넘기기 */}
        <div className="flex items-center justify-center gap-3">
          {levels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                sfx.tick();
                setLevel(l);
                setPicked(null);
              }}
              className={`rounded-full px-5 py-1.5 text-lg font-extrabold ${l === lv ? "bg-brand text-white" : "glass text-ink-soft"}`}
            >
              레벨 {l} · {LEVEL_NAMES[l]}
            </button>
          ))}
        </div>

        {/* 가로 화면은 섬 옆에 5일 길, 세로 화면은 아래에 */}
        <div className="flex flex-1 flex-col gap-3 landscape:flex-row landscape:items-center">
          {/* 섬 — 뱀 모양 길로 이어진다 */}
          <div
            className="relative mx-auto grid w-full flex-1 pt-8"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, auto)`,
              rowGap: "2.4rem",
            }}
          >
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full pt-8"
              viewBox={`0 0 ${cols} ${rows}`}
              preserveAspectRatio="none"
            >
              <polyline
                points={list
                  .map((_, i) => `${cell(i).col + 0.5},${cell(i).row + 0.32}`)
                  .join(" ")}
                fill="none"
                stroke="white"
                strokeOpacity="0.85"
                strokeWidth="7"
                strokeDasharray="2 14"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {list.map((c, i) => {
              const { row, col } = cell(i);
              return (
                <div
                  key={c.no}
                  className="relative flex justify-center"
                  style={{ gridRow: row + 1, gridColumn: col + 1 }}
                >
                  <Island
                    c={c}
                    spot={spotOf(p, c)}
                    stamp={p.stamps.includes(c.no)}
                    picked={chosen.no === c.no}
                    size={size}
                    onPick={() => {
                      sfx.pop();
                      setPicked(c.no);
                    }}
                  />
                </div>
              );
            })}
          </div>

          <DayPath
            p={p}
            c={chosen}
            canPlay={canPlay}
            onStart={() => {
              sfx.wake();
              router.push("/play");
            }}
          />
        </div>
      </div>
    </ModeShell>
  );
}
