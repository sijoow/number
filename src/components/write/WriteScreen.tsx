"use client";

import { useEffect, useState } from "react";
import { Numeral } from "@/components/Art";
import { ModeShell } from "@/components/ModeShell";
import { boardWidth, TraceBoard, useBoardKey } from "@/components/TraceBoard";
import { Splash, SquishButton, UiIcon } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { MAX_NUMBER, nameOf, range } from "@/curriculum/numbers";
import { useIsMaster } from "@/lib/auth";
import { recordPlay } from "@/lib/play";
import { sfx } from "@/lib/sfx";
import { useSaved } from "@/lib/store";
import { pick, say, stopVoice } from "@/lib/voice";

/*
 * 숫자 쓰기 — 1~20 을 골라 손가락으로 따라 쓴다(판은 한글나라 TraceBoard, 손끝 펜 그대로).
 * 만난 숫자 친구의 숫자만 열린다(마스터는 다). 다 쓰면 칭찬 + 하루 리포트에 활동 하나.
 */

export default function WriteScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [pickN, setPickN] = useState<number | null>(null);
  const [key, erase] = useBoardKey();
  const [done, setDone] = useState(false);
  const menu = menuOf("write");

  useEffect(() => {
    void say(LINES.write);
    return () => stopVoice();
  }, []);

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
    setDone(false);
    void say([LINES.trace, nameOf(n)]);
  };

  if (pickN !== null) {
    const text = String(pickN);
    const wide = text.length > 1;
    const next = range(pickN + 1, MAX_NUMBER).find((n) => known.has(n));
    return (
      <ModeShell title={`${nameOf(pickN)} 쓰기`} icon={menu.icon} iconId="menu:write" scene="write" onBack={() => setPickN(null)}>
        <div className="flex min-h-full items-center justify-center-safe gap-8 px-6 py-4 portrait:flex-col portrait:gap-5 portrait:px-4">
          <TraceBoard
            key={`${pickN}-${key}`}
            text={text}
            aspect={wide ? 1.5 : 1}
            width={wide ? boardWidth(1.5, 92, 16) : "min(66vh, calc(60*var(--vw)))"}
            onSuccess={() => {
              setDone(true);
              sfx.cheer();
              recordPlay({ acts: 1 });
              void say(pick(LINES.praise));
            }}
          />
          <div className="flex flex-col items-center gap-4 portrait:flex-row portrait:flex-wrap portrait:justify-center">
            <SquishButton
              tone="butter"
              className="whitespace-nowrap rounded-full px-7 py-4 text-3xl"
              onClick={() => {
                sfx.tick();
                setDone(false);
                erase();
              }}
            >
              {done ? "한 번 더" : "지우기"}
            </SquishButton>
            {next !== undefined && (
              <button type="button" className="cta flex items-center gap-2 rounded-full px-7 py-4 text-3xl font-extrabold" onClick={() => choose(next)}>
                {nameOf(next)} <UiIcon name="next" />
              </button>
            )}
          </div>
        </div>
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
