"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BlockIcon, FriendTight } from "@/components/Art";
import { DragGhost, useDragDrop } from "@/components/games/drag";
import { ColorCube } from "@/components/games/pieces";
import { ModeShell } from "@/components/ModeShell";
import { ReadAlong } from "@/components/ReadAlong";
import { Splash } from "@/components/ui";
import { blockColor } from "@/curriculum/friends";
import { LINES, meetHello } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { MAX_NUMBER, nameOf, range, sinoOf } from "@/curriculum/numbers";
import { imageOf } from "@/lib/assets";
import { FLOOR_BLOCKS, placeBlock, wallet } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved } from "@/lib/store";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";

/*
 * 블록 탑 — 놀이로 모은 블록을 쓰는 곳(2026-10-28 사용자: 블록이 쌓이기만 하고 쓸 데가 없었다).
 * 블록을 끌어 올리거나(눌러도 된다) 하나씩 쌓으면 "하나, 둘…" 세고, 10개가 모이면 한 층 완성 — 그 층 번호의 숫자 친구가 이사 온다
 * (1층 일, 2층 이 … 20층 이십, 그다음은 다시 일부터). 층 블록은 그 친구 색(7 무지개·9 회색·10 흰 블록). 다음에 이사 올 친구는 그림자로 미리.
 * 쌓은 블록은 돌아오지 않는다 — 남은 블록 = 모은 블록 − 쌓은 블록(lib/progress wallet).
 */

/** 그 층에 사는 친구 */
const residentOf = (floor: number) => ((floor - 1) % MAX_NUMBER) + 1;
/** 한 층 = 다섯 개씩 두 줄 */
const ROW = 5;

/** 하나 쌓기 — 렌더 밖에서 최신 진도로. 쌓았으면 그 블록이 이 층 몇 번째인지(10이면 층 완성) */
function placeOne(): { inFloor: number; floorDone: number } | null {
  const res = placeBlock(readSaved().progress);
  if (res.placed === readSaved().progress.towerPlaced) return null;
  updateSaved((s) => ({ ...s, progress: res.next }));
  return { inFloor: res.placed % FLOOR_BLOCKS || FLOOR_BLOCKS, floorDone: res.floorDone };
}

/** 다 지은 층 — 블록 열 개(그 친구 색) + 사는 친구 */
function Floor({ floor, cube, fresh }: { floor: number; cube: string; fresh: boolean }) {
  const k = residentOf(floor);
  return (
    <div className={`flex items-end gap-2 ${fresh ? "animate-pop-in" : ""}`}>
      <span className="w-[3.2rem] text-right text-base font-extrabold text-ink-soft short:text-sm">{floor}층</span>
      <span className="grid gap-[3px] rounded-[0.6rem] bg-white/50 p-[3px]" style={{ gridTemplateColumns: `repeat(${ROW}, ${cube})` }}>
        {range(0, FLOOR_BLOCKS - 1).map((i) => {
          const c = blockColor(k, Math.floor(i / ROW) === 0 ? 1 : 0);
          return <ColorCube key={i} size={cube} fill={c.fill} edge={c.edge} />;
        })}
      </span>
      <FriendTight n={k} height={`calc(${cube} * 2.3)`} className={fresh ? "animate-wiggle" : ""} />
    </div>
  );
}

