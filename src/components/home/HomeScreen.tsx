"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BlockIcon, FriendArt, Guide } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { ReadAlong } from "@/components/ReadAlong";
import { Backdrop, BlockCount, PlayIcon, SpeechBubble, Splash, toneStyle, usePortrait } from "@/components/ui";
import { CHILD } from "@/curriculum/child";
import { chapterOf, DAYS_PER_CHAPTER, isStampDay } from "@/curriculum/course";
import { gameOpens, GAMES } from "@/curriculum/games";
import { LINES, meetHello, meetIntro } from "@/curriculum/lines";
import { MENUS, type MenuId } from "@/curriculum/menus";
import { imageOf } from "@/lib/assets";
import { useIsMaster } from "@/lib/auth";
import { missionState, todayFriend } from "@/lib/missions";
import { isOpen } from "@/lib/play";
import { canPlayToday, currentSession, trainOf, wallet, type Progress } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { useSaved, useToday } from "@/lib/store";
import { say } from "@/lib/voice";
import { TodayBoard, TrainEngine } from "./TodayBoard";

/*
 * 첫 화면 — 한글나라 새 화면과 같은 틀(사용자가 "지금 아주 좋아"라고 한 구성).
 *   위    하온이 이름표 · 블록 · 부모 문(꾹)
 *   가운데 안내 친구(누르면 이름을 불러 준다) + 「오늘의 놀이」 카드 하나 — 장 제목, 이번 장 하루하루 점, 시작 버튼
 *   아래  유리 메뉴 바 — 놀이터 · 숫자 놀이 · 숫자 친구 · 숫자 쓰기 · 블록 탑(curriculum/menus)
 * 하루하루 재미 장치(2026-10-28 사용자): 오늘의 미션 판(출석 기차 + 미션 셋, 하루 첫 방문·도장 받을 때 저절로) · 블록 → 블록 탑 ·
 * 이번 장 하루하루는 계단(하온이가 하루에 한 칸씩 올라 5일째 꼭대기 도장) · 안내 친구 자리에 날마다 다른 「오늘의 친구」.
 * 가로 화면은 친구(왼쪽) · 카드(오른쪽), 세로 화면은 위아래.
 */

/** 부모 페이지 문 — 아이가 실수로 열지 않게 1.5초 꾹 눌러야 열린다 */
function ParentGate() {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const end = () => {
    setHolding(false);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <button
      type="button"
      aria-label="부모 페이지 (꾹 누르기)"
      onPointerDown={() => {
        setHolding(true);
        timer.current = window.setTimeout(() => router.push("/parent"), 1500);
      }}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      className="glass relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-soft"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" strokeLinecap="round" />
      </svg>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="139"
          strokeDashoffset={holding ? 0 : 139}
          style={{ transition: holding ? "stroke-dashoffset 1.5s linear" : "none" }}
        />
      </svg>
    </button>
  );
}

/** 하온이 이름표 — 얼굴 동그라미(한글나라와 같은 그림 "child:face") + 지금 어디쯤인지 */
function NameTag({ sub, master }: { sub: string; master: boolean }) {
  const face = imageOf("child:face");
  return (
    <div className="glass flex min-w-0 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 portrait:pr-4">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xl font-extrabold text-white ring-2 ring-brand short:h-9 short:w-9 short:text-lg">
        {face ? <Image src={face} alt={CHILD.nick} fill sizes="48px" className="object-cover" /> : [...CHILD.full][1]}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="flex items-center gap-1 text-xl font-extrabold short:text-lg">
          {CHILD.nick}
          {master && <Icon emoji="👑" />}
        </span>
        <span className="block truncate text-sm font-semibold text-ink-soft">{sub}</span>
      </span>
    </div>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="0.95em" height="0.95em" aria-hidden>
      <path d="M12 3.2l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.5l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" fill="currentColor" />
    </svg>
  );
}

/**
 * 이번 장 하루하루 = 계단(2026-10-28 사용자: 하루하루 난이도가 오르는 느낌) — 날마다 한 칸씩 높아지고, 하온이 얼굴이 오늘 칸 위에 서 있다.
 * 끝낸 칸은 블록, 오늘 칸은 대표색, 꼭대기(5일째 도장 놀이)는 별. 마스터는 칸을 눌러 그날을 미리 본다
 */
