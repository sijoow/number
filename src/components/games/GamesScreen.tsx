"use client";

import { useEffect, useState } from "react";
import { DoneBurst, ModeShell } from "@/components/ModeShell";
import { MenuCard, Splash } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { MAX_NUMBER } from "@/curriculum/numbers";
import { originalOf, ORIGINALS, type Original, type OriginalId } from "@/curriculum/originals";
import { currentAuth, useIsMaster } from "@/lib/auth";
import { giftOpen, nextGift } from "@/lib/missions";
import { buildOriginal, type BuiltOriginal } from "@/lib/originals";
import { finishGame, localDay, topNumber } from "@/lib/progress";
import { seededRng } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved } from "@/lib/store";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { BlockMaker } from "./BlockMaker";
import { DrumCount } from "./DrumCount";
import { EggNumber } from "./EggNumber";
import { HideLine } from "./HideLine";
import { Meal } from "./Meal";
import { MoreLess } from "./MoreLess";
import { NumBoard } from "./NumBoard";
import { NumTrain } from "./NumTrain";
import { OriginalArt } from "./OriginalArt";
import { Parts } from "./Parts";
import { Rocket } from "./Rocket";
import { Seesaw } from "./Seesaw";
import { ShadowFriend } from "./ShadowFriend";
import { ShareSnack } from "./ShareSnack";
import { TenFrame } from "./TenFrame";
import { YutGame } from "./YutGame";

/*
 * 숫자 놀이 — 우리가 같이 만든 오리지널 숫자 게임 여섯(curriculum/originals). 진도와 상관없이 늘 열려 있고, 수는 만난 친구까지.
 * 뒤의 선물 놀이는 미션 도장을 받을 때마다 하나씩 열린다(curriculum/gifts) — 잠긴 카드에 다음 선물을 표시.
 * 블록은 놀이터처럼 놀이마다 하루 첫 판만 1개(lib/progress finishGame).
 */

type Phase = { name: "list" } | { name: "playing"; game: Original; built: BuiltOriginal; startedAt: number } | { name: "done"; game: Original; earned: number };

/** 새 판 — 섞을 씨앗과 시작 시각을 지금 시각으로. 카드를 누를 때만 부른다(렌더 중에 부르지 않는다) */
function freshOriginal(id: OriginalId, top: number): { built: BuiltOriginal; startedAt: number } {
  const now = Date.now();
  return { built: buildOriginal(id, top, seededRng(now)), startedAt: now };
}

/** 오늘의 미션에서 바로 왔으면(?g=놀이) 그 놀이로 시작 — 첫 렌더에 한 번. 아직 안 받은 선물 놀이면 목록으로 */
function initialPhase(): Phase {
  const game = originalOf(new URLSearchParams(window.location.search).get("g") ?? "");
  if (!game) return { name: "list" };
  const master = currentAuth()?.user.role === "master";
  if (!giftOpen(readSaved().progress, game.id, master)) return { name: "list" };
  const top = master ? MAX_NUMBER : topNumber(readSaved().progress);
  return { name: "playing", game, ...freshOriginal(game.id, top) };
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
    case "eggs":
      return <EggNumber rounds={built.rounds} onDone={onDone} />;
    case "parts":
      return <Parts rounds={built.rounds} onDone={onDone} />;
    case "more-less":
      return <MoreLess game={built.game} onDone={onDone} />;
    case "hide-line":
      return <HideLine rounds={built.rounds} onDone={onDone} />;
    case "meal":
      return <Meal rounds={built.rounds} onDone={onDone} />;
    case "num-train":
      return <NumTrain rounds={built.rounds} onDone={onDone} />;
    case "rocket":
      return <Rocket rounds={built.rounds} onDone={onDone} />;
    case "ten-frame":
      return <TenFrame rounds={built.rounds} onDone={onDone} />;
    case "num-board":
      return <NumBoard rounds={built.rounds} onDone={onDone} />;
  }
}

export default function GamesScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [fromMission] = useState(() => phase.name === "playing");
  const menu = menuOf("games");

  useEffect(() => {
    if (fromMission) window.history.replaceState(null, "", window.location.pathname);
    else void say(LINES.games);
    return () => stopVoice();
  }, [fromMission]);

  if (!saved) return <Splash />;

  const top = master ? MAX_NUMBER : topNumber(saved.progress);
  const gift = nextGift(saved.progress);

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
      {/* 세로 화면은 카드가 화면보다 낮으면 아래가 비었다 — 위아래 가운데로(사용자 10-27, 넘치면 그대로 스크롤) */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 p-5 pb-8 sm:grid-cols-3 lg:grid-cols-5 portrait:min-h-full portrait:content-center portrait:gap-3 portrait:p-3">
        {ORIGINALS.map((g) => {
          const open = giftOpen(saved.progress, g.id, master);
          return (
            <MenuCard
              key={g.id}
              tone={g.tone}
              art={<OriginalArt id={g.id} />}
              artClassName="aspect-[4/3]"
              title={g.title}
              sub={open ? g.learn : undefined}
              locked={!open}
              lockText={gift?.id === g.id ? "다음 선물이에요" : "미션 도장으로 열려요"}
              onClick={() => {
                if (!open) {
                  sfx.boop();
                  void say(LINES.locked);
                  return;
                }
                start(g);
              }}
            />
          );
        })}
      </div>
      {phase.name === "done" && (
        <DoneBurst earned={phase.earned} text="놀이 끝!" nextLabel="또 할래" onNext={() => start(phase.game)} secondLabel="다른 놀이" onSecond={() => setPhase({ name: "list" })} />
      )}
    </ModeShell>
  );
}
