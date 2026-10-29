"use client";

import { FriendTight, ShapeArt } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { thinkOf, type ThinkId } from "@/curriculum/thinks";
import { imageOf } from "@/lib/assets";

/**
 * 생각 놀이 카드 그림 — 힉스필드 아이콘("icon:think:<id>")이 있으면 그것, 없으면 선물 놀이(순서 기억하기·빈칸 채우기)는 놀이 판을 작게 짜 맞추고, 나머지는 이모지.
 */
export function ThinkArt({ id, h = "min(13vh, calc(10*var(--vw)))" }: { id: ThinkId; h?: string }) {
  if (!imageOf(`icon:think:${id}`)) {
    if (id === "sequence") {
      return (
        <span className="flex flex-col items-center gap-2">
          <span className="flex items-end gap-1.5">
            {[2, 5, 3].map((n, i) => (
              <span
                key={n}
                className={`grid place-items-center rounded-xl ${i === 1 ? "scale-110 bg-butter ring-4 ring-butter-deep/60" : "bg-white"}`}
                style={{ width: `calc(${h} * 0.62)`, height: `calc(${h} * 0.62)` }}
              >
                <FriendTight n={n} height={`calc(${h} * 0.5)`} />
              </span>
            ))}
          </span>
          <span className="flex gap-1.5">
            {[true, true, false].map((on, i) => (
              <span key={i} className={`block h-2.5 w-2.5 rounded-full ${on ? "bg-mint-deep" : "bg-white"}`} />
            ))}
          </span>
        </span>
      );
    }
    if (id === "matrix") {
      const cell = `calc(${h} * 0.46)`;
      return (
        <span className="grid grid-cols-2 gap-1 rounded-xl bg-white/80 p-1.5">
          <ShapeArt shape="triangle" color="#4fa8e6" size={cell} />
          <ShapeArt shape="triangle" color="#5cc489" size={cell} />
          <ShapeArt shape="square" color="#4fa8e6" size={cell} />
          <span className="grid place-items-center rounded-lg border-2 border-dashed border-brand/60 font-letter font-extrabold text-brand" style={{ width: cell, height: cell, fontSize: `calc(${cell} * 0.6)` }}>
            ?
          </span>
        </span>
      );
    }
  }
  return (
    <span className="text-[min(22vh,calc(15*var(--vw)))] leading-none">
      <Icon id={`think:${id}`} emoji={thinkOf(id)?.icon ?? "💡"} />
    </span>
  );
}