function DayTrack({ progress, onPick }: { progress: Progress; onPick?: (day: number) => void }) {
  const today = progress.practice ? null : progress.day;
  const face = imageOf("child:face");
  return (
    <div className="flex items-end justify-between gap-1.5">
      {Array.from({ length: DAYS_PER_CHAPTER }, (_, i) => i + 1).map((d) => {
        const done = d < progress.day || (progress.practice && d === DAYS_PER_CHAPTER);
        const here = today === d;
        const dot = (
          <span className="flex flex-col items-center">
            {here && (
              <span className="relative mb-1 grid h-9 w-9 animate-float place-items-center overflow-hidden rounded-full bg-brand text-lg font-extrabold text-white ring-2 ring-white short:h-7 short:w-7">
                {face ? <Image src={face} alt={CHILD.nick} fill sizes="40px" className="object-cover" /> : [...CHILD.full][1]}
              </span>
            )}
            <span
              className={`grid w-12 place-items-center rounded-t-[0.9rem] rounded-b-[0.4rem] font-extrabold portrait:w-11 ${
                here ? "bg-brand text-xl text-white ring-4 ring-brand-soft" : done ? "bg-butter" : "bg-paper-deep/70 text-base text-ink-soft"
              }`}
              style={{ height: `${2.3 + (d - 1) * 0.55}rem` }}
            >
              {here ? d : done ? <BlockIcon size={26} /> : isStampDay(d) ? <StarIcon /> : d}
            </span>
          </span>
        );
        return onPick ? (
          <button key={d} type="button" aria-label={`${d}일 미리 보기`} onClick={() => onPick(d)}>
            {dot}
          </button>
        ) : (
          <span key={d}>{dot}</span>
        );
      })}
    </div>
  );
}

