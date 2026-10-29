"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { KIND_LABEL } from "@/components/play/kindIcon";
import { Splash, toneStyle, UiIcon } from "@/components/ui";
import { CHAPTERS, DAYS_PER_CHAPTER, isStampDay, LEVEL_NAMES } from "@/curriculum/course";
import { LINES } from "@/curriculum/lines";
import { logout, useAuth } from "@/lib/auth";
import { pullFamily, useFamily } from "@/lib/family";
import { updateSaved, useSaved, useToday } from "@/lib/store";
import { pull, useSyncStatus, type SyncState } from "@/lib/sync";
import { say, voiceStatus } from "@/lib/voice";
import { VOICES } from "@/lib/voices";
import { AdminPanel } from "./AdminPanel";
import { Card, FamilyCard, ProgramControls, ProgressSummary, RecordTable, ReportCard, StampCard } from "./report";
import { ScheduleCard } from "./schedule";
import { SongsCard } from "./SongsCard";

const SYNC_LABEL: Record<SyncState, string> = {
  starting: "확인 중…",
  syncing: "맞추는 중…",
  ok: "저장됨",
  off: "꺼짐 — 서버에 MONGODB_URI 가 없어요 (지금은 이 기기에만 저장)",
  locked: "로그인이 풀렸어요 — 로그아웃 후 다시 들어와 주세요",
  error: "연결이 안 돼요 — 기기에 저장해 두고 다음에 올려요",
};

