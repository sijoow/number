"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BlockIcon, FriendTight } from "@/components/Art";
import { DragGhost, useDragDrop } from "@/components/games/drag";
import { ColorCube } from "@/components/games/pieces";
import { ModeShell } from "@/components/ModeShell";
import { ReadAlong } from "@/components/ReadAlong";
import { Splash } from "@/components/ui";
import { blockColor } from "@/curriculum/friends";
import { buildAsk, LINES, meetBlocks, meetHello } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { nameOf, range, sinoOf } from "@/curriculum/numbers";
import { imageOf } from "@/lib/assets";
import { placeBlock, villageOf, wallet } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved } from "@/lib/store";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";

/*
 * 친구 집 짓기 — 놀이로 모은 블록을 쓰는 곳(2026-10-28 사용자: 블록 탑은 무슨 놀이인지, 층 쌓는 기준을 모르겠다).
 * 숫자 친구는 자기 숫자만큼 블록으로 집을 짓는다 — 일 1개, 이 2개, 삼 3개 … 이십 20개. 집이 나란히 서면 숫자 계단이 된다.
 * 짓는 집에는 칸마다 1, 2, 3… 번호, 위에는 이사 올 친구 그림자. 블록 상자(바로 아래)에서 끌어 오거나 눌러서 하나씩 놓으면
 * "하나, 둘…" 세고, 다 채우면 "셋! 블록이 세 개야. 집 완성!" 하고 그 친구가 지붕 위로 이사 온다.
 * 열까지는 한 줄 기둥, 열하나부터는 열 줄 + 나머지 줄(열하나 = 열 + 하나). 처음 들어오면 블록이 상자에서 빈칸으로 가는 시범.
 * 쓴 블록은 돌아오지 않는다 — 남은 블록 = 모은 블록 − 쓴 블록(lib/progress wallet · villageOf).
 */

/** 집 한 채의 기둥 높이들 — 열까지는 한 줄, 열하나부터는 열 + 나머지 */
const columnsOf = (k: number) => (k <= 10 ? [k] : [10, k - 10]);
/** 기둥 c 의 아래에서 i 번째 블록 색 — 열 줄은 흰 블록, 나머지 줄은 그 숫자 친구 색(7 무지개 · 9 회색 셋) */
function cubeColor(k: number, c: number, i: number) {
  const n = k <= 10 ? k : c === 0 ? 10 : k - 10;
  return blockColor(n, n === 9 ? Math.floor(i / 3) : i);
}

/** 블록 하나 놓기 — 렌더 밖에서 최신 진도로. 놓았으면 그 집에 몇 번째인지와 방금 다 지은 집 */
function placeOne(): { have: number; houseDone: number } | null {
  const before = readSaved().progress;
  const res = placeBlock(before);
  if (res.placed === before.towerPlaced) return null;
  updateSaved((s) => ({ ...s, progress: res.next }));
  return { have: villageOf(before.towerPlaced).have + 1, houseDone: res.houseDone };
}

const CUBE = "var(--cube)";