export default function HomeScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const today = useToday();
  const router = useRouter();
  // 안내 친구를 눌렀을 때 한 말 — 말풍선에 그대로 보이고, 읽는 곳까지 색이 바뀐다. 누르기 전에는 평소 말
  const [line, setLine] = useState<string | null>(null);
  const helloAt = useRef(0);
  const portrait = usePortrait();
  // 오늘의 미션 판 — null 이면 저절로(출석 전·도장 받을 차례), 누르거나 닫으면 그대로
  const [board, setBoard] = useState<boolean | null>(null);

  if (!saved) return <Splash />;

  const { progress, settings } = saved;
  const train = trainOf(progress, today);
  const missions = missionState(progress, today);
  const boardCalls = !train.checked || (missions.allDone && !missions.claimed);
  const showBoard = board ?? (!!today && boardCalls);
  const friendN = todayFriend(progress, today);
  const session = currentSession(progress);
  const chapter = chapterOf(session?.plan.chapter ?? progress.chapter);
  const can = master || canPlayToday(progress, settings, today);
  const bubble = line ?? (!session ? "모든 놀이를 다 했어! 놀이터에서 또 놀자!" : can ? "오늘의 놀이를 시작해 볼까?" : "오늘 놀이는 끝! 내일 또 만나!");

  /** 안내 친구를 누르면 하온이 이름을 부르며 말한다 — 인사말을 차례로(한글나라와 같이 이름은 누를 때만) */
  const greet = () => {
    sfx.wake();
    sfx.pop();
    // 오늘의 친구가 있으면 번갈아 — 친구 인사·소개, 그다음엔 하온이 이름을 부르는 평소 인사
    const turn = helloAt.current++;
    if (friendN && turn % 2 === 0) {
      setLine(meetHello(friendN));
      void say([LINES.todayFriend, meetHello(friendN), meetIntro(friendN)]);
      return;
    }
    const text = !session || !can ? LINES.doneToday : LINES.hello[Math.floor(turn / (friendN ? 2 : 1)) % LINES.hello.length];
    setLine(text);
    void say(text);
  };

  const goto = (href: string) => {
    sfx.wake();
    sfx.pop();
    router.push(href);
  };

  const opened: Record<MenuId, boolean> = {
    free: GAMES.some((g) => isOpen(saved, gameOpens(g), master)),
    games: true,
    friends: true,
    write: true,
    tower: true,
  };

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <Backdrop scene="home" />
      {/* 위쪽 하늘을 살짝 밝게 — 이름표·숫자가 바탕에 묻히지 않게 */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/45 to-transparent" />

      <header className="relative z-10 flex items-center justify-between gap-2 px-5 pt-4 short:px-4 short:pt-2 portrait:px-3 portrait:pt-3">
        <NameTag sub={chapter ? `${chapter.no}장 · ${chapter.title}` : "모든 장을 마쳤어요"} master={master} />
        <div className="flex items-center gap-2 portrait:gap-1.5">
          {/* 오늘의 미션 판 다시 열기 — 기관차 + 미션 셋 점 */}
          <button
            type="button"
            aria-label="오늘의 미션"
            onClick={() => {
              sfx.wake();
              sfx.pop();
              setBoard(true);
            }}
            className={`glass flex h-12 shrink-0 items-center gap-1.5 rounded-full px-3 ${boardCalls ? "animate-breathe ring-4 ring-brand/40" : ""}`}
          >
            <TrainEngine w="1.5rem" />
            <span className="flex gap-1">
              {missions.list.map((m, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full ${m.done ? "bg-mint-deep" : "bg-ink/20"}`} />
              ))}
            </span>
          </button>
          <button type="button" aria-label="블록 탑" onClick={() => goto("/tower")}>
            <BlockCount n={wallet(progress)} />
          </button>
          <ParentGate />
        </div>
      </header>

      <section className="relative z-10 flex min-h-0 flex-1 items-center-safe justify-center gap-[5vw] overflow-y-auto px-8 short:gap-6 short:px-5 portrait:flex-col portrait:justify-evenly portrait:gap-0 portrait:px-4">
        {/* 안내 친구 + 말풍선 */}
        <div className="flex shrink-0 flex-col items-center">
          <SpeechBubble tail="down" className="mb-3 max-w-[min(86vw,24rem)] short:mb-1 short:px-4 short:py-2 short:text-xl portrait:text-2xl">
            <ReadAlong text={bubble} />
          </SpeechBubble>
          <button type="button" onClick={greet} aria-label={friendN ? "오늘의 친구" : "안내 친구"} className="flex flex-col items-center">
            {friendN ? <FriendArt n={friendN} height={portrait ? "150px" : "min(210px, 30vh)"} className="animate-float" /> : <Guide size={portrait ? 150 : 210} className="animate-float" />}
            {friendN && <span className="glass -mt-1 rounded-full px-3 py-0.5 text-base font-extrabold short:text-sm">오늘의 친구</span>}
          </button>
        </div>

        {/* 오늘의 놀이 카드 */}
        <div className="glass w-full max-w-[31rem] rounded-[2.2rem] p-6 short:max-w-[24rem] short:rounded-[1.6rem] short:p-3.5 portrait:p-5">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${can && session ? "bg-brand-soft text-brand-deep" : "bg-mint/70 text-ink"}`}>
              {!session ? "다 했어요" : can ? "오늘의 놀이" : "오늘 놀이 끝!"}
            </span>
            {session?.practice && <span className="rounded-full bg-lilac px-3 py-1 text-sm font-extrabold">연습 놀이</span>}
            {session && !session.practice && (
              <span className="ml-auto text-sm font-bold text-ink-soft">
                {session.plan.chapter}장 · {session.plan.day}일째
              </span>
            )}
          </div>

          {chapter ? (
            <>
              <h2 className="mt-3 text-[2rem] font-extrabold leading-tight break-keep short:mt-1.5 short:text-2xl portrait:text-[1.7rem]">
                {chapter.no}장 · {chapter.title}
              </h2>
              <p className="mt-0.5 text-lg font-semibold text-ink-soft short:text-base">{chapter.goal}</p>
              <div className="mt-5 short:mt-2.5">
                <DayTrack progress={progress} onPick={master ? (d) => router.push(`/play?preview=c${chapter.no}d${d}`) : undefined} />
              </div>
            </>
          ) : (
            <h2 className="mt-3 text-[1.8rem] font-extrabold leading-tight">모든 장을 마쳤어요!</h2>
          )}

          {session &&
            (can ? (
              <button type="button" onClick={() => goto("/play")} className="cta mt-6 flex w-full items-center justify-center gap-3 rounded-full py-4 text-[2rem] font-extrabold short:mt-3 short:py-2.5 short:text-2xl">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-2xl text-brand short:h-9 short:w-9 short:text-xl">
                  <PlayIcon />
                </span>
                시작하기
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goto("/free")}
                className="squish mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 text-2xl font-extrabold short:mt-3 short:py-2.5"
                style={toneStyle("sky")}
              >
                <Icon emoji="🌙" /> 내일 또 만나요 · 놀이터 가기
              </button>
            ))}
        </div>
      </section>

      {/* 메뉴 바 — 아이가 알아듣는 이름(curriculum/menus) */}
      <nav
        className="glass relative z-10 mx-auto mb-4 flex shrink-0 items-stretch gap-1 rounded-[2rem] p-2 short:mb-2 short:p-1.5 portrait:mb-3 portrait:w-[calc(100%-1.25rem)]"
        aria-label="메뉴"
      >
        {MENUS.map((m) => {
          const open = opened[m.id];
          return (
            <button
              key={m.id}
              type="button"
              className="flex w-[7.4rem] flex-col items-center gap-1 rounded-[1.5rem] px-1 pb-1.5 pt-2 transition-transform hover:bg-white/80 active:scale-95 short:w-auto short:flex-row short:gap-2 short:px-3 short:py-1 portrait:w-auto portrait:flex-1 portrait:px-0"
              onClick={() => {
                sfx.wake();
                if (!open) {
                  sfx.boop();
                  void say(LINES.locked);
                  return;
                }
                goto(m.href);
              }}
            >
              <span
                className="relative grid h-14 w-14 place-items-center rounded-[1.2rem] text-[2.6rem] short:h-10 short:w-10 short:rounded-[0.9rem] short:text-[1.9rem] portrait:h-12 portrait:w-12 portrait:text-[2.2rem]"
                style={{ background: `var(--${m.tone})` }}
              >
                <Icon id={`menu:${m.id}`} emoji={m.icon} className={open ? "" : "opacity-40 grayscale"} />
                {!open && (
                  <span className="absolute -right-1.5 -top-1.5 text-lg">
                    <Icon emoji="🔒" />
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-[0.95rem] font-extrabold text-ink portrait:text-[0.85rem]">{m.title}</span>
            </button>
          );
        })}
      </nav>

      {showBoard && today && <TodayBoard progress={progress} today={today} onClose={() => setBoard(false)} onStay={() => setBoard(true)} />}
    </main>
  );
}