export default function TowerScreen() {
  const saved = useSaved();
  const later = useTimers();
  const menu = menuOf("tower");
  // 방금 다 지은 층 — 잠깐 크게 축하
  const [fresh, setFresh] = useState<number | null>(null);

  useEffect(() => {
    void say(LINES.tower);
    return () => stopVoice();
  }, []);

  const place = () => {
    sfx.wake();
    const r = placeOne();
    if (!r) {
      sfx.boop();
      void say(LINES.towerEmpty);
      return;
    }
    if (r.floorDone) {
      sfx.cheer();
      setFresh(r.floorDone);
      later(() => setFresh(null), 3200);
      void say([nameOf(r.inFloor), LINES.towerFloor, meetHello(residentOf(r.floorDone))]);
      return;
    }
    sfx.pop();
    void say(nameOf(r.inFloor));
  };

  const { drag, begin } = useDragDrop<number>((_, zone) => {
    if (zone === "tower") place();
  });

  if (!saved) return <Splash />;

  const p = saved.progress;
  const left = wallet(p);
  const floors = Math.floor(p.towerPlaced / FLOOR_BLOCKS);
  const part = p.towerPlaced % FLOOR_BLOCKS;
  const next = residentOf(floors + 1);
  // 쌓는 차례(0~9) 기준 — 0~4 아래 줄, 5~9 윗줄
  const nextColor = (i: number) => blockColor(next, Math.floor(i / ROW));
  const cube = "min(7.5vh, calc(6.4*var(--vw)))";
  const shadow = imageOf(`shadow:${next}`);
  const trayN = Math.min(left, 8);

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId={`menu:${menu.id}`} scene="free">
      <div className="flex min-h-full flex-col items-center px-4 pt-2">
        <p className="glass rounded-full px-6 py-2 text-center text-2xl font-extrabold short:text-xl">
          <ReadAlong text={fresh ? LINES.towerFloor : left ? LINES.towerDrag : LINES.towerEmpty} />
        </p>
        <span className="mt-2 rounded-full bg-white/80 px-4 py-1 text-lg font-extrabold">
          {floors > 0 ? `${floors}층 탑` : "첫 층을 지어 볼까?"}
        </span>

        {/* 탑 — 맨 위가 짓는 중인 층, 아래로 갈수록 먼저 지은 층 */}
        <div data-drop="tower" className={`my-auto flex flex-col items-center gap-1.5 rounded-[1.8rem] px-4 pb-2 pt-3 transition-transform ${drag?.over === "tower" ? "scale-[1.03] bg-white/40 ring-8 ring-brand/30" : ""}`}>
          {/* 짓는 중인 층 + 이사 올 친구 그림자 */}
          <div className="flex items-end gap-2">
            <span className="w-[3.2rem] text-right text-base font-extrabold text-brand short:text-sm">{floors + 1}층</span>
            <span className="grid gap-[3px] rounded-[0.6rem] bg-white/70 p-[3px] ring-2 ring-brand/40" style={{ gridTemplateColumns: `repeat(${ROW}, ${cube})` }}>
              {range(0, FLOOR_BLOCKS - 1)
                // 아래 줄부터 채운다 — 화면엔 윗줄 다섯이 먼저
                .map((i) => (i < ROW ? i + ROW : i - ROW))
                .map((i) => {
                  const c = nextColor(i);
                  return (
                    <span key={i} className="grid place-items-center rounded-[18%]" style={{ width: cube, height: cube, border: i < part ? undefined : `2px dashed ${c.edge ?? c.fill}` }}>
                      {i < part && (
                        <span className="flex animate-drop-in">
                          <ColorCube size={cube} fill={c.fill} edge={c.edge} />
                        </span>
                      )}
                    </span>
                  );
                })}
            </span>
            <span className="relative grid place-items-end" style={{ width: `calc(${cube} * 1.6)`, height: `calc(${cube} * 2.3)` }}>
              {shadow ? (
                <Image src={shadow} alt="" fill sizes="80px" className="pointer-events-none object-contain opacity-70" />
              ) : (
                <span className="text-3xl font-extrabold text-ink-soft">?</span>
              )}
              <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-white text-base font-extrabold text-brand shadow">?</span>
            </span>
          </div>
          {range(1, floors)
            .reverse()
            .map((f) => (
              <Floor key={f} floor={f} cube={cube} fresh={fresh === f} />
            ))}
          {/* 땅 */}
          <span className="mt-1 h-3 w-[min(80vw,24rem)] rounded-full bg-[#9ad06b]" />
        </div>

        {/* 블록 상자 — 끌어서 탑에, 눌러도 하나 */}
        <div className="sticky bottom-0 w-full pb-3 pt-4">
          <div className="glass mx-auto flex max-w-[min(94vw,40rem)] flex-wrap items-center justify-center gap-2 rounded-[1.6rem] px-4 py-3">
            <span className="mr-1 text-xl font-extrabold">남은 블록 {left}개</span>
            {trayN === 0 ? (
              <button type="button" onClick={place} className="rounded-full bg-paper-deep/70 px-4 py-2 text-lg font-bold text-ink-soft">
                놀이를 하면 블록이 생겨요
              </button>
            ) : (
              range(1, trayN).map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="블록"
                  onPointerDown={begin(i)}
                  onClick={place}
                  style={{ touchAction: "none" }}
                  className={`cursor-grab ${drag && i === trayN ? "opacity-0" : ""}`}
                >
                  <BlockIcon size={44} />
                </button>
              ))
            )}
            {left > trayN && <span className="text-lg font-extrabold text-ink-soft">+{left - trayN}</span>}
          </div>
        </div>
        {fresh !== null && (
          <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
            <div className="glass flex animate-pop-in flex-col items-center gap-1 rounded-[2rem] px-8 py-4">
              <FriendTight n={residentOf(fresh)} height="min(26vh, 11rem)" />
              <span className="text-3xl font-extrabold">
                {fresh}층 완성! <span className="text-brand">{sinoOf(residentOf(fresh))}</span>
              </span>
            </div>
          </div>
        )}
      </div>
      <DragGhost drag={drag}>{() => <BlockIcon size={52} />}</DragGhost>
    </ModeShell>
  );
}
