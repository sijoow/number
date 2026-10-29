"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SongArt } from "@/components/songs/SongArt";
import { songHref, TUBE_SONGS, tubeKey } from "@/curriculum/tubeSongs";
import { sfx } from "@/lib/sfx";
import { listSongs } from "@/lib/songs";
import { numberOfTitle } from "@/lib/songTitle";
import { readSaved } from "@/lib/store";
import { useTimers } from "@/lib/useTimers";

/*
 * 홈 노래 풍선 — 홈에 들어오고 조금 뒤, 가끔(세 번에 한 번쯤) 메뉴 바 「노래」 곁에 노래 친구가 ♪ 하고 나온다
 * (2026-10-29 사용자: 사이트에 들어오면 한 번씩 메인에서 노래를 보여 주자). 누르면 노래 화면이 열리면서 그 노래가 바로 나온다.
 * 홈에서 저절로 소리를 내지는 않는다 — 유튜브 노래는 플레이어가 보이는 곳에서 아이가 눌러야 튼다(유튜브 약관: 숨긴 채 소리만 틀기 ✕).
 * 노래는 앱에 들어 있는 유튜브 노래와 이 폰에 넣은 파일 중 하나. 「노래」가 메뉴 바 맨 오른쪽이라(curriculum/menus) 풍선도 오른쪽 끝에 붙인다.
 * 자리는 오늘의 미션 카드를 가리지 않게 고른다(spotOf).
 */

const CHANCE = 1 / 3;

interface Peek {
  key: string;
  title: string;
  n: number;
}

type Spot = "above" | "side" | "mini";

/** 풍선 자리 — 메뉴 바 위에 빈틈이 있으면 「노래」 바로 위(세로 화면·작은 가로 폰), 없으면 메뉴 바 오른쪽 옆(넓은 가로 화면), 둘 다 없으면 「노래」 귀퉁이에 동그라미만 */
function spotOf(nav: HTMLElement): Spot {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const r = nav.getBoundingClientRect();
  const above = [...(nav.previousElementSibling?.children ?? [])].reduce((b, c) => Math.max(b, c.getBoundingClientRect().bottom), 0);
  if (r.top - above >= 4 * rem) return "above";
  if (window.innerWidth - r.right >= 10 * rem) return "side";
  return "mini";
}

export function SongPeek() {
  const router = useRouter();
  const later = useTimers();
  // 메뉴 바(부모)를 찾는 표 — 풍선 자리를 잴 때
  const anchor = useRef<HTMLSpanElement>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [spot, setSpot] = useState<Spot>("above");

  useEffect(() => {
    later(() => {
      if (Math.random() >= CHANCE) return;
      void listSongs()
        .catch(() => [])
        .then((files) => {
          const nav = anchor.current?.parentElement;
          const all = [...TUBE_SONGS.map((t) => ({ key: tubeKey(t.id), title: t.title })), ...files.map((f) => ({ key: f.id, title: f.title }))];
          const s = all[Math.floor(Math.random() * all.length)];
          if (!s || !nav) return;
          setSpot(spotOf(nav));
          setPeek({ ...s, n: numberOfTitle(s.title) ?? readSaved().progress.friends[0] ?? 1 });
        });
    }, 2500);
  }, [later]);

  // 화면을 돌리면 자리를 다시 고른다
  useEffect(() => {
    const nav = anchor.current?.parentElement;
    if (!peek || !nav) return;
    const again = () => setSpot(spotOf(nav));
    window.addEventListener("resize", again);
    return () => window.removeEventListener("resize", again);
  }, [peek]);

  const go = () => {
    sfx.wake();
    sfx.pop();
    if (peek) router.push(songHref(peek.key));
  };

  return (
    <>
      <span ref={anchor} hidden />
      {peek &&
        (spot === "mini" ? (
          <button
            type="button"
            aria-label={`${peek.title} 노래 듣기`}
            onClick={go}
            className="absolute -top-5 right-3 grid h-11 w-11 animate-pop-in place-items-end justify-center overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-rose active:scale-95"
          >
            <SongArt n={peek.n} height="2.5rem" />
            <span aria-hidden className="absolute left-1 top-0 animate-hop text-sm text-brand">
              ♪
            </span>
          </button>
        ) : (
          <button
            type="button"
            aria-label={`${peek.title} 노래 듣기`}
            onClick={go}
            className={`absolute flex animate-pop-in items-center gap-1.5 rounded-full bg-rose py-1 pl-1 pr-4 shadow-lg ring-2 ring-white/90 active:scale-95 ${spot === "side" ? "left-full top-1/2 ml-3 -translate-y-1/2" : "bottom-full right-2 mb-2"}`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-end justify-center overflow-hidden rounded-full bg-white/85 short:h-9 short:w-9">
              <SongArt n={peek.n} height="2.5rem" />
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap text-lg font-extrabold short:text-base">
              <span className="animate-hop text-brand">♪</span>
              {peek.title} 노래
            </span>
            {/* 꼬리 — 「노래」 메뉴를 가리킨다(위에 뜨면 아래로, 옆에 뜨면 왼쪽으로) */}
            <span aria-hidden className={`absolute h-3.5 w-3.5 rotate-45 bg-rose ${spot === "side" ? "-left-1.5 top-[calc(50%-0.4375rem)]" : "-bottom-1.5 right-[1.6rem]"}`} />
          </button>
        ))}
    </>
  );
}
