"use client";

import { useEffect, useState } from "react";
import { Numeral } from "@/components/Art";
import { ModeShell } from "@/components/ModeShell";
import { Dots } from "@/components/play/Dots";
import { StarFly } from "@/components/play/StarFly";
import { StrokeBoard, strokeBoardWidth } from "@/components/StrokeBoard";
import { Splash, SquishButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { MAX_NUMBER, nameOf, range } from "@/curriculum/numbers";
import { currentAuth, useIsMaster } from "@/lib/auth";
import { recordPlay } from "@/lib/play";
import { localDay, noteWrite } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved } from "@/lib/store";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";

/*
 * 숫자 쓰기 — 1~20 을 골라 따라 쓴다. 판은 업체 따라쓰기처럼 획 길을 따라서만 칠해지는 StrokeBoard(2026-10-29 사용자: 똑바로 못 쓴다).
 * 만난 숫자 친구의 숫자만 열린다(마스터는 다). 다 쓰면 정답 별 + 칭찬 + 하루 리포트에 활동 하나, 잠시 뒤 저절로 다음 숫자
 * (2026-10-29 사용자: 쓰고 「다음」을 누르는 건 4살에게 어렵다). 마지막 숫자였으면 숫자 고르기로.
 */

/** 오늘의 미션에서 바로 왔으면(?n=숫자) 그 숫자 쓰기로 — 만난 친구의 숫자만 */
function initialPick(): number | null {
  const n = Number(new URLSearchParams(window.location.search).get("n"));
  if (!Number.isInteger(n) || n < 1 || n > MAX_NUMBER) return null;
  return currentAuth()?.user.role === "master" || readSaved().progress.friends.includes(n) ? n : null;
}

export default function WriteScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [pickN, setPickN] = useState<number | null>(initialPick);
  const [fromMission] = useState(() => pickN);
  const later = useTimers();
  const menu = menuOf("write");

  useEffect(() => {
    if (fromMission !== null) {
      window.history.replaceState(null, "", window.location.pathname);
      void say([LINES.trace, nameOf(fromMission)]);
    } else void say(LINES.write);
    return () => stopVoice();
  }, [fromMission]);

  if (!saved) return <Splash />;
  const known = new Set(master ? range(1, MAX_NUMBER) : saved.progress.friends);

  const choose = (n: number) => {
    sfx.wake();
    if (!known.has(n)) {
      sfx.boop();
      void say(LINES.friendLocked);
      return;
    }
    sfx.pop();
    setPickN(n);
    void say([LINES.trace, nameOf(n)]);
  };

  if (pickN !== null) {
    const text = String(pickN);
    const next = range(pickN + 1, MAX_NUMBER).find((n) => known.has(n));
    return (
      <ModeShell title={`${nameOf(pickN)} 쓰기`} icon={menu.icon} iconId="menu:write" scene="write" onBack={() => setPickN(null)}>
        <div className="flex min-h-full items-center justify-center-safe gap-8 px-6 py-4 portrait:flex-col portrait:gap-5 portrait:px-4">
          <StrokeBoard
            key={pickN}
            text={text}
            width={strokeBoardWidth(text.length)}
            onSuccess={() => {
              sfx.cheer();
              recordPlay({ acts: 1 });
              // 쓰기 미션 확인용 — 그날 쓴 숫자
              updateSaved((s) => ({ ...s, progress: noteWrite(s.progress, pickN, localDay(new Date())) }));
              void say(pick(LINES.praise));
              // 잠시 뒤 저절로 다음 숫자 — 마지막이면 숫자 고르기로
              later(() => {
                if (next !== undefined) choose(next);
                else {
                  setPickN(null);
                  void say(LINES.write);
                }
              }, 1900);
            }}
          />
          <div className="flex flex-col items-center gap-4 portrait:flex-row portrait:justify-center">
            <span key={pickN} className="animate-pop-in rounded-[1.4rem] bg-white/85 px-4 py-3">
              <Dots n={pickN} size="min(3.6vh, calc(2.6*var(--vw)))" />
            </span>
            <span className="rounded-full bg-card px-6 py-2 text-3xl shadow-[0_5px_0_var(--paper-deep)]">{nameOf(pickN)}</span>
          </div>
        </div>
        <StarFly />
      </ModeShell>
    );
  }

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId="menu:write" scene="write">
      <div className="mx-auto grid max-w-4xl grid-cols-5 gap-4 p-5 pb-8 portrait:grid-cols-3 portrait:gap-3 portrait:p-4">
        {range(1, MAX_NUMBER).map((n) => {
          const open = known.has(n);
          return (
            <SquishButton key={n} tone="card" onClick={() => choose(n)} className={`grid aspect-square place-items-center rounded-[1.8rem] ${open ? "" : "opacity-45"}`} aria-label={nameOf(n)}>
              <Numeral n={n} className={open ? "text-ink" : "text-ink-soft"} style={{ fontSize: "min(12vh, calc(9*var(--vw)))" }} />
            </SquishButton>
          );
        })}
      </div>
    </ModeShell>
  );
}
