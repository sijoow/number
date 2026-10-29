"use client";

import { useEffect, useState } from "react";
import { cleanTitle } from "@/lib/songTitle";

/*
 * 노래 — 부모가 폰에 있는 노래·영상 파일을 골라 그 기기에만 넣어 두고 아이가 「노래」 메뉴에서 듣고 본다(2026-10-29 사용자 — 영상 파일도).
 * 파일은 이 기기 브라우저 저장소(IndexedDB)에만 있다 — 서버·MongoDB·깃허브·Cafe24 에 올리지 않는다(저작권이 있는 노래를 인터넷에 올리지 않게).
 * 그래서 기기마다 따로 넣어야 하고, 사이트 데이터를 지우면 함께 지워진다(지워지지 않게 persist 를 부탁해 둔다).
 */

const DB_NAME = "haon-number-songs";
const STORE = "songs";
/** 한 곡 크기 한도 — 폰 저장소를 너무 많이 쓰지 않게. 영상은 크니까 따로 */
export const SONG_MAX_BYTES = 40 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 500 * 1024 * 1024;

export interface SongMeta {
  id: string;
  /** 보이는 이름 — 파일 이름에서 확장자·트랙 번호·가수 이름을 뗀 것(lib/songTitle) */
  title: string;
  size: number;
  addedAt: number;
  /** 영상 파일이면 화면에 영상이 나온다 */
  video: boolean;
  /** 길이(초) — 모르면 0 */
  duration: number;
}

/** 저장 칸 — 영상·길이는 나중에 생긴 칸이라 예전에 넣은 노래에는 없다 */
interface SongRow extends Omit<SongMeta, "video" | "duration"> {
  video?: boolean;
  duration?: number;
  blob: Blob;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

/** 넣은 노래 목록(넣은 차례) — 파일 내용은 빼고. 영상·길이를 적기 전에 넣은 노래는 파일 종류로 본다 */
export async function listSongs(): Promise<SongMeta[]> {
  const rows = await withStore<SongRow[]>("readonly", (s) => s.getAll() as IDBRequest<SongRow[]>);
  return rows
    .map(({ id, title, size, addedAt, video, duration, blob }) => ({ id, title, size, addedAt, video: video ?? blob.type.startsWith("video/"), duration: duration ?? 0 }))
    .sort((a, b) => a.addedAt - b.addedAt);
}

/** 파일 길이(초) — 머리 정보만 읽는다. 못 읽으면 0 */
function mediaDuration(f: File): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(f.type.startsWith("video/") ? "video" : "audio");
    const src = URL.createObjectURL(f);
    let settled = false;
    const done = (d: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(src);
      resolve(Number.isFinite(d) && d > 0 ? d : 0);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done(0);
    window.setTimeout(() => done(0), 8000);
    el.src = src;
  });
}

/** 고른 파일들을 넣는다 — 소리·영상 파일이 아니거나 너무 큰 건 건너뛰고, 건너뛴 이름을 돌려준다 */
export async function addSongs(files: readonly File[]): Promise<{ added: number; skipped: string[] }> {
  const skipped: string[] = [];
  let added = 0;
  for (const [i, f] of files.entries()) {
    const video = f.type.startsWith("video/");
    if (!(video || f.type.startsWith("audio/")) || f.size > (video ? VIDEO_MAX_BYTES : SONG_MAX_BYTES)) {
      skipped.push(f.name);
      continue;
    }
    const row: SongRow = {
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle(f.name),
      size: f.size,
      addedAt: Date.now() + i,
      video,
      duration: await mediaDuration(f),
      blob: f,
    };
    await withStore("readwrite", (s) => s.put(row));
    added++;
  }
  // 저장소가 꽉 찰 때 브라우저가 지우지 않게 부탁(안 되면 그냥 둔다)
  void navigator.storage?.persist?.().catch(() => false);
  changed();
  return { added, skipped };
}

export async function removeSong(id: string): Promise<void> {
  await withStore("readwrite", (s) => s.delete(id));
  changed();
}

/** 한 곡의 파일 — 재생할 때만 꺼낸다 */
export async function songBlob(id: string): Promise<Blob | null> {
  const row = await withStore<SongRow | undefined>("readonly", (s) => s.get(id) as IDBRequest<SongRow | undefined>);
  return row?.blob ?? null;
}

/** 노래 목록 — 처음엔 null(읽는 중), 넣거나 지우면 다시 읽는다. 저장소를 못 쓰는 기기면 빈 목록 */
export function useSongs(): SongMeta[] | null {
  const [songs, setSongs] = useState<SongMeta[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      listSongs()
        .then((list) => alive && setSongs(list))
        .catch(() => alive && setSongs([]));
    void load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, []);
  return songs;
}
