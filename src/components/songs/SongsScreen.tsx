"use client";

import { useEffect, useRef, useState } from "react";
import { FriendArt } from "@/components/Art";
import { ModeShell } from "@/components/ModeShell";
import { Splash, toneAt } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { TUBE_SONGS, tubeKey } from "@/curriculum/tubeSongs";
import { sfx } from "@/lib/sfx";
import { songBlob, useSongs } from "@/lib/songs";
import { clockOf, numberOfTitle } from "@/lib/songTitle";
import { useSaved } from "@/lib/store";
import { say, stopVoice } from "@/lib/voice";
import { loadTube, TUBE, type TubePlayer } from "@/lib/youtube";
import { SongArt } from "./SongArt";

/*
 * 노래 — 앱에 들어 있는 유튜브 노래(curriculum/tubeSongs)와 부모가 이 폰에 넣어 둔 노래·영상을 아이가 듣고 본다(2026-10-29 사용자).
 * 파일은 기기에만(lib/songs) — 인터넷에 올리지 않는다. 유튜브 노래는 유튜브 플레이어 그대로(lib/youtube) — 플레이어 위에는 아무것도 덮지 않는다.
 * 유튜브 노래 목록처럼(사용자가 보여 준 「믹스 - 넘버블럭스 - 한국」): 위(가로 화면은 왼쪽)에 지금 노래 — 영상이면 영상, 소리면 숫자 친구 그림 —
 * 아래(오른쪽)에 한 줄씩 노래 목록(그림 · 이름 · 길이, 지금 노래는 ▶). 노래 이름이 숫자면(「일」 「오」) 그 숫자 친구가 그림.
 * 한 곡이 끝나면 다음 곡, 끝까지 가면 처음부터. 노래가 나오는 동안은 앱 목소리를 멈춘다(겹치지 않게).
 * 홈 노래 풍선에서 오면(/songs?play=열쇠) 그 노래를 바로 튼다.
 */

function PlayGlyph({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
      <rect x="5.5" y="4.5" width="4.5" height="15" rx="1.4" fill="currentColor" />
      <rect x="14" y="4.5" width="4.5" height="15" rx="1.4" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
      <path d="M7 4.6v14.8a1 1 0 0 0 1.5.86l12-7.4a1 1 0 0 0 0-1.72l-12-7.4A1 1 0 0 0 7 4.6z" fill="currentColor" />
    </svg>
  );
}

/** 지금 나오는 노래 — 막대가 통통 */
function Bars() {
  return (
    <span aria-hidden className="flex h-5 items-end gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="w-1.5 animate-hop rounded-full bg-brand" style={{ height: `${50 + ((i * 37) % 50)}%`, animationDelay: `${i * 0.12}s` }} />
      ))}
    </span>
  );
}

/** 목록 한 줄 — 유튜브 노래 또는 이 폰에 넣은 파일 */
interface Row {
  key: string;
  title: string;
  /** 유튜브 영상 번호 — 폰 파일이면 없다 */
  tube?: string;
  video: boolean;
  duration: number;
}

