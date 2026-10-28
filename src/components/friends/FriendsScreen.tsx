"use client";

import { useEffect, useState } from "react";
import { CubeStack, FriendArt, Numeral } from "@/components/Art";
import { ModeShell } from "@/components/ModeShell";
import { ReadAlong } from "@/components/ReadAlong";
import { SpeechBubble, Splash, toneStyle, UiIcon } from "@/components/ui";
import { FRIENDS, hasTowerForm, type FriendForm } from "@/curriculum/friends";
import { LINES, meetBlocks, meetHello, meetIntro } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { nameOf } from "@/curriculum/numbers";
import { useIsMaster } from "@/lib/auth";
import { sfx } from "@/lib/sfx";
import { useSaved } from "@/lib/store";
import { say, stopVoice } from "@/lib/voice";

/*
 * 숫자 친구 — 오늘의 놀이에서 만난 친구들(1~20)이 모이는 앨범. 만난 친구를 누르면 인사하고, 블록을 같이 센다.
 * 못 만난 친구는 물음표 — 누르면 "오늘의 놀이에서 만나자!". 마스터는 다 보인다.
 */

/**
 * 친구 그림과 블록 세기 판이 한 줄 — 블록 판은 다섯 개마다 한 기둥씩 넓어져서(스물 = 네 기둥) 세로 폰에선 옆으로 넘쳤다(2026-10-28 사용자).
 * 창(카드) 폭(cqw)에 맞춰 그림은 폭의 절반 아래로, 블록은 남은 폭을 기둥 수로 나눈 크기 아래로.
 */
const ART = "min(34vh, 16rem, 48cqw)";
function cubeFor(n: number): string {
  const cols = Math.ceil(n / 5);
  // 기둥 c개 = 블록 c개 + 틈(블록의 0.22배) c−1개, 4.5rem 은 줄 간격 + 블록 판 안쪽 여백 + 여유
  return `min(6.5vh, 2.6rem, calc((100cqw - ${ART} - 4.5rem) / ${(cols * 1.22 - 0.22).toFixed(2)}))`;
}

function FriendModal({ n, onClose }: { n: number; onClose: () => void }) {
  const [lit, setLit] = useState(-1);
  // 「변신!」 — 대표 모습(인물구성도) ↔ 기둥 모습(인물구성2). 4·6·8·9 만 모습이 다르다
  const [form, setForm] = useState<FriendForm>("shape");

  useEffect(() => {
    void say([meetHello(n), meetIntro(n)].filter(Boolean));
    return () => stopVoice();
  }, [n]);

  const tap = () => {
    sfx.wake();
    sfx.pop();
    const next = lit + 1 >= n ? 0 : lit + 1;
    setLit(next);
    void say(next === n - 1 ? [nameOf(next + 1), meetBlocks(n)] : nameOf(next + 1));
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto overflow-x-hidden bg-ink/25 p-4 backdrop-blur-sm portrait:pt-[calc(1rem_+_var(--cam))]">
      <div className="relative flex w-full max-w-xl animate-pop-in flex-col items-center gap-4 rounded-[2.4rem] bg-white px-8 pb-7 pt-6 shadow-[0_30px_60px_-20px_rgb(62_58_82/0.5)] [container-type:inline-size] portrait:px-5">
        <button type="button" aria-label="닫기" onClick={onClose} className="glass absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full text-xl text-ink-soft">
          <UiIcon name="close" />
        </button>
        <SpeechBubble tail="down" className="mr-10 max-w-full text-2xl portrait:text-xl">
          <ReadAlong text={meetHello(n)} />
          {meetIntro(n) && (
            <span className="mt-1 block text-[0.85em] font-semibold">
              <ReadAlong text={meetIntro(n)} />
            </span>
          )}
        </SpeechBubble>
        <div className="flex items-end gap-8 portrait:gap-3">
          <span className="flex flex-col items-center gap-2">
            <FriendArt key={form} n={n} form={form} height={ART} className="animate-pop-in" />
            {hasTowerForm(n) && (
              <button
                type="button"
                className="squish rounded-full px-5 py-2 font-display text-xl"
                style={toneStyle("lilac")}
                onClick={() => {
                  sfx.wake();
                  sfx.ding();
                  void say(LINES.transform);
                  setForm(form === "shape" ? "tower" : "shape");
                }}
              >
                변신!
              </button>
            )}
          </span>
          <button type="button" onClick={tap} aria-label="블록 세기" className="flex flex-col items-center gap-2 rounded-[2rem] bg-paper p-4 portrait:p-3">
            <CubeStack n={n} size={cubeFor(n)} tone="butter" lit={lit} />
            <span className="min-h-9 font-letter text-3xl font-extrabold">{lit >= 0 ? nameOf(lit + 1) : "톡!"}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <Numeral n={n} className="text-brand" style={{ fontSize: "min(12vh, 5rem)" }} />
          <span className="text-4xl font-extrabold">{FRIENDS[n - 1]?.name}</span>
        </div>
      </div>
    </div>
  );
}

export default function FriendsScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [open, setOpen] = useState<number | null>(null);
  const menu = menuOf("friends");

  useEffect(() => {
    void say(LINES.friends);
    return () => stopVoice();
  }, []);

  if (!saved) return <Splash />;
  const met = new Set(master ? FRIENDS.map((f) => f.n) : saved.progress.friends);

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId="menu:friends" scene="friends">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 p-5 pb-8 sm:grid-cols-3 lg:grid-cols-5 short:grid-cols-5 short:gap-3 portrait:gap-3 portrait:p-3">
        {FRIENDS.map((f) => {
          const known = met.has(f.n);
          return (
            <button
              key={f.n}
              type="button"
              onClick={() => {
                sfx.wake();
                if (!known) {
                  sfx.boop();
                  void say(LINES.friendLocked);
                  return;
                }
                sfx.pop();
                setOpen(f.n);
              }}
              className="flex flex-col items-center gap-2 rounded-[1.8rem] bg-white p-3 pb-4 shadow-[0_14px_30px_-16px_rgb(62_58_82/0.45)] transition-transform active:scale-95"
            >
              <span className={`grid aspect-square w-full place-items-center overflow-hidden rounded-[1.4rem] ${known ? "bg-butter/60" : "bg-paper-deep"}`}>
                {known ? <FriendArt n={f.n} height="min(22vh, 9rem)" /> : <span className="font-letter text-6xl font-extrabold text-ink-soft/60">?</span>}
              </span>
              <span className="flex items-center gap-2 text-xl font-extrabold">
                <Numeral n={f.n} className="text-brand" />
                {known ? f.name : "아직 몰라요"}
              </span>
            </button>
          );
        })}
      </div>
      {open !== null && <FriendModal n={open} onClose={() => setOpen(null)} />}
    </ModeShell>
  );
}