/** 친구 집 한 채 — 블록 기둥 + 지붕 위 친구(짓는 중이면 그림자) + 아래 번호판 */
function House({ k, have, state }: { k: number; have: number; state: "built" | "fresh" | "building" }) {
  const building = state === "building";
  const friendH = `calc(${CUBE} * 2.2)`;
  const shadow = imageOf(`shadow:${k}`);
  return (
    <div className="flex flex-col items-center" style={{ minWidth: `calc(${CUBE} * 1.5)` }}>
      {building ? (
        <span className="relative block" style={{ width: friendH, height: friendH }}>
          {shadow && <Image src={shadow} alt="" fill sizes="120px" className="pointer-events-none object-contain object-bottom opacity-60" />}
        </span>
      ) : (
        <FriendTight n={k} height={friendH} className={state === "fresh" ? "animate-pop-in" : ""} />
      )}
      <div className="mt-[3px] flex items-end gap-[3px]">
        {columnsOf(k).map((h, c) => (
          <div key={c} className="flex flex-col-reverse gap-[3px]">
            {range(0, h - 1).map((i) => {
              // 놓는 차례(0부터) — 열 줄을 아래부터 다 채우고 나머지 줄
              const j = c * 10 + i;
              const color = cubeColor(k, c, i);
              if (!building || j < have)
                return (
                  <span key={i} className={building ? "flex animate-drop-in" : "flex"}>
                    <ColorCube size={CUBE} fill={color.fill} edge={color.edge} />
                  </span>
                );
              const next = j === have;
              return (
                <span
                  key={i}
                  data-hint-to={next ? "" : undefined}
                  className={`grid place-items-center rounded-[18%] font-extrabold ${next ? "animate-breathe bg-white/80 text-brand" : "bg-white/45 text-ink-soft"}`}
                  style={{ width: CUBE, height: CUBE, border: `2px dashed ${color.edge ?? color.fill}`, fontSize: `calc(${CUBE} * 0.45)` }}
                >
                  {j + 1}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <span
        className={`mt-1 grid place-items-center rounded-full px-[0.4em] font-extrabold shadow ${building ? "bg-brand text-white" : "bg-white/90 text-ink"}`}
        style={{ fontSize: `calc(${CUBE} * 0.5)`, minWidth: `calc(${CUBE} * 0.95)` }}
      >
        {k}
      </span>
    </div>
  );
}

export default function TowerScreen() {
  const saved = useSaved();
  const later = useTimers();
  const menu = menuOf("tower");
  // 방금 다 지은 집의 친구 — 잠깐 크게 축하
  const [fresh, setFresh] = useState<number | null>(null);
  // 이번에 블록을 하나라도 놓았는지 — 놓기 전까지 시범을 보여 준다
  const [touched, setTouched] = useState(false);
  const street = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = readSaved().progress;
    void say([LINES.tower, LINES.towerRule, wallet(p) ? buildAsk(villageOf(p.towerPlaced).current) : LINES.towerEmpty]);
    return () => stopVoice();
  }, []);

  const place = () => {
    sfx.wake();
    setTouched(true);
    const r = placeOne();
    if (!r) {
      sfx.boop();
      void say(LINES.towerEmpty);
      return;
    }
    if (r.houseDone) {
      sfx.cheer();
      setFresh(r.houseDone);
      later(() => setFresh(null), 3600);
      void say([meetBlocks(r.houseDone), LINES.towerHouse, meetHello(r.houseDone)]);
      return;
    }
    sfx.pop();
    void say(nameOf(r.have));
  };

  const { drag, begin } = useDragDrop<number>((_, zone) => {
    if (zone === "tower") place();
  });

  const p = saved?.progress;
  const v = villageOf(p?.towerPlaced ?? 0);
  // 짓는 집·놓은 수 — 시범 위치가 바뀌는 때(이름이 current 라 ref 로 오해받지 않게 따로 꺼내 둔다)
  const building = v.current;
  const placedHere = v.have;
  const left = p ? wallet(p) : 0;
  const showHint = !touched && left > 0 && fresh === null;

  // 집이 늘면 거리 끝(짓는 집)이 보이게
  useEffect(() => {
    const el = street.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [v.built, v.village]);

  // 시범 — 상자의 블록이 짓는 집의 다음 빈칸으로 날아간다(놓기 전까지 되풀이)
  useEffect(() => {
    if (!showHint) return;
    let anim: Animation | undefined;
    const id = window.setTimeout(() => {
      const from = document.querySelector("[data-hint-from]")?.getBoundingClientRect();
      const to = document.querySelector("[data-hint-to]")?.getBoundingClientRect();
      if (!from || !to || !hint.current) return;
      const a = `translate(${from.left + from.width / 2}px, ${from.top + from.height / 2}px)`;
      const b = `translate(${to.left + to.width / 2}px, ${to.top + to.height / 2}px)`;
      anim = hint.current.animate(
        [
          { transform: a, opacity: 0 },
          { transform: a, opacity: 1, offset: 0.15 },
          { transform: b, opacity: 1, offset: 0.7 },
          { transform: b, opacity: 0 },
        ],
        { duration: 2200, iterations: Infinity, easing: "ease-in-out" },
      );
    }, 1800);
    return () => {
      window.clearTimeout(id);
      anim?.cancel();
    };
  }, [showHint, building, placedHere]);

  if (!saved) return <Splash />;

  // 블록 크기 — 거리 높이에 가장 높은 기둥(+ 친구·번호판)이 들어가게
  const tallest = Math.min(10, v.current);
  const cubeVar = { "--cube": `min(calc(100cqh / ${tallest + 4.6}), 3.6rem, 13cqw)` } as CSSProperties;
  const trayN = Math.min(left, 8);

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId={`menu:${menu.id}`} scene="free">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 flex-col items-center gap-2 px-4 pt-2 short:flex-row short:justify-center short:pt-1">
          <p className="glass rounded-full px-6 py-2 text-center text-2xl font-extrabold short:py-1 short:text-lg">
            <ReadAlong text={fresh ? LINES.towerHouse : left ? buildAsk(v.current) : LINES.towerEmpty} />
          </p>
          <span className="rounded-full bg-white/85 px-4 py-1 text-lg font-extrabold short:text-base">
            {v.village > 1 && <span className="text-ink-soft">{v.village}번째 마을 · </span>}
            {sinoOf(v.current)}의 집 · 블록 <span className="text-brand">{v.have}</span> / {v.current}
          </span>
        </div>

        {/* 거리 — 지은 집(일·이·삼…)이 숫자 계단으로, 맨 끝이 짓는 집 */}
        <div
          data-drop="tower"
          className={`relative mx-2 min-h-0 flex-1 rounded-[1.8rem] transition-colors [container-type:size] ${drag?.over === "tower" ? "bg-white/40 ring-8 ring-brand/30" : ""}`}
          style={cubeVar}
        >
          <div ref={street} className="h-full overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
            <div className="mx-auto flex h-full w-max flex-col justify-end px-4 pb-1">
              <div className="flex items-end" style={{ gap: `calc(${CUBE} * 0.35)` }}>
                {range(1, v.built).map((k) => (
                  <House key={k} k={k} have={k} state={fresh === k ? "fresh" : "built"} />
                ))}
                <House key={`${v.village}-${v.current}`} k={v.current} have={v.have} state="building" />
              </div>
              {/* 땅 */}
              <span className="mt-1 h-2.5 rounded-full bg-[#9ad06b]" />
            </div>
          </div>
        </div>

        {/* 블록 상자 — 끌어서 집에, 눌러도 하나 */}
        <div className="shrink-0 px-3 pb-3 pt-2 short:pb-2 short:pt-1">
          <div className="glass mx-auto flex max-w-[min(94vw,48rem)] flex-wrap short:max-w-[94vw] items-center justify-center gap-2 rounded-[1.6rem] px-4 py-2.5 short:py-1.5">
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
                  data-hint-from={i === 1 ? "" : undefined}
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

        {showHint && (
          <div ref={hint} aria-hidden className="pointer-events-none fixed left-0 top-0 z-30 -ml-[22px] -mt-[22px] opacity-0">
            <BlockIcon size={44} />
            <span className="absolute left-7 top-7 text-4xl">👆</span>
          </div>
        )}
        {fresh !== null && (
          <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
            <div className="glass flex animate-pop-in flex-col items-center gap-1 rounded-[2rem] px-8 py-4">
              <FriendTight n={fresh} height="min(26vh, 11rem)" />
              <span className="text-3xl font-extrabold">
                <span className="text-brand">{sinoOf(fresh)}</span>의 집 완성!
              </span>
            </div>
          </div>
        )}
      </div>
      <DragGhost drag={drag}>{() => <BlockIcon size={52} />}</DragGhost>
    </ModeShell>
  );
}