export default function SongsScreen() {
  const saved = useSaved();
  const songs = useSongs();
  const menu = menuOf("songs");
  // 폰 파일은 소리·영상 모두 이 하나로 튼다 — 소리 파일이면 영상 칸을 숨기고 친구 그림을 보인다
  const media = useRef<HTMLVideoElement>(null);
  const url = useRef<string | null>(null);
  // 유튜브 플레이어 — 처음 유튜브 노래를 고를 때 만든다. 준비되기 전에 고른 노래는 want 에 두었다가 준비되면 튼다
  const tubeBox = useRef<HTMLDivElement>(null);
  const tube = useRef<TubePlayer | null>(null);
  const tubeReady = useRef(false);
  const tubeWant = useRef<string | null>(null);
  const tubeEnd = useRef<() => void>(() => undefined);
  const asked = useRef(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [filePlaying, setFilePlaying] = useState(false);
  const [tubePlaying, setTubePlaying] = useState(false);
  const [tubeTrouble, setTubeTrouble] = useState<"offline" | "error" | null>(null);
  const [progress, setProgress] = useState(0);

  // 유튜브 노래가 먼저, 그 아래 이 폰에 넣은 파일(넣은 차례)
  const rows: Row[] = [
    ...TUBE_SONGS.map((t) => ({ key: tubeKey(t.id), title: t.title, tube: t.id, video: true, duration: t.seconds ?? 0 })),
    ...(songs ?? []).map((s) => ({ key: s.id, title: s.title, video: s.video, duration: s.duration })),
  ];
  const nowTube = !!rows.find((r) => r.key === current)?.tube;

  useEffect(() => {
    // 홈 노래 풍선에서 왔으면 노래가 바로 나오니 안내 말은 건너뛴다
    if (!new URLSearchParams(window.location.search).get("play")) void say(LINES.songs);
    // 화면을 나가면 영상 요소가 문서에서 빠지면서 저절로 멈춘다(HTML 규칙) — 여기선 목소리·파일 주소·유튜브 플레이어만 정리
    return () => {
      stopVoice();
      if (url.current) URL.revokeObjectURL(url.current);
      try {
        tube.current?.destroy();
      } catch {
        // 이미 사라진 플레이어
      }
      tube.current = null;
      tubeReady.current = false;
    };
  }, []);

  /** 유튜브 노래를 멈춘다 — 다른 노래로 갈 때(숨은 채 소리가 나지 않게) */
  const pauseTube = () => {
    tubeWant.current = null;
    if (tubeReady.current) tube.current?.pauseVideo();
    setTubePlaying(false);
  };

  /** 폰 파일 한 곡 — 파일을 꺼내서 */
  const playFile = async (row: Row) => {
    const el = media.current;
    if (!el) return;
    pauseTube();
    const blob = await songBlob(row.key);
    if (!blob) return;
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = URL.createObjectURL(blob);
    el.src = url.current;
    setCurrent(row.key);
    setProgress(0);
    try {
      await el.play();
      setFilePlaying(true);
    } catch {
      setFilePlaying(false);
    }
  };

  /** 유튜브 노래 — 플레이어가 없으면 만들고, 있으면 그 노래로 바꾼다 */
  const playTube = async (row: Row, id: string) => {
    media.current?.pause();
    setCurrent(row.key);
    setProgress(0);
    setTubeTrouble(null);
    tubeWant.current = id;
    if (tube.current) {
      if (tubeReady.current) tube.current.loadVideoById(id);
      return;
    }
    let api;
    try {
      api = await loadTube();
    } catch {
      if (tubeWant.current === id) setTubeTrouble("offline");
      return;
    }
    const box = tubeBox.current;
    // 기다리는 사이 다른 노래를 골라 플레이어가 이미 생겼으면 그 플레이어로(준비 전이면 onReady 가 튼다)
    const made = tube.current as TubePlayer | null;
    if (made) {
      if (tubeReady.current && tubeWant.current) made.loadVideoById(tubeWant.current);
      return;
    }
    // 그사이 파일 노래로 갔거나 화면을 나갔으면 만들지 않는다
    if (!box || !tubeWant.current) return;
    // 유튜브가 넘겨받은 칸을 플레이어(iframe)로 바꾼다 — 리액트가 그리는 칸 안에 따로 하나 만들어 넘긴다
    const spot = document.createElement("div");
    box.replaceChildren(spot);
    tube.current = new api.Player(spot, {
      host: "https://www.youtube-nocookie.com",
      width: "100%",
      height: "100%",
      playerVars: { playsinline: 1, rel: 0, iv_load_policy: 3, hl: "ko" },
      events: {
        onReady: (e) => {
          tubeReady.current = true;
          if (tubeWant.current) e.target.loadVideoById(tubeWant.current);
        },
        onStateChange: (e) => {
          setTubePlaying(e.data === TUBE.playing || e.data === TUBE.buffering);
          if (e.data === TUBE.ended) tubeEnd.current();
        },
        onError: () => {
          setTubePlaying(false);
          setTubeTrouble("error");
        },
      },
    });
  };

  /** 한 곡 틀기 */
  const playRow = (row: Row) => {
    stopVoice();
    if (row.tube) void playTube(row, row.tube);
    else void playFile(row);
  };

  const next = (from: string | null) => {
    if (!rows.length) return;
    const i = rows.findIndex((r) => r.key === from);
    playRow(rows[(i + 1) % rows.length]);
  };

  // 폰 파일 재생 상태를 화면에 — 끝나면 다음 곡(목록이 바뀌어도 최신 next 를 쓰게 매번 다시 단다)
  useEffect(() => {
    const el = media.current;
    if (!el) return;
    const onTime = () => {
      if (!nowTube) setProgress(el.duration ? el.currentTime / el.duration : 0);
    };
    const onEnd = () => next(current);
    const onPause = () => setFilePlaying(false);
    const onPlay = () => setFilePlaying(true);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("pause", onPause);
    el.addEventListener("play", onPlay);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("play", onPlay);
    };
  });

  // 유튜브 노래가 끝나면 다음 곡 — 플레이어는 한 번만 만드니 최신 next 를 여기서 넘겨 둔다
  useEffect(() => {
    tubeEnd.current = () => next(current);
  });

  // 유튜브 노래는 진행 막대를 직접 읽는다(나오는 동안 0.5초마다)
  useEffect(() => {
    if (!tubePlaying || !nowTube) return;
    const t = window.setInterval(() => {
      const p = tube.current;
      if (!p || !tubeReady.current) return;
      const d = p.getDuration();
      setProgress(d ? p.getCurrentTime() / d : 0);
    }, 500);
    return () => window.clearInterval(t);
  }, [tubePlaying, nowTube]);

  // 홈 노래 풍선에서 왔으면(/songs?play=열쇠) 목록을 읽은 뒤 그 노래를 바로 — 한 번만, 주소에서는 지운다
  useEffect(() => {
    if (asked.current || songs === null) return;
    asked.current = true;
    const key = new URLSearchParams(window.location.search).get("play");
    if (!key) return;
    window.history.replaceState(null, "", window.location.pathname);
    const row = rows.find((r) => r.key === key);
    if (row) window.setTimeout(() => playRow(row), 0);
  });

  if (!saved || songs === null) return <Splash />;

  const friends = saved.progress.friends.length ? saved.progress.friends : [1, 2, 3, 4, 5];
  const artOf = (r: Row, i: number) => numberOfTitle(r.title) ?? friends[i % friends.length];
  const nowIdx = rows.findIndex((r) => r.key === current);
  const now = nowIdx >= 0 ? rows[nowIdx] : null;
  const playing = now?.tube ? tubePlaying : filePlaying;
  const showVideo = !!now && !now.tube && now.video;
  const showTube = !!now?.tube && !tubeTrouble;

  const toggle = () => {
    sfx.wake();
    if (!now) {
      if (rows.length) playRow(rows[0]);
      return;
    }
    if (now.tube) {
      // 플레이어가 아직 없거나 못 나온 노래면 처음부터 다시
      if (!tube.current || !tubeReady.current || tubeTrouble) {
        playRow(now);
        return;
      }
      if (tubePlaying) tube.current.pauseVideo();
      else tube.current.playVideo();
      return;
    }
    const el = media.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId={`menu:${menu.id}`} scene="free">
      {rows.length === 0 && (
        <div className="grid min-h-full place-items-center p-6">
          <div className="glass flex max-w-md flex-col items-center gap-3 rounded-[2rem] px-8 py-6 text-center">
            <FriendArt n={friends[0]} height="min(22vh, 9rem)" className="animate-float" />
            <p className="text-2xl font-extrabold">아직 노래가 없어요</p>
            <p className="font-body text-lg text-ink-soft">부모님이 부모 페이지 「노래」에서 이 폰에 노래나 영상을 넣어 주면 여기서 듣고 볼 수 있어요.</p>
          </div>
        </div>
      )}
      <div className={rows.length ? "mx-auto grid h-full w-full max-w-6xl gap-4 p-4 landscape:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] portrait:flex portrait:h-auto portrait:flex-col portrait:p-3" : "hidden"}>
        {/* 지금 노래 — 영상이면 영상(유튜브 노래는 유튜브 플레이어), 소리면 숫자 친구 그림 + 재생 단추 */}
        <div className="flex min-h-0 flex-col gap-3">
          <div
            className="relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-[1.8rem] bg-ink/90 portrait:aspect-video portrait:flex-none"
            style={{ background: showVideo || showTube ? undefined : `var(--${toneAt(now ? artOf(now, nowIdx) + 1 : 2)})` }}
          >
            {/* 영상 칸 — 소리 파일일 때는 숨긴다(같은 요소로 소리도 낸다) */}
            <video ref={media} playsInline onClick={toggle} className={showVideo ? "h-full w-full object-contain" : "hidden"} />
            {/* 유튜브 플레이어 칸 — 유튜브 화면 그대로 보인다(위에 단추·그림을 덮지 않는다 — 유튜브 약관) */}
            <div ref={tubeBox} className={showTube ? "absolute inset-0" : "hidden"} />
            {!showVideo && !showTube && (
              <button type="button" onClick={toggle} aria-label={playing ? "멈춤" : "듣기"} className="flex flex-col items-center gap-2 p-4">
                <SongArt n={now ? artOf(now, nowIdx) : friends[0]} height="min(34vh, 13rem)" className={playing ? "animate-wiggle" : "animate-float"} />
                <span className="rounded-full bg-white/85 px-5 py-1.5 text-2xl font-extrabold short:text-xl">{now ? now.title : "노래를 골라 봐!"}</span>
                {now?.tube && tubeTrouble && (
                  <span className="rounded-full bg-white/85 px-4 py-1 text-base font-bold text-ink-soft">
                    {tubeTrouble === "offline" ? "인터넷이 연결되면 나와요" : "이 노래는 지금 나올 수 없어요"}
                  </span>
                )}
              </button>
            )}
            {showVideo && (
              <button
                type="button"
                aria-label="크게 보기"
                onClick={() => {
                  sfx.tick();
                  void media.current?.requestFullscreen?.().catch(() => undefined);
                }}
                className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/85 text-xl text-ink"
              >
                <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
          <div className="glass flex items-center gap-3 rounded-[1.6rem] px-4 py-2.5">
            <button type="button" aria-label={playing ? "멈춤" : "듣기"} onClick={toggle} className="cta grid h-16 w-16 shrink-0 place-items-center rounded-full text-3xl text-white short:h-12 short:w-12 short:text-2xl">
              <PlayGlyph playing={playing} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-extrabold">{now ? now.title : "노래를 골라 봐!"}</p>
              <span className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-ink/10">
                <span className="block h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </span>
            </div>
            <button
              type="button"
              aria-label="다음 노래"
              onClick={() => {
                sfx.pop();
                next(current);
              }}
              className="squish grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl short:h-11 short:w-11"
            >
              <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
                <path d="M5 5.2v13.6a.9.9 0 0 0 1.4.75l9.4-6.8a.9.9 0 0 0 0-1.5L6.4 4.45A.9.9 0 0 0 5 5.2z" fill="currentColor" />
                <rect x="17" y="5" width="3" height="14" rx="1.2" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* 노래 목록 — 한 줄씩(그림 · 이름 · 길이), 지금 노래는 ▶ */}
        <ol className="glass flex min-h-0 flex-col gap-1 overflow-y-auto rounded-[1.8rem] p-2">
          {rows.map((r, i) => {
            const on = r.key === current;
            const n = artOf(r, i);
            const len = clockOf(r.duration);
            return (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => {
                    sfx.pop();
                    if (on) toggle();
                    else playRow(r);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[1.2rem] px-2 py-1.5 text-left transition-colors active:scale-[0.98] ${on ? "bg-rose/60" : "hover:bg-white/60"}`}
                >
                  <span className="grid w-5 shrink-0 place-items-center text-sm text-brand">{on ? playing ? <Bars /> : "▶" : ""}</span>
                  <span className="relative grid h-[min(12vh,4.6rem)] shrink-0 place-items-end overflow-hidden rounded-[0.9rem] px-1" style={{ aspectRatio: "16 / 10", background: `var(--${toneAt(n + 1)})` }}>
                    <span className="mx-auto">
                      <SongArt n={n} height="min(10.5vh, 4rem)" />
                    </span>
                    {len && <span className="absolute bottom-1 right-1 rounded-md bg-ink/75 px-1.5 text-xs font-bold text-white">{len}</span>}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-lg font-extrabold">{r.title}</span>
                    <span className="block text-sm font-semibold text-ink-soft">{r.tube ? "유튜브" : r.video ? "영상" : "노래"}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </ModeShell>
  );
}
