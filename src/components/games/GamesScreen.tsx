"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CubeStack, FriendArt, ThingArt } from "@/components/Art";
import { DoneBurst, ModeShell } from "@/components/ModeShell";
import { MenuCard, Splash } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { MAX_NUMBER } from "@/curriculum/numbers";
import { ORIGINALS, type Original, type OriginalId } from "@/curriculum/originals";
import { imageOf } from "@/lib/assets";
import { useIsMaster } from "@/lib/auth";
import { buildOriginal, type BuiltOriginal } from "@/lib/originals";
import { finishGame, localDay, topNumber } from "@/lib/progress";
import { seededRng } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved } from "@/lib/store";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { BlockMaker } from "./BlockMaker";
import { DrumCount } from "./DrumCount";
import { Die, Drum, Fulcrum } from "./pieces";
import { Seesaw } from "./Seesaw";
import { ShadowFriend } from "./ShadowFriend";
import { ShareSnack } from "./ShareSnack";
import { YutGame } from "./YutGame";

/*
 * 숫자 놀이 — 우리가 같이 만든 오리지널 숫자 게임 여섯(curriculum/originals). 진도와 상관없이 늘 열려 있고, 수는 만난 친구까지.
 * 블록은 놀이터처럼 놀이마다 하루 첫 판만 1개(lib/progress finishGame).
 */

type Phase = { name: "list" } | { name: "playing"; game: Original; built: BuiltOriginal; startedAt: number } | { name: "done"; game: Original; earned: number };

/** 새 판 — 섞을 씨앗과 시작 시각을 지금 시각으로. 카드를 누를 때만 부른다(렌더 중에 부르지 않는다) */
function freshOriginal(id: OriginalId, top: number): { built: BuiltOriginal; startedAt: number } {
  const now = Date.now();
  return { built: buildOriginal(id, top, seededRng(now)), startedAt: now };
}

function Play({ built, onDone }: { built: BuiltOriginal; onDone: OnDone }) {
  switch (built.id) {
    case "yut":
      return <YutGame known={built.known} onDone={onDone} />;
    case "maker":
      return <BlockMaker rounds={built.rounds} onDone={onDone} />;
    case "shadow":
      return <ShadowFriend rounds={built.rounds} onDone={onDone} />;
    case "seesaw":
      return <Seesaw rounds={built.rounds} onDone={onDone} />;
    case "share":
      return <ShareSnack rounds={built.rounds} onDone={onDone} />;
    case "drum":
      return <DrumCount rounds={built.rounds} drummer={built.drummer} onDone={onDone} />;
  }
}

/** 카드 그림 — 이모지 대신 있는 그림(친구·블록·그림자·쿠키)과 단순한 물건(주사위·북·시소)을 짜 맞춘다 */
function OriginalArt({ id }: { id: OriginalId }) {
  const h = "min(13vh, calc(10*var(--vw)))";
  switch (id) {
    case "yut":
      // 작은 윷판 위에 친구 둘 + 주사위
      return (
        <span className="relative grid place-items-center" style={{ width: `calc(${h} * 1.5)`, height: h }}>
          <svg viewBox="0 0 100 100" className="absolute h-full" aria-hidden>
            <rect x="10" y="10" width="80" height="80" rx="4" fill="#fff4dd" stroke="#d6b47f" strokeWidth="4" />
            <line x1="90" y1="10" x2="10" y2="90" stroke="#d6b47f" strokeWidth="4" />
            <line x1="10" y1="10" x2="90" y2="90" stroke="#d6b47f" strokeWidth="4" />
          </svg>
          <span className="relative flex items-end gap-1">
            <FriendArt n={2} height={`calc(${h} * 0.62)`} />
            <Die face={5} size={`calc(${h} * 0.42)`} />
            <FriendArt n={4} height={`calc(${h} * 0.62)`} />
          </span>
        </span>
      );
    case "maker":
      return (
        <span className="flex items-end gap-2">
          <CubeStack n={3} size={`calc(${h} * 0.24)`} tone="card" />
          <FriendArt n={3} height={h} />
        </span>
      );
    case "shadow": {
      const src = imageOf("shadow:4");
      return (
        <span className="relative inline-block" style={{ width: h, height: h }}>
          {src && <Image src={src} alt="" fill sizes="160px" draggable={false} className="pointer-events-none object-contain" />}
          <span className="absolute -right-2 -top-1 grid h-8 w-8 place-items-center rounded-full bg-white font-letter text-xl font-extrabold text-brand shadow">?</span>
        </span>
      );
    }
    case "seesaw":
      return (
        <span className="flex flex-col items-center">
          <span className="flex -rotate-[8deg] items-end gap-6">
            <FriendArt n={2} height={`calc(${h} * 0.6)`} />
            <FriendArt n={5} height={`calc(${h} * 0.6)`} />
          </span>
          <span className="block h-2 w-[calc(min(13vh,calc(10*var(--vw)))*1.9)] -rotate-[8deg] rounded-full bg-[#c98a4b]" />
          <Fulcrum size={`calc(${h} * 0.32)`} />
        </span>
      );
    case "share":
      return (
        <span className="flex items-end gap-2">
          <FriendArt n={2} height={`calc(${h} * 0.85)`} />
          <span className="flex gap-1">
            <ThingArt id="cookie" size={`calc(${h} * 0.34)`} />
            <ThingArt id="cookie" size={`calc(${h} * 0.34)`} />
          </span>
        </span>
      );
    case "drum":
      return (
        <span className="flex items-end gap-1">
          <FriendArt n={1} height={`calc(${h} * 0.8)`} />
          <Drum size={`calc(${h} * 0.75)`} />
        </span>
      );
  }
}

export default function GamesScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [phase, setPhase] = useState<Phase>({ name: "list" });
  const menu = menuOf("games");

  useEffect(() => {
    void say(LINES.games);
    return () => stopVoice();
  }, []);

  if (!saved) return <Splash />;

  const top = master ? MAX_NUMBER : topNumber(saved.progress);

  const start = (g: Original) => {
    sfx.wake();
    sfx.pop();
    setPhase({ name: "playing", game: g, ...freshOriginal(g.id, top) });
  };

  if (phase.name === "playing") {
    return (
      <ModeShell title={phase.game.title} icon={phase.game.icon} scene="play" onBack={() => setPhase({ name: "list" })}>
        <Play
          built={phase.built}
          onDone={() => {
            const ms = Math.min(Date.now() - phase.startedAt, 30 * 60_000);
            const res = finishGame(readSaved().progress, phase.game.id, ms, localDay(new Date()));
            updateSaved((s) => ({ ...s, progress: res.next }));
            sfx.cheer();
            void say([pick(LINES.praise), ...(res.earned ? [LINES.blocks] : [])]);
            setPhase({ name: "done", game: phase.game, earned: res.earned });
          }}
        />
      </ModeShell>
    );
  }

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId={`menu:${menu.id}`} scene="free">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 p-5 pb-8 sm:grid-cols-3 portrait:gap-3 portrait:p-3">
        {ORIGINALS.map((g) => (
          <MenuCard key={g.id} tone={g.tone} art={<OriginalArt id={g.id} />} artClassName="aspect-[4/3]" title={g.title} sub={g.learn} onClick={() => start(g)} />
        ))}
      </div>
      {phase.name === "done" && (
        <DoneBurst earned={phase.earned} text="놀이 끝!" nextLabel="또 할래" onNext={() => start(phase.game)} secondLabel="다른 놀이" onSecond={() => setPhase({ name: "list" })} />
      )}
    </ModeShell>
  );
}
