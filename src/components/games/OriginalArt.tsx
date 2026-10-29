"use client";

import Image from "next/image";
import { CubeStack, FriendArt, FriendTight, ThingArt } from "@/components/Art";
import { blockColor } from "@/curriculum/friends";
import type { OriginalId } from "@/curriculum/originals";
import { imageOf } from "@/lib/assets";
import { Bush, ColorCube, Die, Drum, Egg, Fulcrum, Plate, TrainEngine } from "./pieces";

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
    // 선물 놀이 — 그 놀이 판을 작게
    case "eggs":
      return (
        <span className="flex items-end gap-1">
          {[1, 2, 0].map((n, i) => (
            <span key={i} className="relative grid place-items-center">
              <Egg size={`calc(${h} * 0.42)`} fill={["#fff3c4", "#dff5e6", "#e2f0ff"][i]} />
              <span className={`absolute top-[34%] font-letter font-extrabold leading-none ${n ? "text-ink" : "text-brand"}`} style={{ fontSize: `calc(${h} * 0.22)` }}>
                {n || "?"}
              </span>
            </span>
          ))}
          <FriendArt n={3} height={`calc(${h} * 0.7)`} />
        </span>
      );
    case "parts":
      return (
        <span className="flex items-end gap-1 font-black text-ink-soft" style={{ fontSize: `calc(${h} * 0.3)` }}>
          <FriendTight n={2} height={`calc(${h} * 0.62)`} />
          <span className="mb-[0.6em] leading-none">+</span>
          <FriendTight n={3} height={`calc(${h} * 0.72)`} />
          <span className="mb-[0.6em] leading-none">=</span>
          <FriendTight n={5} height={`calc(${h} * 0.9)`} />
        </span>
      );
    case "more-less":
      return (
        <span className="flex items-center gap-2">
          <span className="grid gap-1">
            <ColorCube size={`calc(${h} * 0.26)`} fill="#5cc489" />
            <ColorCube size={`calc(${h} * 0.26)`} fill="#ef6a6a" />
          </span>
          <FriendArt n={4} height={h} />
        </span>
      );
    case "hide-line":
      return (
        <span className="flex flex-col items-center">
          <span className="relative flex items-end">
            <Bush size={`calc(${h} * 0.4)`} />
            <span className="relative -mx-1">
              <FriendTight n={3} height={`calc(${h} * 0.6)`} className="absolute bottom-[40%] left-1/2 -translate-x-1/2" />
              <Bush size={`calc(${h} * 0.4)`} className="relative" />
            </span>
            <Bush size={`calc(${h} * 0.4)`} />
          </span>
          <span className="block h-1.5 rounded-full bg-ink/70" style={{ width: `calc(${h} * 1.3)` }} />
        </span>
      );
    case "meal":
      return (
        <span className="flex items-end gap-1">
          <FriendArt n={2} height={`calc(${h} * 0.8)`} />
          <span className="relative grid place-items-center">
            <Plate size={`calc(${h} * 0.62)`} />
            <span className="absolute flex gap-0.5">
              <ThingArt id="strawberry" size={`calc(${h} * 0.2)`} />
              <ThingArt id="strawberry" size={`calc(${h} * 0.2)`} />
            </span>
          </span>
        </span>
      );
    case "num-train":
      return (
        <span className="flex items-end">
          <TrainEngine w={`calc(${h} * 0.34)`} />
          {[1, 2, 3].map((n) => (
            <span key={n} className="ml-0.5 flex flex-col items-center">
              <FriendTight n={n} height={`calc(${h} * 0.42)`} />
              <span className="block rounded" style={{ width: `calc(${h} * 0.34)`, height: `calc(${h} * 0.14)`, background: blockColor(n, 0).fill }} />
            </span>
          ))}
        </span>
      );
    case "rocket":
      return (
        <svg viewBox="0 0 60 100" style={{ height: h }} aria-hidden>
          <path d="M30 4 C 42 14, 46 30, 46 44 L14 44 C 14 30, 18 14, 30 4 Z" fill="#ef6a6a" />
          <rect x="14" y="44" width="32" height="36" rx="4" fill="#ffffff" stroke="rgb(62 58 82 / 0.15)" strokeWidth="2" />
          <rect x="20" y="50" width="20" height="8" rx="2" fill="#5cc489" />
          <rect x="20" y="61" width="20" height="8" rx="2" fill="#5cc489" />
          <path d="M14 62 L4 82 L14 80 Z M46 62 L56 82 L46 80 Z" fill="#4fa8e6" />
          <path d="M30 98 C 22 90, 20 84, 22 80 L38 80 C 40 84, 38 90, 30 98 Z" fill="#f5a742" />
        </svg>
      );
    case "ten-frame":
      return (
        <span className="flex items-end gap-2">
          <span className="grid grid-cols-5 gap-0.5 rounded-md bg-[#f0ad5b] p-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="grid place-items-center rounded-sm bg-[#fff3dc]" style={{ width: `calc(${h} * 0.17)`, height: `calc(${h} * 0.17)` }}>
                {i < 8 && <ColorCube size={`calc(${h} * 0.13)`} fill="#ef6a6a" />}
              </span>
            ))}
          </span>
          <FriendArt n={10} height={h} />
        </span>
      );
    case "num-board":
      return (
        <span className="grid grid-cols-5 gap-0.5 rounded-md bg-sky-deep/70 p-1 font-letter font-extrabold leading-none" style={{ fontSize: `calc(${h} * 0.17)` }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`grid place-items-center rounded-sm ${i === 6 ? "bg-white/40 text-white" : "bg-white text-ink"}`} style={{ width: `calc(${h} * 0.26)`, height: `calc(${h} * 0.26)` }}>
              {i === 6 ? "?" : i + 1}
            </span>
          ))}
        </span>
      );
  }
}
