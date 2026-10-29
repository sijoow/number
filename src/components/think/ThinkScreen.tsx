"use client";

import { useEffect, useState } from "react";
import { DoneBurst, ModeShell } from "@/components/ModeShell";
import { StarFly } from "@/components/play/StarFly";
import type { OnDone } from "@/components/play/types";
import { MenuCard, Splash } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { MAX_NUMBER } from "@/curriculum/numbers";
import { THINKS, thinkOf, type Think, type ThinkId } from "@/curriculum/thinks";
import { currentAuth, useIsMaster } from "@/lib/auth";
import { giftOpen, nextGift } from "@/lib/missions";
import { finishGame, localDay, topNumber } from "@/lib/progress";
import { seededRng } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved } from "@/lib/store";
import { buildThink, type BuiltThink } from "@/lib/thinks";
import { pick, say, stopVoice } from "@/lib/voice";
import { Matrix } from "./Matrix";
import { MemoryPairs } from "./MemoryPairs";
import { Mirror } from "./Mirror";
import { Sequence } from "./Sequence";
import { ThinkArt } from "./ThinkArt";
import { WhoHid } from "./WhoHid";

/*
 * 생각 놀이 — 업체 「사고력 세상」 Lv.1 을 우리 그림으로(curriculum/thinks). 진도와 상관없이 늘 열려 있고, 친구는 만난 친구까지.
 * 순서 기억하기·빈칸 채우기는 선물 놀이 — 미션 도장을 받아야 열린다(curriculum/gifts).
 * 블록은 놀이터·숫자 놀이처럼 놀이마다 하루 첫 판만 1개(lib/progress finishGame).
 */

type Phase = { name: "list" } | { name: "playing"; game: Think; built: BuiltThink; startedAt: number } | { name: "done"; game: Think; earned: number };

/** 새 판 — 카드를 누를 때만 부른다(렌더 중에 부르지 않는다) */
function freshThink(id: ThinkId, top: number): { built: BuiltThink; startedAt: number } {
  const now = Date.now();
  return { built: buildThink(id, top, seededRng(now)), startedAt: now };
}

/** 오늘의 미션에서 바로 왔으면(?g=놀이, 2026-10-29) 그 놀이로 시작 — 첫 렌더에 한 번. 화면은 ssr 없이 그려서 기기 진도를 바로 읽는다 */
function initialPhase(): Phase {
  const g = thinkOf(new URLSearchParams(window.location.search).get("g") ?? "");
  if (!g) return { name: "list" };
  const master = currentAuth()?.user.role === "master";
  if (!giftOpen(readSaved().progress, g.id, master)) return { name: "list" };
  const top = master ? MAX_NUMBER : topNumber(readSaved().progress);
  return { name: "playing", game: g, ...freshThink(g.id, top) };
}

function Play({ built, onDone }: { built: BuiltThink; onDone: OnDone }) {
  switch (built.id) {
    case "mirror":
      return <Mirror rounds={built.rounds} onDone={onDone} />;
    case "memory":
      return <MemoryPairs rounds={built.rounds} onDone={onDone} />;
    case "who-hid":
      return <WhoHid rounds={built.rounds} onDone={onDone} />;
    case "sequence":
      return <Sequence rounds={built.rounds} onDone={onDone} />;
    case "matrix":
      return <Matrix rounds={built.rounds} onDone={onDone} />;
  }
}

export default function ThinkScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [phase, setPhase] = useState<Phase>(initialPhase);
  // 미션에서 바로 시작했으면 놀이가 먼저 말한다 — 생각 놀이 인사는 건너뛴다
  const [fromMission] = useState(() => phase.name === "playing");
  const menu = menuOf("think");

  useEffect(() => {
    if (fromMission) window.history.replaceState(null, "", window.location.pathname);
    else void say(LINES.think);
    return () => stopVoice();
  }, [fromMission]);

  if (!saved) return <Splash />;

  const top = master ? MAX_NUMBER : topNumber(saved.progress);
  const gift = nextGift(saved.progress);

  const start = (g: Think) => {
    sfx.wake();
    sfx.pop();
    setPhase({ name: "playing", game: g, ...freshThink(g.id, top) });
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
        <StarFly />
      </ModeShell>
    );
  }

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId={`menu:${menu.id}`} scene="free">
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 p-5 pb-8 portrait:min-h-full portrait:grid-cols-2 portrait:content-center portrait:gap-3 portrait:p-3">
        {THINKS.map((g) => {
          const open = giftOpen(saved.progress, g.id, master);
          return (
            <MenuCard
              key={g.id}
              tone={g.tone}
              art={<ThinkArt id={g.id} />}
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
