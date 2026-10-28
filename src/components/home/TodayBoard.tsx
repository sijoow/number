"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FriendTight, Numeral } from "@/components/Art";
import { OriginalArt } from "@/components/games/OriginalArt";
import { Icon } from "@/components/Icon";
import { PlayIcon, toneStyle, UiIcon, type Tone } from "@/components/ui";
import { chapterOf } from "@/curriculum/course";
import { blockColor } from "@/curriculum/friends";
import { gameOf } from "@/curriculum/games";
import { attendBoard, LINES } from "@/curriculum/lines";
import { range } from "@/curriculum/numbers";
import { originalOf } from "@/curriculum/originals";
import { missionState, type Mission } from "@/lib/missions";
import { checkIn, claimMissions, currentSession, TRAIN_CARS, trainOf, type Progress } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved } from "@/lib/store";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";

/*
 * 오늘의 미션 판 — 첫 화면에서 하루 첫 방문(출석 전)과 미션을 다 하고 도장을 안 받았을 때 저절로 뜬다(2026-10-28 사용자).
 *   위   출석 기차 — 반짝이는 칸을 누르면 그날의 숫자 친구가 탄다("오늘은 넷째 날! 사가 탔어!"). 일곱째 날 칠이 타면 기차 출발 + 블록 7개
 *   아래 오늘의 미션 셋(lib/missions) — 누르면 그 놀이로 바로. 다 하면 「참 잘했어요」 도장(토도수학 오늘의 목표 COMPLETE 도장처럼) + 블록 3개
 * 기차·도장은 단순한 물건이라 SVG·CSS 로 그린다(친구는 늘 생성 그림 — FriendTight).
 */

/** 기관차 — 왼쪽을 보고 달린다 */
export function TrainEngine({ w }: { w: string }) {
  return (
    <svg viewBox="0 0 130 100" aria-hidden className="shrink-0" style={{ width: `calc(${w} * 1.4)`, height: `calc(${w} * 1.08)` }}>
      <rect x="34" y="8" width="14" height="22" rx="3" fill="#3e3a52" />
      <rect x="28" y="4" width="26" height="9" rx="4" fill="#3e3a52" />
      <rect x="14" y="30" width="70" height="44" rx="14" fill="#ef6a6a" />
      <rect x="76" y="14" width="46" height="60" rx="8" fill="#4fa8e6" />
      <rect x="84" y="22" width="30" height="22" rx="6" fill="#e8f6ff" />
      <path d="M14 66 L2 82 L22 82 Z" fill="#f5cd36" />
      <rect x="10" y="70" width="114" height="10" rx="4" fill="#c84b4b" />
      <circle cx="34" cy="84" r="12" fill="#3e3a52" />
      <circle cx="34" cy="84" r="5" fill="#ffffff" />
      <circle cx="98" cy="84" r="12" fill="#3e3a52" />
      <circle cx="98" cy="84" r="5" fill="#ffffff" />
    </svg>
  );
}

