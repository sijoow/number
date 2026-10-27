/**
 * 한글나라에서 받아온 아이 정보·설정(lib/hangul) — 기기에 아이디마다 받아 두고(localStorage), 앱을 켤 때·다시 열 때 새로 받는다.
 * 인터넷이 끊기거나 DB 가 꺼져 있으면 마지막에 받은 값(처음이면 기본값: 세로·매일·수아)으로 돈다.
 * 화면 방향(lib/orientation)·성우(lib/voice)·공부하는 요일(부모 페이지 스케줄)이 이 값을 쓴다.
 */

import { useSyncExternalStore } from "react";
import { authHeaders, currentAuth, subscribeAuth } from "@/lib/auth";
import { DEFAULT_FAMILY, normalizeFamily, type Family } from "@/lib/hangul";

const KEY_PREFIX = "haon-number:family";
const listeners = new Set<() => void>();
const memory = new Map<string, string>();
let lastKey: string | undefined;
let lastRaw: string | null | undefined;
let lastValue: Family = DEFAULT_FAMILY;
let started = false;

function keyNow(): string {
  return `${KEY_PREFIX}:${currentAuth()?.user.id ?? "guest"}`;
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function getSnapshot(): Family {
  const key = keyNow();
  const raw = readRaw(key);
  if (key !== lastKey || raw !== lastRaw) {
    lastKey = key;
    lastRaw = raw;
    try {
      lastValue = raw ? normalizeFamily(JSON.parse(raw)) : DEFAULT_FAMILY;
    } catch {
      lastValue = DEFAULT_FAMILY;
    }
  }
  return lastValue;
}

function write(f: Family): void {
  const key = keyNow();
  const raw = JSON.stringify(f);
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // 저장이 막힌 기기 — 이번 실행 동안만 기억
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const offAuth = subscribeAuth(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(KEY_PREFIX)) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    offAuth();
    window.removeEventListener("storage", onStorage);
  };
}

/** 지금 값 — 화면 밖(목소리 고르기 등)에서 */
export function readFamily(): Family {
  return typeof window === "undefined" ? DEFAULT_FAMILY : getSnapshot();
}

export function useFamily(): Family {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_FAMILY);
}

export type FamilyState = "ok" | "off" | "locked" | "error";

/** 한글나라 값 새로 받기 — 실패하면 가지고 있던 값 그대로 */
export async function pullFamily(): Promise<FamilyState> {
  if (!currentAuth()) return "locked";
  try {
    const res = await fetch("/api/family", { cache: "no-store", headers: authHeaders() });
    if (res.status === 503) return "off";
    if (res.status === 401) return "locked";
    if (!res.ok) return "error";
    const { family } = (await res.json()) as { family?: unknown };
    write(normalizeFamily(family));
    return "ok";
  } catch {
    return "error";
  }
}

/** 관리자 화면 — 아이 한 명의 한글나라 값 (기기에 두지 않는다) */
export async function fetchFamilyOf(profile: string): Promise<Family | null> {
  try {
    const res = await fetch(`/api/family?profile=${encodeURIComponent(profile)}`, { cache: "no-store", headers: authHeaders() });
    if (!res.ok) return null;
    const { family } = (await res.json()) as { family?: unknown };
    return normalizeFamily(family);
  } catch {
    return null;
  }
}

/** 로그인한 뒤 한 번 (components/SyncBoot) — 켤 때·다시 열 때·인터넷이 돌아올 때·다른 아이디로 들어올 때 */
export function startFamily(): void {
  if (started) return;
  started = true;
  void pullFamily();
  subscribeAuth(() => void pullFamily());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void pullFamily();
  });
  window.addEventListener("online", () => void pullFamily());
}
