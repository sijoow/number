"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BlockIcon, Guide } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { StepDots } from "@/components/play/StepDots";
import { Backdrop, BlockCount, UiIcon, type Scene } from "@/components/ui";
import { usePlayClock } from "@/lib/play";
import { wallet } from "@/lib/progress";
import { useSaved } from "@/lib/store";
import { stopVoice } from "@/lib/voice";

/**
 * 메뉴 화면 틀 — 왼쪽 위 돌아가기, 가운데 제목, 오른쪽 위 블록 수. 보고 있는 시간은 리포트에 남는다.
 * onBack 이 있으면 그걸(놀이 → 목록), 없으면 첫 화면으로.
 */
export function ModeShell({
  title,
  icon,
  iconId,
  scene,
  onBack,
  children,
}: {
  title: string;
  icon: string;
  /** 힉스필드 아이콘 이름(image-manifest "icon:<iconId>") — 그림이 있으면 이모지 대신 */
  iconId?: string;
  scene?: Scene;
  onBack?: () => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const saved = useSaved();
  usePlayClock();
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <Backdrop scene={scene} />
      <header className="relative z-10 flex items-center justify-between gap-4 px-5 pt-4 portrait:gap-2 portrait:px-3 portrait:pt-[calc(0.75rem_+_var(--cam))]">
        <button
          type="button"
          className="glass grid h-14 w-14 shrink-0 place-items-center rounded-full text-3xl text-ink transition-transform active:scale-90 portrait:h-12 portrait:w-12 portrait:text-2xl"
          aria-label={onBack ? "뒤로" : "집으로"}
          onClick={() => {
            stopVoice();
            if (onBack) onBack();
            else router.push("/");
          }}
        >
          <UiIcon name={onBack ? "prev" : "home"} />
        </button>
        <div className="glass flex min-w-0 items-center gap-2 rounded-full px-6 py-2 text-3xl portrait:gap-1 portrait:px-4 portrait:text-2xl">
          <Icon id={iconId} emoji={icon} />
          <span className="title-pop truncate">{title}</span>
        </div>
        <BlockCount n={saved ? wallet(saved.progress) : 0} />
      </header>
      {/* 놀이 중이면 문제 진행(●→★) — 놀이가 알려 줄 때만 보인다 */}
      <StepDots />
      {/* 내용이 화면보다 크면 잘리지 않고 스크롤 — 낮은 화면(폰 가로·주소창)에서 아래가 끊기지 않게 */}
      <section className="relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</section>
    </main>
  );
}

/** 메뉴 안 놀이를 끝냈을 때 잠깐 보여 주는 칭찬 — 버튼 하나(또 하기), 필요하면 둘째 버튼(다른 놀이) */
export function DoneBurst({
  earned,
  text,
  onNext,
  nextLabel = "좋아!",
  onSecond,
  secondLabel,
}: {
  earned: number;
  text: string;
  onNext: () => void;
  nextLabel?: string;
  onSecond?: () => void;
  secondLabel?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/25 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md animate-pop-in flex-col items-center gap-4 rounded-[2.4rem] bg-white px-10 pb-8 pt-6 shadow-[0_30px_60px_-20px_rgb(62_58_82/0.5)] portrait:px-6">
        <Guide size={150} mood="cheer" />
        <p className="text-center text-4xl font-extrabold break-keep">{text}</p>
        {earned > 0 && (
          <p className="glass flex items-center gap-2 rounded-full px-5 py-1.5 text-2xl font-extrabold">
            <BlockIcon size={34} /> +{earned}
          </p>
        )}
        <button type="button" className="cta mt-1 w-full rounded-full py-4 text-3xl font-extrabold" onClick={onNext}>
          {nextLabel}
        </button>
        {onSecond && secondLabel && (
          <button type="button" className="squish w-full rounded-full py-3.5 font-display text-2xl" onClick={onSecond}>
            {secondLabel}
          </button>
        )}
      </div>
    </div>
  );
}