/** 출석 기차 — 기관차 + 칸 일곱. 탄 칸엔 그 숫자 친구(칸 색 = 친구 색), 오늘 탈 칸은 반짝 */
export function AttendTrain({ boarded, glow, w, className = "" }: { boarded: number; glow: boolean; w: string; className?: string }) {
  return (
    <span className={`flex items-end gap-[3px] ${className}`}>
      <TrainEngine w={w} />
      {range(1, TRAIN_CARS).map((k) => {
        const on = k <= boarded;
        const next = glow && k === boarded + 1;
        const color = blockColor(k, 0);
        return (
          <span key={k} className={`relative flex shrink-0 flex-col items-center ${next ? "animate-breathe" : ""}`} style={{ width: w }}>
            <span className="relative w-full" style={{ height: `calc(${w} * 0.95)` }}>
              {on && (
                <span key={`on-${k}`} className="absolute bottom-[-12%] left-1/2 -translate-x-1/2 animate-pop-in">
                  <FriendTight n={k} height={`calc(${w} * 1.05)`} />
                </span>
              )}
            </span>
            <span
              className="relative grid w-full place-items-center rounded-[18%_18%_12%_12%]"
              style={{
                height: `calc(${w} * 0.58)`,
                // 칠은 무지개 친구라 칸도 무지개
                background: !on ? "#ffffff" : k === 7 ? "linear-gradient(90deg, #e84a3f, #f39a2b, #f5cd36, #5cbf4f, #3fb6e3, #4c6fe0, #9b59d0)" : color.fill,
                border: `3px ${next ? "dashed" : "solid"} ${next ? "var(--brand)" : on ? (color.edge ?? "rgb(0 0 0 / 0.14)") : "rgb(62 58 82 / 0.16)"}`,
              }}
            >
              <span className="grid place-items-center rounded-full bg-white/90 px-[0.35em] font-letter font-extrabold leading-tight text-ink" style={{ fontSize: `calc(${w} * 0.3)` }}>
                {k}
              </span>
            </span>
            <span className="-mt-[8%] flex w-full justify-around">
              <span className="rounded-full bg-ink" style={{ width: `calc(${w} * 0.22)`, height: `calc(${w} * 0.22)` }} />
              <span className="rounded-full bg-ink" style={{ width: `calc(${w} * 0.22)`, height: `calc(${w} * 0.22)` }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** 「참 잘했어요」 도장 — ghost 면 자리만(점선), stamped 면 빨간 도장 */
function Stamp({ state, size }: { state: "ghost" | "ready" | "stamped" | "new"; size: string }) {
  const stamped = state === "stamped" || state === "new";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-center font-extrabold leading-tight ${state === "new" ? "animate-stamp-in" : stamped ? "-rotate-12" : ""} ${state === "ready" ? "animate-breathe" : ""}`}
      style={{
        width: size,
        height: size,
        fontSize: `calc(${size} * 0.17)`,
        color: stamped ? "#e04a3a" : state === "ready" ? "var(--brand)" : "rgb(62 58 82 / 0.3)",
        border: `calc(${size} * 0.05) ${stamped ? "double" : "dashed"} currentColor`,
        background: stamped ? "rgb(255 255 255 / 0.85)" : state === "ready" ? "rgb(255 255 255 / 0.9)" : "transparent",
      }}
    >
      {stamped ? (
        <>
          참 잘
          <br />
          했어요
        </>
      ) : state === "ready" ? (
        <>
          도장
          <br />
          쾅!
        </>
      ) : (
        "도장"
      )}
    </span>
  );
}

interface MissionInfo {
  title: string;
  sub: string;
  tone: Tone;
  art: ReactNode;
  href: string;
}

function infoOf(m: Mission, p: Progress, art: string): MissionInfo {
  switch (m.kind) {
    case "lesson": {
      const chapter = chapterOf(currentSession(p)?.plan.chapter ?? p.chapter);
      return {
        title: "오늘의 놀이",
        sub: chapter ? `${chapter.no}장 · ${chapter.title}` : "오늘의 학습",
        tone: "peach",
        art: (
          <span className="grid place-items-center rounded-full bg-brand text-white" style={{ width: `calc(${art} * 0.8)`, height: `calc(${art} * 0.8)`, fontSize: `calc(${art} * 0.4)` }}>
            <PlayIcon />
          </span>
        ),
        href: "/play",
      };
    }
    case "free": {
      const g = gameOf(m.game);
      return {
        title: g?.title ?? "놀이터",
        sub: "복습 놀이",
        tone: g?.tone ?? "sky",
        art: (
          <span style={{ fontSize: `calc(${art} * 0.72)` }}>
            <Icon id={`play:${m.game}`} emoji={g?.icon ?? "🎮"} />
          </span>
        ),
        href: `/free?g=${m.game}`,
      };
    }
    case "game": {
      const o = originalOf(m.game);
      return { title: o?.title ?? "숫자 놀이", sub: "숫자 놀이", tone: o?.tone ?? "lilac", art: <OriginalArt id={m.game} h={`calc(${art} * 0.8)`} />, href: `/games?g=${m.game}` };
    }
    case "write":
      return {
        title: `숫자 ${m.n} 쓰기`,
        sub: "숫자 쓰기",
        tone: "mint",
        art: (
          <span className="grid place-items-center rounded-[1.2rem] bg-white" style={{ width: `calc(${art} * 0.85)`, height: `calc(${art} * 0.85)` }}>
            <Numeral n={m.n} style={{ fontSize: `calc(${art} * 0.6)` }} />
          </span>
        ),
        href: `/write?n=${m.n}`,
      };
  }
}

export function TodayBoard({ progress, today, onClose, onStay }: { progress: Progress; today: string; onClose: () => void; onStay: () => void }) {
  const router = useRouter();
  const later = useTimers();
  const train = trainOf(progress, today);
  const { list, allDone, claimed } = missionState(progress, today);
  // 방금 떠난 기차 → 새 기차가 들어오는 중
  const [trainPhase, setTrainPhase] = useState<"stay" | "leave" | "fresh">("stay");
  const [stampedNow, setStampedNow] = useState(false);
  const [intro] = useState(() => (!train.checked ? LINES.attendAsk : allDone && !claimed ? LINES.missionStampAsk : LINES.missions));
  const art = "min(15vh, calc(11*var(--vw)))";
  // 세로 폰에서도 기관차 + 칸 일곱이 한 줄에(판 안쪽 약 340px)
  const w = "min(11vh, calc(6*var(--vw)))";

  useEffect(() => {
    void say(intro);
    return () => stopVoice();
  }, [intro]);

  /** 출석 — 오늘 탈 칸에 친구가 탄다. 일곱째면 잠깐 꽉 찬 기차를 보여 주고 출발, 새 기차가 들어온다 */
  const board = () => {
    if (train.checked) return;
    onStay();
    sfx.wake();
    sfx.pop();
    const res = checkIn(readSaved().progress, today);
    updateSaved((s) => ({ ...s, progress: res.next }));
    sfx.ding();
    void say([attendBoard(res.car), ...(res.departed ? [LINES.trainGo, LINES.missions] : [LINES.missions])]);
    if (res.departed) {
      later(() => {
        setTrainPhase("leave");
        sfx.cheer();
      }, 1200);
      later(() => setTrainPhase("fresh"), 4000);
    }
  };

  const claim = () => {
    if (!allDone || claimed) return;
    onStay();
    sfx.wake();
    const res = claimMissions(readSaved().progress, today);
    updateSaved((s) => ({ ...s, progress: res.next }));
    setStampedNow(true);
    sfx.cheer();
    void say(LINES.missionAll);
  };

  const go = (info: MissionInfo) => {
    sfx.wake();
    sfx.pop();
    stopVoice();
    router.push(info.href);
  };

  const shownBoarded = trainPhase === "fresh" ? 0 : train.boarded;
  const stamp = stampedNow ? "new" : claimed ? "stamped" : allDone ? "ready" : "ghost";

  return (
    <div className="fixed inset-0 z-40 flex overflow-y-auto bg-ink/35 p-4 backdrop-blur-[2px] short:p-2" role="dialog" aria-label="오늘의 미션">
      <div className="glass relative m-auto w-full max-w-4xl rounded-[2.2rem] p-5 short:rounded-[1.6rem] short:p-3 portrait:p-4">
        <button type="button" aria-label="닫기" onClick={onClose} className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full bg-white text-2xl text-ink-soft shadow active:scale-90">
          <UiIcon name="close" />
        </button>

        {/* 출석 기차 */}
        <div className="flex items-center gap-2 pr-14">
          <span className="rounded-full bg-sky px-4 py-1 text-xl font-extrabold short:text-lg">출석 기차</span>
          <span className="text-lg font-bold text-ink-soft short:text-base">{trainPhase === "fresh" ? "새 기차가 왔어요 · 내일부터 타요" : train.checked ? `${train.boarded}일째 탔어요` : "눌러서 타기!"}</span>
        </div>
        <div className="mt-2 overflow-hidden py-1">
          <button type="button" aria-label="출석 기차" onClick={board} disabled={train.checked} className="mx-auto block">
            <AttendTrain
              key={trainPhase === "fresh" ? "fresh" : "train"}
              boarded={shownBoarded}
              glow={!train.checked}
              w={w}
              className={trainPhase === "leave" ? "animate-train-go" : trainPhase === "fresh" ? "animate-train-in" : ""}
            />
          </button>
        </div>

        {/* 오늘의 미션 */}
        <div className="mt-3 flex items-center gap-3 border-t-2 border-dashed border-ink/10 pt-3 short:mt-1.5 short:pt-1.5">
          <span className="rounded-full bg-butter px-4 py-1 text-xl font-extrabold short:text-lg">오늘의 미션</span>
          <span className="flex gap-1.5">
            {list.map((m, i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-full ${m.done ? "bg-mint-deep" : "bg-ink/15"}`} />
            ))}
          </span>
          <button type="button" onClick={claim} disabled={!allDone || claimed} aria-label="미션 도장" className="ml-auto">
            <Stamp state={stamp} size="min(13vh, 6.5rem)" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 short:mt-1.5 short:gap-2 portrait:grid-cols-1">
          {list.map((m, i) => {
            const info = infoOf(m, progress, art);
            return (
              <button
                key={i}
                type="button"
                onClick={() => go(info)}
                className="squish relative flex flex-col items-center gap-1 rounded-[1.6rem] p-3 text-center short:flex-row short:p-2 short:text-left portrait:flex-row portrait:gap-3 portrait:text-left"
                style={toneStyle(info.tone)}
              >
                <span className="grid shrink-0 place-items-center" style={{ width: art, height: art }}>
                  {info.art}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-extrabold text-ink-soft short:text-sm">
                    미션 {i + 1} · {info.sub}
                  </span>
                  <span className="block text-2xl font-extrabold leading-tight break-keep short:text-xl">{info.title}</span>
                </span>
                {m.done && (
                  <span className="absolute -right-2 -top-2 grid h-11 w-11 animate-pop-in place-items-center rounded-full bg-mint-deep text-2xl text-white shadow">
                    <UiIcon name="check" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
