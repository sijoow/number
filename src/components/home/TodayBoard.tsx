"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FriendTight } from "@/components/Art";
import { OriginalArt } from "@/components/games/OriginalArt";
import { ThinkArt } from "@/components/think/ThinkArt";
import { TrainEngine } from "@/components/games/pieces";
import { Icon } from "@/components/Icon";
import { toneStyle, UiIcon, type Tone } from "@/components/ui";
import { blockColor } from "@/curriculum/friends";
import { gameOf } from "@/curriculum/games";
import type { Gift } from "@/curriculum/gifts";
import { attendBoard, LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { range } from "@/curriculum/numbers";
import { originalOf } from "@/curriculum/originals";
import { thinkOf } from "@/curriculum/thinks";
import { giftNew, missionState, type Mission } from "@/lib/missions";
import { checkIn, claimMissions, TRAIN_CARS, trainOf, type Progress } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved } from "@/lib/store";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";

/*
 * 오늘 — 첫 화면 한 곳에서(2026-10-29 사용자: 미션 판 창과 홈 카드가 둘이라 더 헷갈린다 → 창 없이 화면에서 바로 고르게).
 *   출석 기차(TrainPill)   위쪽 기차 단추 — 오늘 아직 안 탔으면 반짝, 누르면 그 자리에서 그날의 숫자 친구가 탄다("오늘은 넷째 날! 사가 탔어!").
 *                          일곱째 날 칠이 타면 기차 출발 + 블록 7개. 알림은 잠깐 말풍선으로 — 닫을 것이 없다
 *   오늘의 미션(MissionRow) 홈 카드의 「시작하기」(① 오늘의 놀이) 아래에 ② 복습 놀이 · ③ 생각 놀이, 끝에 「참 잘했어요」 도장
 *                          (셋 다 하면 눌러서 도장 + 블록 3개 — 토도수학 오늘의 목표 COMPLETE 도장처럼)
 * 기차·도장은 단순한 물건이라 SVG·CSS 로 그린다(친구는 늘 생성 그림 — FriendTight).
 */

const RAINBOW = "linear-gradient(90deg, #e84a3f, #f39a2b, #f5cd36, #5cbf4f, #3fb6e3, #4c6fe0, #9b59d0)";

/** 출석 기차 단추 — 기관차 + 칸 일곱(탄 칸은 그 친구 색, 칠은 무지개). 누르면 그 자리에서 탄다 */
export function TrainPill({ progress, today }: { progress: Progress; today: string }) {
  const later = useTimers();
  const train = trainOf(progress, today);
  // 방금 탄 친구 — 잠깐 말풍선으로 보여 주고 저절로 사라진다
  const [note, setNote] = useState<{ k: number; text: string } | null>(null);

  const board = () => {
    sfx.wake();
    if (train.checked) {
      // 오늘은 벌써 탔다 — 몇째 날인지 다시 들려준다
      sfx.tick();
      if (train.boarded > 0) void say(attendBoard(train.boarded));
      return;
    }
    sfx.pop();
    const res = checkIn(readSaved().progress, today);
    updateSaved((s) => ({ ...s, progress: res.next }));
    sfx.ding();
    void say(res.departed ? [attendBoard(res.car), LINES.trainGo] : attendBoard(res.car));
    setNote({ k: res.car, text: res.departed ? LINES.trainGo : attendBoard(res.car) });
    if (res.departed) later(() => sfx.cheer(), 900);
    later(() => setNote(null), res.departed ? 4200 : 3000);
  };

  return (
    <span className="relative shrink-0">
      <button
        type="button"
        aria-label="출석 기차"
        onClick={board}
        className={`glass flex h-12 items-center gap-1.5 rounded-full px-3 portrait:gap-1 portrait:px-2.5 ${!train.checked ? "animate-breathe ring-4 ring-brand/40" : ""}`}
      >
        <TrainEngine w="1.5rem" />
        <span className="flex items-end gap-[3px]">
          {range(1, TRAIN_CARS).map((k) => {
            const on = k <= train.boarded;
            const next = !train.checked && k === train.boarded + 1;
            return (
              <span
                key={k}
                className={`block h-3 w-3 rounded-[3px] portrait:h-2.5 portrait:w-2.5 ${next ? "outline outline-2 outline-offset-1 outline-brand" : ""} ${note?.k === k ? "animate-pop-in" : ""}`}
                style={{ background: on ? (k === TRAIN_CARS ? RAINBOW : blockColor(k, 0).fill) : "rgb(62 58 82 / 0.15)" }}
              />
            );
          })}
        </span>
      </button>
      {note && (
        <span role="status" className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-30 flex animate-pop-in items-center gap-2 whitespace-nowrap rounded-[1.4rem] bg-white px-3 py-2 shadow-[0_12px_28px_-12px_rgb(62_58_82/0.5)]">
          <FriendTight n={note.k} height="2.6rem" />
          <span className="text-lg font-extrabold">{note.text}</span>
        </span>
      )}
    </span>
  );
}