/** MongoDB 저장 상태 */
function SyncCard() {
  const st = useSyncStatus();
  return (
    <Card title="MongoDB 저장">
      <p>
        상태: <b>{SYNC_LABEL[st.state]}</b>
        {st.at && <span className="text-ink-soft"> · 마지막 {new Date(st.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>}
      </p>
      <button
        type="button"
        className="squish mt-3 rounded-2xl px-5 py-2"
        onClick={() => {
          void pull();
          void pullFamily();
        }}
      >
        지금 맞추기
      </button>
      <p className="mt-3 text-base text-ink-soft">
        숫자놀이 진도·기록은 아이디마다 문서 하나로 저장돼요(DB haonnumber · progress). 계정과 공부 요일·성우·화면 방향(숫자놀이에서 따로 안 정했을 때)은 한글나라 DB(todohangul)에서 읽기만 해요 — 한글나라 진도는 건드리지 않아요.
      </p>
    </Card>
  );
}

/** 부모 페이지 — 로그인한 아이디의 진도·리포트·프로그램 관리. 마스터 아이디면 아이별 진도까지 */
export default function ParentScreen() {
  const saved = useSaved();
  const auth = useAuth();
  const today = useToday();
  const family = useFamily();
  const [voice, setVoice] = useState<ReturnType<typeof voiceStatus> | null>(null);
  if (!saved || !auth) return <Splash />;

  const { progress } = saved;
  const master = auth.user.role === "master";

  return (
    <main className="min-h-dvh bg-paper px-5 py-6 pt-[calc(1.5rem_+_var(--cam))] lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between gap-3 print:hidden">
          <h1 className="font-display text-4xl">{master ? "관리자 페이지" : "부모 페이지"}</h1>
          <div className="flex gap-3">
            <button type="button" className="squish rounded-full px-5 py-3 font-display text-xl" onClick={() => window.print()}>
              <span className="inline-flex items-center gap-2">
                <UiIcon name="print" /> 인쇄·PDF
              </span>
            </button>
            <Link href="/" className="squish inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-2xl">
              <UiIcon name="home" /> 아이 화면으로
            </Link>
          </div>
        </header>

        <Card
          title="로그인"
          right={
            <button
              type="button"
              className="squish rounded-full px-5 py-2"
              style={toneStyle("peach")}
              onClick={() => {
                if (window.confirm("로그아웃할까요? 다음에 아이디·비밀번호를 다시 넣어야 해요.")) logout();
              }}
            >
              로그아웃
            </button>
          }
        >
          <p>
            <b className="font-display text-2xl">@{auth.user.id}</b> · {master ? "마스터(관리자) — 모든 메뉴가 열리고 하루 한 번 제한이 없어요" : "아이 — 진도대로 메뉴가 열려요"}
          </p>
          <p className="mt-1 text-base text-ink-soft">한글나라와 같은 계정이에요{family.name ? ` (한글나라 이름: ${family.name})` : ""}.</p>
        </Card>

        {master && <AdminPanel today={today} />}

        <FamilyCard family={family} own={saved.settings.orientation} />

        <ScheduleCard saved={saved} today={today} studyDays={family.studyDays} change={(fn) => updateSaved(fn)} />

        <div className="grid gap-5 lg:grid-cols-2">
          <Card title={master ? "이 아이디의 진도 (미리 보기용)" : "지금 진도"}>
            <ProgressSummary progress={progress} today={today} />
          </Card>
          <ReportCard daily={progress.daily} today={today} />
        </div>

        <ProgramControls saved={saved} today={today} who={`@${auth.user.id}`} hangulView={family.orientation} change={(fn) => updateSaved(fn)} />

        <SongsCard />

        <div className="grid gap-5 lg:grid-cols-2">
          <StampCard history={progress.history} stamps={progress.stamps} />
          <RecordTable history={progress.history} />
        </div>

        <Card title="미리 보기 (진도에 남지 않아요)">
          <div className="grid gap-3 lg:grid-cols-2">
            {CHAPTERS.map((c) => (
              <div key={c.no}>
                <p className="mb-1.5 text-ink-soft">
                  {c.no}장 {c.title} <span className="text-sm">({c.code})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: DAYS_PER_CHAPTER }, (_, i) => i + 1).map((d) => (
                    <Link key={d} href={`/play?preview=c${c.no}d${d}`} className={`rounded-xl px-3 py-2 ${isStampDay(d) ? "bg-butter" : "bg-paper"}`} title={c.days[d - 1].map((a) => KIND_LABEL[a.kind]).join(" · ")}>
                      {d}일 {isStampDay(d) && <Icon emoji="⭐" />}
                    </Link>
                  ))}
                  <Link href={`/play?preview=c${c.no}p`} className="rounded-xl bg-lilac/60 px-3 py-2">
                    연습
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={`전체 과정표 (${CHAPTERS.length}장 · ${CHAPTERS.length * DAYS_PER_CHAPTER}일)`}>
          <p className="mb-3 text-base text-ink-soft">
            토도수학 나이대별 과정의 학습 목표 순서를 따라요 — 레벨 A({LEVEL_NAMES.A}) A1~A10 → 레벨 B({LEVEL_NAMES.B}) B1~B10. 장 하나가 목표 하나, 5일째 도장 놀이가 그 목표 확인이에요.
          </p>
          <ol className="grid gap-3 lg:grid-cols-2">
            {CHAPTERS.map((c) => (
              <li key={c.no}>
                <details>
                  <summary className="cursor-pointer">
                    <b>{c.no}장</b> <span className="rounded-md bg-paper px-1.5 text-sm font-bold">{c.code}</span> {c.title} <span className="text-ink-soft">— {c.goal}</span>
                  </summary>
                  <ul className="ml-5 mt-1 list-disc text-base text-ink-soft">
                    {c.days.map((acts, i) => (
                      <li key={i}>
                        {i + 1}일{isStampDay(i + 1) ? "(도장)" : ""}: {acts.map((a) => (a.kind === "meet" ? `${KIND_LABEL.meet} ${a.n}` : KIND_LABEL[a.kind])).join(" · ")}
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ol>
        </Card>

        <SyncCard />

        <Card title="목소리">
          <p>성우는 한글나라 설정을 따라요(지금 {VOICES.find((v) => v.id === family.voice)?.name}). 구워 둔 음성 파일이 없는 말은 기기 기본 음성으로 읽어요.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="squish rounded-2xl px-5 py-3"
              onClick={() => {
                setVoice(voiceStatus());
                void say(LINES.greet);
              }}
            >
              지금 목소리 들어 보기
            </button>
            {voice && (
              <span className="text-ink-soft">
                구운 파일 {VOICES.map((v) => `${v.name} ${voice.files[v.id]}개`).join(" · ")} · 기기 음성 {voice.deviceVoice ?? "한국어 음성 없음"}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-ink-soft">음성: Typecast(타입캐스트) — 한글나라와 같은 성우</p>
        </Card>
      </div>
    </main>
  );
}
