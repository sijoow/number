"use client";

import Image from "next/image";
import { CubeStack, FriendArt, ThingArt } from "@/components/Art";
import type { OriginalId } from "@/curriculum/originals";
import { imageOf } from "@/lib/assets";
import { Die, Drum, Fulcrum } from "./pieces";

/** 카드 그림 — 이모지 대신 있는 그림(친구·블록·그림자·쿠키)과 단순한 물건(주사위·북·시소)을 짜 맞춘다 */
export function OriginalArt({ id, h = "min(13vh, calc(10*var(--vw)))" }: { id: OriginalId; h?: string }) {
  switch (id) {
    case "yut":
      // 작은 윷판 위에 친구 둘 + 주사위
      return (
        <span className="relative grid place-items-center" style={{ width: `calc(${h} * 1.5)`, height: h }}>
          <svg viewBox="0 0 100 100" className="absolute h-full" aria-hidden>
            <rect x="10" y="10" width="80" height="80" rx="4" fill="#fff4dd" stroke="#d6b47f" strokeWidth="4" />
            <line x1="90" y1="10" x2="10" y2="90" stroke="#d6b47f" strokeWidth="4" />
            <line x1="10" y1="10" x2="90" y2="90" stroke="#d6b47f" strokeWidth="4" />
          </svg>
          <span className="relative flex items-end gap-1">
            <FriendArt n={2} height={`calc(${h} * 0.62)`} />
            <Die face={5} size={`calc(${h} * 0.42)`} />
            <FriendArt n={4} height={`calc(${h} * 0.62)`} />
          </span>
        </span>
      );
    case "maker":
      return (
        <span className="flex items-end gap-2">
          <CubeStack n={3} size={`calc(${h} * 0.24)`} tone="card" />
          <FriendArt n={3} height={h} />
        </span>
      );
    case "shadow": {
      const src = imageOf("shadow:4");
      return (
        <span className="relative inline-block" style={{ width: h, height: h }}>
          {src && <Image src={src} alt="" fill sizes="160px" draggable={false} className="pointer-events-none object-contain" />}
          <span className="absolute -right-2 -top-1 grid h-8 w-8 place-items-center rounded-full bg-white font-letter text-xl font-extrabold text-brand shadow">?</span>
        </span>
      );
    }
    case "seesaw":
      return (
        <span className="flex flex-col items-center">
          <span className="flex -rotate-[8deg] items-end gap-6">
            <FriendArt n={2} height={`calc(${h} * 0.6)`} />
            <FriendArt n={5} height={`calc(${h} * 0.6)`} />
          </span>
          <span className="block h-2 -rotate-[8deg] rounded-full bg-[#c98a4b]" style={{ width: `calc(${h} * 1.9)` }} />
          <Fulcrum size={`calc(${h} * 0.32)`} />
        </span>
      );
    case "share":
      return (
        <span className="flex items-end gap-2">
          <FriendArt n={2} height={`calc(${h} * 0.85)`} />
          <span className="flex gap-1">
            <ThingArt id="cookie" size={`calc(${h} * 0.34)`} />
            <ThingArt id="cookie" size={`calc(${h} * 0.34)`} />
          </span>
        </span>
      );
    case "drum":
      return (
        <span className="flex items-end gap-1">
          <FriendArt n={1} height={`calc(${h} * 0.8)`} />
          <Drum size={`calc(${h} * 0.75)`} />
        </span>
      );
  }
}
