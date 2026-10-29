"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BlockIcon, FriendArt, Guide } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { ActivityHost } from "@/components/play/ActivityHost";
import { DayPath } from "@/components/play/DayPath";
import { KIND_ICON, KIND_LABEL } from "@/components/play/kindIcon";
import { SuccessCard } from "@/components/play/StarFly";
import { StepDots } from "@/components/play/StepDots";
import type { ActivityResult } from "@/components/play/types";
import { ReadAlong } from "@/components/ReadAlong";
import { Backdrop, BlockCount, MapGlyph, Splash, SquishButton, UiIcon, usePortrait } from "@/components/ui";
import { dayPlan, practicePlan } from "@/curriculum/course";
import { LINES } from "@/curriculum/lines";
import type { ActivityKind } from "@/curriculum/types";
import { currentAuth, useIsMaster } from "@/lib/auth";
import { BLOCK_PER_ACTIVITY, blocksFor, canPlayToday, completeSession, currentSession, localDay, meetsOf, passedOf, runOf, stepRun, type SessionRef, type SessionResult } from "@/lib/progress";
import { buildSession, seededRng, type BuiltActivity } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved, useToday } from "@/lib/store";
import { say, stopVoice } from "@/lib/voice";

type Moved = "day" | "practice" | "stamp" | "chapter";

type Phase =
  | { name: "path" }
  | { name: "playing"; ref: SessionRef; built: BuiltActivity[]; idx: number; score: SessionResult; startedAt: number }
  | { name: "reward"; ref: SessionRef; earned: number; passed: boolean | null; moved: Moved | null; friends: number[] };

/*
 * 오늘의 놀이 — 시작하기를 누르면 「오늘의 길」(components/play/DayPath): 그날 놀이가 길 위 칸이고, 반짝이는 칸을 눌러 하나씩 깬다
 * (2026-10-29 사용자: 업체처럼 하루 미션을 칸으로 — 깬 칸 ✓, 다시 열리지 않음). 한 칸을 깨면 「성공!」 창 → 길로 돌아와 다음 칸.
 * 몇 칸까지 깼는지는 진도에 둔다(lib/progress run) — 중간에 나가도 다시 오면 그 칸부터. 마지막 칸을 깨면 하루 끝(블록·새 친구·도장).
 * 놀이 중 ✕ 는 길로(그 놀이만 처음부터).
 */

/**
 * ?preview=c1d3 (연습 놀이는 c1p) — 부모 페이지 '미리 보기'. 진도에 남기지 않는다.
 *   &step=2  그 칸까지 깬 길로    &auto=1  길 없이 그 놀이로 바로(화면 점검용, 판 순서 고정)
 */
function readPreview(): { ref: SessionRef; step: number; auto: boolean } | null {
  const q = new URLSearchParams(window.location.search);
  const m = /^c(\d+)(?:d(\d+)|(p))$/.exec(q.get("preview") ?? "");
  if (!m) return null;
  const plan = m[3] ? practicePlan(Number(m[1])) : dayPlan(Number(m[1]), Number(m[2]));
  if (!plan) return null;
  const step = Math.max(0, Math.min(plan.activities.length - 1, Number(q.get("step")) || 0));
  return { ref: { key: "preview", practice: Boolean(m[3]), plan }, step, auto: q.get("auto") === "1" };
}

/** 놀이 이름 카드를 보여 주는 시간 — 그다음 놀이가 시작해서 말한다 */
const TITLE_MS = 1500;

/** 놀이마다 처음 잠깐 — 큰 그림과 이름(2026-10-29 사용자: 업체 놀이처럼 시작 전에 무슨 놀이인지) */
function TitleCard({ kind }: { kind: ActivityKind }) {
  return (
    <div className="grid min-h-full place-items-center p-6">
      <div className="glass flex animate-pop-in flex-col items-center gap-3 rounded-[2.4rem] px-14 py-8 short:gap-1 short:py-5">
        <span className="text-[min(20vh,7.5rem)] leading-none">
          <Icon id={`play:${kind}`} emoji={KIND_ICON[kind]} />
        </span>
        <p className="title-pop text-5xl portrait:text-4xl short:text-4xl">{KIND_LABEL[kind]}</p>
      </div>
    </div>
  );
}

