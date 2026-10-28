"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { DoneBurst, ModeShell } from "@/components/ModeShell";
import { ActivityHost } from "@/components/play/ActivityHost";
import { MenuCard, Splash } from "@/components/ui";
import { chapterOf, firstPattern } from "@/curriculum/course";
import { gameOf, gameOpens, gameReach, GAMES, type Game, type PlayContext } from "@/curriculum/games";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { MAX_NUMBER, nameOf } from "@/curriculum/numbers";
import { imageOf } from "@/lib/assets";
import { currentAuth, useIsMaster } from "@/lib/auth";
import { isOpen } from "@/lib/play";
import { finishGame, localDay, reached, topNumber } from "@/lib/progress";
import { buildActivity, seededRng, type BuiltActivity } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved, type Saved } from "@/lib/store";
import { pick, say, stopVoice } from "@/lib/voice";

/*
 * 놀이터 — 오늘의 놀이에서 만난 놀이를 언제든(하루 한 번 제한 없이). 수 범위는 지금까지 만난 숫자 친구까지(curriculum/games).
 * 카드 그림은 힉스필드 "scene:free:<놀이>"(넘버블럭스 친구가 그 놀이를 하는 장면) — 없으면 이모지.
 * 블록은 놀이마다 하루 첫 판만 1개(lib/progress finishGame).
 */

type Phase = { name: "list" } | { name: "playing"; game: Game; built: BuiltActivity; startedAt: number } | { name: "done"; game: Game; earned: number };

function GameArt({ g }: { g: Game }) {
  const src = imageOf(`scene:free:${g.id}`);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- 카드 칸을 꽉 채우는 장면 그림(크기를 미리 모른다)
    return <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />;
  }
  return (
    <span className="text-[min(12vh,calc(9*var(--vw)))] leading-none">
      <Icon id={`play:${g.id}`} emoji={g.icon} />
    </span>
  );
}

/** 아는 수·규칙 단계 — 지금 진도로 */
function contextOf(saved: Saved, master: boolean): PlayContext {
  const abc = firstPattern("abc");
  return {
    top: master ? MAX_NUMBER : topNumber(saved.progress),
    patternLevel: master || (abc && reached(saved.progress, abc.chapter, abc.day)) ? "abc" : "ab",
  };
}

/**
 * 오늘의 미션에서 바로 왔으면(?g=놀이, 2026-10-28) 그 놀이로 시작 — 첫 렌더에 한 번. 화면은 ssr 없이 그려서 기기 진도를 바로 읽는다.
 * 아직 안 열린 놀이면 목록으로.
 */
function initialPhase(): Phase {
  const g = gameOf(new URLSearchParams(window.location.search).get("g") ?? "");
  if (!g) return { name: "list" };
  const saved = readSaved();
  const master = currentAuth()?.user.role === "master";
  if (!isOpen(saved, gameOpens(g), master)) return { name: "list" };
  return { name: "playing", game: g, ...freshGame(g, contextOf(saved, master)) };
}

/** 새 판 — 섞을 씨앗과 시작 시각을 지금 시각으로. 카드를 누를 때만 부른다(렌더 중에 부르지 않는다) */
function freshGame(g: Game, ctx: PlayContext): { built: BuiltActivity; startedAt: number } {
  const now = Date.now();
  return { built: buildActivity(g.spec(ctx), seededRng(now)), startedAt: now };
}

export default function FreeScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [phase, setPhase] = useState<Phase>(initialPhase);
  // 미션에서 바로 시작했으면 놀이가 먼저 말한다 — 놀이터 인사는 건너뛴다
  const [fromMission] = useState(() => phase.name === "playing");
  const menu = menuOf("free");

  useEffect(() => {
    if (fromMission) window.history.replaceState(null, "", window.location.pathname);
    else void say(LINES.free);
    return () => stopVoice();
  }, [fromMission]);

  if (!saved) return <Splash />;

  const ctx = contextOf(saved, master);

  const start = (g: Game) => {
    sfx.wake();
    sfx.pop();
    setPhase({ name: "playing", game: g, ...freshGame(g, ctx) });
  };

  if (phase.name === "playing") {
    return (
      <ModeShell title={phase.game.title} icon={phase.game.icon} iconId={`play:${phase.game.id}`} scene="free" onBack={() => setPhase({ name: "list" })}>
        <ActivityHost
          built={phase.built}
          assess={false}
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
    <ModeShell title={menu.title} icon={menu.icon} iconId="menu:free" scene="free">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 p-5 pb-8 sm:grid-cols-3 lg:grid-cols-5 portrait:gap-3 portrait:p-3">
        {GAMES.map((g) => {
          const opens = gameOpens(g);
          const open = isOpen(saved, opens, master);
          const reach = gameReach(g.id, ctx.top);
          return (
            <MenuCard
              key={g.id}
              tone={g.tone}
              art={<GameArt g={g} />}
              artClassName="aspect-[4/3]"
              title={g.title}
              // 수 범위가 없는 놀이(모양·규칙·크기·나누기)도 빈 줄을 둬서 카드 높이·그림 칸을 다른 카드와 같게
              sub={open ? (reach ? `${nameOf(Math.min(reach, MAX_NUMBER))}까지` : " ") : undefined}
              locked={!open}
              lockText={`${chapterOf(opens.chapter)?.no ?? opens.chapter}장 ${opens.day}일에 열려요`}
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
        <DoneBurst
          earned={phase.earned}
          text="놀이 끝!"
          nextLabel="또 할래"
          onNext={() => {
            const g = gameOf(phase.game.id);
            if (g) start(g);
          }}
          secondLabel="다른 놀이"
          onSecond={() => setPhase({ name: "list" })}
        />
      )}
    </ModeShell>
  );
}
