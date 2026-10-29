"use client";

import { useEffect, useRef, useState } from "react";
import { toneStyle } from "@/components/ui";
import { TUBE_SONGS } from "@/curriculum/tubeSongs";
import { addSongs, removeSong, SONG_MAX_BYTES, songBlob, useSongs, VIDEO_MAX_BYTES } from "@/lib/songs";
import { clockOf } from "@/lib/songTitle";
import { Card } from "./report";

/*
 * 노래 넣기(부모) — 폰에 있는 노래·영상 파일을 골라 이 기기에만 넣는다(lib/songs, 2026-10-29 사용자 — 영상 파일도). 아이는 「노래」 메뉴에서 듣고 본다.
 * 서버·인터넷에는 올라가지 않는다 — 기기마다 따로 넣고, 사이트 데이터를 지우면 함께 지워진다.
 */

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)}MB`;

export function SongsCard() {
  const songs = useSongs();
  const input = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLAudioElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [hearing, setHearing] = useState<string | null>(null);

  useEffect(() => {
    const el = new Audio();
    preview.current = el;
    const stop = () => setHearing(null);
    el.addEventListener("ended", stop);
    return () => {
      el.pause();
      el.removeEventListener("ended", stop);
      if (el.src) URL.revokeObjectURL(el.src);
    };
  }, []);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setNote(null);
    try {
      const { added, skipped } = await addSongs([...files]);
      setNote(`${added}곡 넣었어요.${skipped.length ? ` 넣지 못한 파일(노래·영상 파일이 아니거나 너무 큼 — 노래 ${mb(SONG_MAX_BYTES)} · 영상 ${mb(VIDEO_MAX_BYTES)}까지): ${skipped.join(", ")}` : ""}`);
    } catch {
      setNote("넣지 못했어요 — 폰 저장 공간이 모자라거나 이 브라우저가 저장을 막았어요.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const hear = async (id: string) => {
    const el = preview.current;
    if (!el) return;
    if (hearing === id) {
      el.pause();
      setHearing(null);
      return;
    }
    const blob = await songBlob(id);
    if (!blob) return;
    if (el.src) URL.revokeObjectURL(el.src);
    el.src = URL.createObjectURL(blob);
    setHearing(id);
    void el.play().catch(() => setHearing(null));
  };

  const total = (songs ?? []).reduce((n, s) => n + s.size, 0);

  return (
    <Card title="노래·영상 (이 폰에만)">
      <p className="text-base text-ink-soft">
        폰에 있는 노래(mp3 등)·영상(mp4 등) 파일을 골라 넣으면 아이 화면 「노래」에서 듣고 볼 수 있어요. 파일은 <b>이 폰에만</b> 저장되고 인터넷(서버)에는 올라가지 않아요 — 폰마다 따로 넣어 주세요.
        여러 곡을 한 번에 골라도 되고, 이름이 「01. 일」처럼 숫자면 그 숫자 친구가 노래 그림이 돼요. 음원 사이트에서 MP3 로 산 파일은 바로 넣을 수 있어요(스트리밍 앱에 저장한 곡은 잠겨 있어서 안 돼요).
      </p>
      <p className="mt-2 text-base text-ink-soft">
        유튜브 노래({TUBE_SONGS.map((t) => `「${t.title}」`).join(" ")})도 들어 있어요 — 인터넷이 될 때 유튜브 화면 그대로 나오고, 유튜브 광고가 나올 수 있어요.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className={`squish cursor-pointer rounded-2xl px-5 py-3 font-display text-xl ${busy ? "pointer-events-none opacity-60" : ""}`} style={toneStyle("rose")}>
          {busy ? "넣는 중…" : "노래·영상 파일 넣기"}
          <input ref={input} type="file" accept="audio/*,video/*" multiple className="sr-only" onChange={(e) => void pick(e.target.files)} />
        </label>
        <span className="text-base text-ink-soft">
          {songs === null ? "읽는 중…" : `${songs.length}곡 · ${mb(total)}`}
        </span>
      </div>
      {note && <p className="mt-2 rounded-2xl bg-paper px-4 py-2 text-base">{note}</p>}
      {songs && songs.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {songs.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-2">
              <button type="button" className="squish shrink-0 rounded-full px-4 py-1.5 text-base" onClick={() => void hear(s.id)}>
                {hearing === s.id ? "멈춤" : "듣기"}
              </button>
              <span className="min-w-0 flex-1 truncate">{s.title}</span>
              <span className="shrink-0 text-sm text-ink-soft">
                {s.video ? "영상 · " : ""}
                {clockOf(s.duration) ? `${clockOf(s.duration)} · ` : ""}
                {mb(s.size)}
              </span>
              <button
                type="button"
                className="squish shrink-0 rounded-full px-4 py-1.5 text-base"
                style={toneStyle("peach")}
                onClick={() => {
                  if (!window.confirm(`「${s.title}」을(를) 이 폰에서 지울까요?`)) return;
                  if (hearing === s.id) preview.current?.pause();
                  void removeSong(s.id);
                }}
              >
                지우기
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