/** 「참 잘했어요」 도장 — ghost 면 자리만(점선), ready 면 눌러 보라고 반짝, stamped 면 빨간 도장 */
export function Stamp({ state, size }: { state: "ghost" | "ready" | "stamped" | "new"; size: string }) {
  const stamped = state === "stamped" || state === "new";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-center font-extrabold leading-tight ${state === "new" ? "animate-stamp-in" : stamped ? "-rotate-12" : ""} ${state === "ready" ? "animate-breathe" : ""}`}
      style={{
        width: size,
        height: size,
        fontSize: `calc(${size} * 0.2)`,
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
  icon: { id: string; emoji: string };
  href: string;
}

/** 미션 하나 — 오늘의 놀이는 홈 카드의 「시작하기」라 여기엔 놀이터·숫자 놀이·생각 놀이 중 둘(과정을 다 마쳤으면 첫째도 놀이터 놀이) */
function infoOf(m: Mission): MissionInfo | null {
  if (m.kind === "lesson") return null;
  const href = `/${m.menu}?g=${m.game}`;
  const sub = m.fresh ? "새 놀이" : menuOf(m.menu).title;
  switch (m.menu) {
    case "free": {
      const g = gameOf(m.game);
      return { title: g?.title ?? "놀이터", sub, tone: g?.tone ?? "sky", icon: { id: `play:${m.game}`, emoji: g?.icon ?? "🎮" }, href };
    }
    case "games": {
      const o = originalOf(m.game);
      return { title: o?.title ?? "숫자 놀이", sub, tone: o?.tone ?? "lilac", icon: { id: `games:${m.game}`, emoji: o?.icon || "🎲" }, href };
    }
    case "think": {
      const t = thinkOf(m.game);
      return { title: t?.title ?? "생각 놀이", sub, tone: t?.tone ?? "mint", icon: { id: `think:${m.game}`, emoji: t?.icon ?? "💡" }, href };
    }
  }
}

/** 선물 놀이 이름·그림·주소 */
function giftInfo(g: Gift): { title: string; art: ReactNode; href: string } {
  if (g.menu === "games") return { title: originalOf(g.id)?.title ?? "숫자 놀이", art: <OriginalArt id={g.id} h="min(22vh, 9rem)" />, href: `/games?g=${g.id}` };
  return { title: thinkOf(g.id)?.title ?? "생각 놀이", art: <ThinkArt id={g.id} h="min(22vh, 9rem)" />, href: `/think?g=${g.id}` };
}

/**
 * 새 놀이 선물 — 도장을 받으면 상자가 열리고 새 놀이가 나온다. 「해 볼래」면 바로 그 놀이로.
 * 홈 카드(유리 효과)가 fixed 의 기준이 되어 카드 안에만 덮이므로 body 에 바로 그린다
 */
function GiftReveal({ gift, onGo, onClose }: { gift: Gift; onGo: (href: string) => void; onClose: () => void }) {
  const info = giftInfo(gift);
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4" role="dialog" aria-label="새 놀이 선물">
      <div className="flex w-full max-w-md animate-pop-in flex-col items-center gap-3 rounded-[2rem] bg-white p-6 text-center shadow-[0_24px_60px_-20px_rgb(62_58_82/0.6)] short:gap-2 short:p-4">
        <span className="rounded-full bg-brand px-5 py-1.5 text-xl font-extrabold text-white">🎁 새 놀이 선물!</span>
        <span className="grid min-h-[min(24vh,10rem)] w-full place-items-center rounded-[1.4rem] bg-paper px-3 py-4 short:py-2">{info.art}</span>
        <span className="text-3xl font-extrabold short:text-2xl">{info.title}</span>
        <div className="mt-1 flex gap-3">
          <button type="button" onClick={() => onGo(info.href)} className="squish rounded-full px-7 py-3 text-2xl font-extrabold short:py-2" style={toneStyle("mint")}>
            해 볼래!
          </button>
          <button type="button" onClick={onClose} className="squish rounded-full px-6 py-3 text-xl font-extrabold short:py-2" style={toneStyle("card")}>
            나중에
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 오늘의 미션 ② 복습 · ③ 생각 놀이 + 도장 — 홈 카드 「시작하기」 아래 */
export function MissionRow({ progress, today }: { progress: Progress; today: string }) {
  const router = useRouter();
  const { list, allDone, claimed } = missionState(progress, today);
  const later = useTimers();
  const [stampedNow, setStampedNow] = useState(false);
  // 방금 받은 선물 놀이 — 도장 다음에 상자가 열린다
  const [gift, setGift] = useState<Gift | null>(null);

  const claim = () => {
    if (!allDone || claimed) return;
    sfx.wake();
    const before = readSaved().progress;
    const res = claimMissions(before, today);
    updateSaved((s) => ({ ...s, progress: res.next }));
    setStampedNow(true);
    sfx.cheer();
    const got = giftNew(before, res.next);
    void say(got ? [LINES.missionAll, LINES.giftNew] : LINES.missionAll);
    if (got) later(() => setGift(got), 1600);
  };

  const go = (href: string) => {
    sfx.wake();
    sfx.pop();
    stopVoice();
    router.push(href);
  };

  const stamp = stampedNow ? "new" : claimed ? "stamped" : allDone ? "ready" : "ghost";

  return (
    <div className="mt-3 flex items-center gap-2 short:mt-2">
      {list.map((m, i) => {
        const info = infoOf(m);
        if (!info) return null;
        return (
          <button
            key={i}
            type="button"
            onClick={() => go(info.href)}
            className="squish relative flex min-w-0 flex-1 items-center gap-2 rounded-[1.3rem] px-2.5 py-2 text-left short:py-1.5"
            style={toneStyle(info.tone)}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center text-[2.3rem] leading-none short:h-9 short:w-9 short:text-[1.9rem]">
              <Icon id={info.icon.id} emoji={info.icon.emoji} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-xs font-extrabold text-ink-soft">
                미션 {i + 1} · {info.sub}
              </span>
              <span className="block truncate text-lg font-extrabold short:text-base">{info.title}</span>
            </span>
            {m.done && (
              <span className="absolute -right-1.5 -top-1.5 grid h-7 w-7 animate-pop-in place-items-center rounded-full bg-mint-deep text-sm text-white shadow">
                <UiIcon name="check" />
              </span>
            )}
          </button>
        );
      })}
      <button type="button" onClick={claim} disabled={!allDone || claimed} aria-label="미션 도장" className="shrink-0">
        <Stamp state={stamp} size="min(4.2rem, 11vh)" />
      </button>
      {gift && (
        <GiftReveal
          gift={gift}
          onGo={(href) => {
            setGift(null);
            go(href);
          }}
          onClose={() => {
            sfx.tick();
            stopVoice();
            setGift(null);
          }}
        />
      )}
    </div>
  );
}