function dayLabel(ref: SessionRef): string {
  const { chapter, day } = ref.plan;
  if (ref.practice) return `${chapter}장 · 연습 놀이`;
  return `${chapter}장 · ${day}일째`;
}

export default function SessionScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const today = useToday();
  const router = useRouter();
  const [preview] = useState(readPreview);
  const [phase, setPhase] = useState<Phase>(() =>
    preview?.auto
      ? { name: "playing", ref: preview.ref, built: buildSession(preview.ref.plan, seededRng(1)), idx: preview.step, score: { correct: 0, total: 0, activities: 0, bonus: 0 }, startedAt: 0 }
      : { name: "path" },
  );
  const portrait = usePortrait();
  /** 미리 보기의 길 — 진도에 남기지 않고 이 화면에서만 */
  const [previewRun, setPreviewRun] = useState(() => ({ done: preview?.step ?? 0, score: { correct: 0, total: 0, activities: 0, bonus: 0 } as SessionResult, startedAt: 0 }));
  const [askExit, setAskExit] = useState(false);
  /** 놀이 하나를 마친 「성공!」 창 — 별 수, 「완료」를 누르면 다음 놀이로 */
  const [cheer, setCheer] = useState<{ stars: number; go: () => void } | null>(null);
  /** 이름 카드를 다 보여 준 놀이 번호 — 그 놀이부터 판을 연다 */
  const [titled, setTitled] = useState(-1);
  const playingIdx = phase.name === "playing" ? phase.idx : -1;

  useEffect(() => {
    if (playingIdx < 0) return;
    const t = window.setTimeout(() => setTitled(playingIdx), TITLE_MS);
    return () => window.clearTimeout(t);
  }, [playingIdx]);

  useEffect(() => {
    const s = readSaved();
    const allowed = currentAuth()?.user.role === "master" || canPlayToday(s.progress, s.settings, localDay(new Date()));
    if (!preview?.auto) void say(allowed || preview ? LINES.path : LINES.doneToday);
    return () => stopVoice();
  }, [preview]);

  if (!saved) return <Splash />;

  const live = preview?.ref ?? currentSession(saved.progress);
  const allowed = preview || master ? true : canPlayToday(saved.progress, saved.settings, today);
  // 오늘의 길 — 몇 칸 깼나(미리 보기는 이 화면에서만)
  const run = preview ? previewRun : runOf(saved.progress, live);

  /** 길의 칸을 눌렀다 — 지금 칸만 열린다(깬 칸·앞 칸은 반짝이는 칸을 알려 준다) */
  const pick = (i: number) => {
    if (!live) return;
    sfx.wake();
    if (!allowed) {
      sfx.boop();
      void say(LINES.doneToday);
      return;
    }
    if (i !== run.done) {
      sfx.boop();
      void say(LINES.path);
      return;
    }
    sfx.pop();
    setTitled(-1);
    setPhase({
      name: "playing",
      ref: live,
      built: buildSession(live.plan, seededRng(Date.now())),
      idx: i,
      score: run.score,
      startedAt: run.startedAt || Date.now(),
    });
  };

  const finish = (ref: SessionRef, played: SessionResult, startedAt: number) => {
    // 걸린 시간 — 켜 두고 자리를 비운 날도 있으니 45분에서 자른다
    const score = { ...played, ms: startedAt ? Math.min(Date.now() - startedAt, 45 * 60_000) : 0 };
    const before = readSaved().progress.friends;
    let earned: number;
    let passed: boolean | null;
    let moved: Moved | null = null;
    if (preview) {
      earned = blocksFor(ref.plan, score);
      passed = passedOf(ref.plan, score);
    } else {
      const res = completeSession(readSaved().progress, ref, score, today || localDay(new Date()));
      updateSaved((s) => ({ ...s, progress: res.next }));
      earned = res.record.blocks;
      passed = res.record.passed;
      moved = res.moved;
    }
    const friends = ref.practice ? [] : meetsOf(ref.plan).filter((n) => preview || !before.includes(n));
    setPhase({ name: "reward", ref, earned, passed, moved, friends });
    sfx.cheer();
    const stampLine = passed === true ? [LINES.stampPass] : moved === "practice" && ref.plan.stamp ? [LINES.stampPractice] : moved === "chapter" ? [LINES.stampMoveOn] : [];
    void say([LINES.sessionEnd, ...(friends.length ? [LINES.friendNew] : []), LINES.blocks, ...stampLine]);
  };

  const onActivityDone = (r: ActivityResult) => {
    if (phase.name !== "playing") return;
    const score = { correct: phase.score.correct + r.correct, total: phase.score.total + r.total, activities: phase.score.activities + 1, bonus: (phase.score.bonus ?? 0) + (r.bonus ?? 0) };
    const go = () => {
      setCheer(null);
      if (phase.idx + 1 >= phase.built.length) {
        finish(phase.ref, score, phase.startedAt);
        return;
      }
      // 한 칸 깼다 — 길로 돌아가 다음 칸(진도에 남겨 두어 나갔다 와도 그 칸부터)
      if (preview) setPreviewRun({ done: phase.idx + 1, score, startedAt: phase.startedAt });
      else updateSaved((s) => ({ ...s, progress: stepRun(s.progress, phase.ref, r, Date.now()) }));
      setPhase({ name: "path" });
      void say(LINES.pathNext);
    };
    // 별 — 점수 놀이는 처음에 맞힌 수(하나는 꼭), 쓰기·만나기는 셋
    setCheer({ stars: r.total > 0 ? Math.max(1, r.correct) : 3, go });
  };

  const goHome = () => {
    stopVoice();
    router.push("/");
  };

  if (phase.name === "playing") {
    return (
      <main className="relative flex h-dvh flex-col overflow-hidden">
        <Backdrop />
        <header className="relative z-10 flex items-center justify-between gap-4 px-5 pt-4 portrait:gap-2 portrait:px-3 portrait:pt-[calc(0.75rem_+_var(--cam))]">
          <button
            type="button"
            className="glass grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl font-extrabold text-ink-soft transition-transform active:scale-90 portrait:h-12 portrait:w-12 portrait:text-xl"
            onClick={() => setAskExit(true)}
            aria-label="그만하기"
          >
            <UiIcon name="close" />
          </button>
          {/* 어디쯤 — "3장 · 2일째 · 1번째 칸 › 수 세기 기초" */}
          <div className="glass flex min-w-0 items-center gap-2 rounded-full px-4 py-1.5 text-xl font-extrabold portrait:gap-1.5 portrait:px-3 portrait:text-base">
            <span className="text-3xl leading-none portrait:text-2xl">
              <Icon id={`play:${phase.built[phase.idx].kind}`} emoji={KIND_ICON[phase.built[phase.idx].kind]} />
            </span>
            <span className="truncate">
              <span className="text-ink-soft portrait:hidden">
                {dayLabel(phase.ref)} · {phase.idx + 1}번째 칸 ›
              </span>{" "}
              {KIND_LABEL[phase.built[phase.idx].kind]}
            </span>
          </div>
          <BlockCount n={phase.score.activities * BLOCK_PER_ACTIVITY} />
        </header>
        <StepDots />

        <section className="relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {titled === phase.idx ? (
            <ActivityHost key={phase.idx} built={phase.built[phase.idx]} assess={phase.ref.plan.stamp} onDone={onActivityDone} />
          ) : (
            <TitleCard key={phase.idx} kind={phase.built[phase.idx].kind} />
          )}
        </section>

        {cheer && <SuccessCard key={phase.idx} stars={cheer.stars} onNext={cheer.go} />}

        {askExit && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-sm">
            <div className="flex w-full max-w-md animate-pop-in flex-col items-center gap-5 rounded-[2.4rem] bg-white px-10 pb-8 pt-6 shadow-[0_30px_60px_-20px_rgb(62_58_82/0.5)] portrait:mx-4 portrait:px-6">
              <Guide size={130} mood="wow" />
              <p className="text-4xl font-extrabold">그만할까?</p>
              <div className="flex w-full flex-col gap-3">
                <button type="button" className="cta w-full rounded-full py-4 text-3xl font-extrabold" onClick={() => setAskExit(false)}>
                  계속할래
                </button>
                <SquishButton
                  tone="card"
                  className="w-full rounded-full py-3.5 text-2xl"
                  onClick={() => {
                    stopVoice();
                    setAskExit(false);
                    setCheer(null);
                    setPhase({ name: "path" });
                  }}
                >
                  길로 갈래
                </SquishButton>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  if (phase.name === "reward") {
    const pieces = Math.min(phase.earned, 12);
    return (
      <main className="relative grid h-dvh place-items-center overflow-y-auto">
        <Backdrop />
        {/* 높이가 낮은 화면(폰 가로)은 두 칸 — 왼쪽 축하, 오른쪽 새 친구·집으로. 한 줄로 쌓으면 「집으로」가 화면 밖으로 밀린다(2026-10-27) */}
        <div className="relative flex flex-col items-center gap-5 py-6 low:flex-row low:gap-10 low:py-3">
          <div className="flex flex-col items-center gap-5 low:gap-3 short:gap-2">
            <div className="relative">
              <Guide size={200} mood="cheer" className="animate-float" />
              {Array.from({ length: pieces }, (_, i) => {
                const a = Math.PI * (0.08 + (0.84 * i) / Math.max(1, pieces - 1));
                return (
                  <span key={i} className="absolute animate-fly-up" style={{ left: `${50 - 70 * Math.cos(a)}%`, top: `${45 - 55 * Math.sin(a)}%`, animationDelay: `${0.3 + i * 0.12}s` }}>
                    <BlockIcon size={40} />
                  </span>
                );
              })}
            </div>
            <p className="title-pop text-6xl portrait:text-5xl short:text-5xl">오늘의 놀이 끝!</p>
            <div className="glass flex items-center gap-3 rounded-full px-8 py-3 text-5xl font-extrabold short:py-2 short:text-4xl">
              <BlockIcon size={56} /> +{phase.earned}
            </div>
          </div>
          <div className="flex flex-col items-center gap-5 low:max-w-[46vw] low:gap-3">
            {phase.friends.length > 0 && (
              <div className="glass flex flex-col items-center gap-2 rounded-[2rem] px-6 py-3">
                <p className="text-2xl font-extrabold">새 숫자 친구!</p>
                <div className="flex items-end gap-4">
                  {phase.friends.map((n) => (
                    <FriendArt key={n} n={n} height="min(18vh, 9rem)" className="animate-pop-in" />
                  ))}
                </div>
              </div>
            )}
            {phase.passed === true && (
              <p className="rounded-full bg-mint px-7 py-2 text-3xl">
                {phase.ref.plan.chapter}장 도장 쾅! <Icon emoji="⭐" />
              </p>
            )}
            {phase.passed === false && (
              <p className="rounded-full bg-lilac px-7 py-2 text-2xl short:rounded-[1.6rem] short:text-center short:text-xl">{phase.moved === "chapter" ? "다음 장으로 가요 — 부모 페이지에 '다시 볼 장'으로 남아요" : "다음에는 연습 놀이를 하고 다시 도전해요"}</p>
            )}
            {preview && <p className="font-body text-xl text-ink-soft">미리 보기라 진도에는 남지 않았어요</p>}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 short:mt-0">
              {/* 하루 제한이 없으면 이어서 다음 날의 길로(업체처럼 다음 섬으로) */}
              {!preview && currentSession(saved.progress) && (master || canPlayToday(saved.progress, saved.settings, today)) && (
                <button
                  type="button"
                  className="cta rounded-full px-10 py-5 text-4xl font-extrabold short:py-4"
                  onClick={() => {
                    sfx.wake();
                    setPhase({ name: "path" });
                    void say(LINES.path);
                  }}
                >
                  다음 길로
                </button>
              )}
              <SquishButton tone="card" className="rounded-full px-12 py-4 text-3xl" onClick={goHome}>
                집으로
              </SquishButton>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 오늘의 길
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <Backdrop />
      <header className="relative z-20 flex items-center justify-between gap-3 px-5 pt-4 portrait:gap-2 portrait:px-3 portrait:pt-[calc(0.75rem_+_var(--cam))]">
        <button
          type="button"
          className="glass grid h-14 w-14 shrink-0 place-items-center rounded-full text-3xl transition-transform active:scale-90 portrait:h-12 portrait:w-12"
          onClick={goHome}
          aria-label="집으로"
        >
          <UiIcon name="home" />
        </button>
        {live && (
          <div className="glass flex min-w-0 flex-col items-center rounded-[1.6rem] px-5 py-1.5 text-center portrait:px-3">
            <span className="text-sm font-extrabold text-brand-deep">
              {dayLabel(live)}
              {live.plan.stamp ? " · 도장 놀이 날" : live.practice ? " · 연습하고 다시 도전!" : ""}
            </span>
            <span className="max-w-full truncate text-2xl font-extrabold leading-tight portrait:text-xl">{live.plan.title}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            stopVoice();
            router.push("/map");
          }}
          className="glass flex h-12 shrink-0 items-center gap-1.5 rounded-full px-4 text-base font-extrabold active:scale-95 portrait:px-3"
          aria-label="모험 지도"
        >
          <MapGlyph />
          <span className="portrait:hidden">모험 지도</span>
        </button>
      </header>
      {preview && <p className="relative z-10 mt-2 self-center rounded-full bg-white/80 px-4 py-1 font-body text-base">미리 보기 · 진도에 남지 않아요</p>}
      {live ? (
        <>
          <div className="relative z-10 mt-2 flex justify-center px-4">
            <p className="glass rounded-full px-6 py-2 text-center text-2xl font-extrabold short:py-1 short:text-lg portrait:text-xl">
              <ReadAlong text={allowed ? (run.done > 0 ? LINES.pathNext : LINES.path) : LINES.doneToday} />
            </p>
          </div>
          <section className="relative z-0 mx-auto min-h-0 w-full max-w-[68rem] flex-1 px-[5vw] pb-[7vh] pt-[11vh] portrait:px-6 portrait:pb-[8vh] portrait:pt-[9vh] short:pt-[13vh]">
            <DayPath kinds={live.plan.activities.map((a) => a.kind)} done={run.done} stamp={live.plan.stamp} portrait={portrait} locked={!allowed} onPick={pick} />
          </section>
          {!allowed && (
            <button type="button" onClick={() => router.push("/free")} className="cta relative z-10 mb-5 self-center rounded-full px-8 py-3 text-2xl font-extrabold">
              내일 또 만나요 · 놀이터 가기
            </button>
          )}
        </>
      ) : (
        <div className="grid flex-1 place-items-center">
          <p className="glass rounded-full px-8 py-3 text-3xl font-bold">
            모든 놀이를 다 했어요! <Icon emoji="🎉" />
          </p>
        </div>
      )}
    </main>
  );
}
