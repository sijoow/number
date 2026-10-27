"use client";

import type { ReactNode } from "react";
import { CheckMark, toneStyle, UiIcon } from "@/components/ui";
import { CHAPTERS, chapterOf } from "@/curriculum/course";
import { FRIENDS } from "@/curriculum/friends";
import type { Family } from "@/lib/hangul";
import { currentSession, daysBefore, initialProgress, progressRate, restartAt, type DayStat, type DoneRecord, type Progress } from "@/lib/progress";
import { WEEKDAYS } from "@/lib/schedule";
import type { Saved } from "@/lib/store";
import { VOICES } from "@/lib/voices";

/*
 * 부모·관리자 화면 조각 — 내 진도(부모 페이지)와 아이 진도(관리자 화면)가 같은 조각을 쓴다.
 */

export function Card({ title, children, right }: { title: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-[0_14px_34px_-18px_rgb(62_58_82/0.35)] ring-1 ring-ink/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl text-ink">{title}</h2>
        {right}
      </div>
      <div className="font-body text-lg text-ink">{children}</div>
    </section>
  );
}

export function RateBar({ label, done, total, rate }: { label: string; done: number; total: number; rate: number }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-base">
        <span>{label}</span>
        <span className="text-ink-soft">
          {done}/{total}일 · <b className="text-ink">{Math.round(rate * 100)}%</b>
        </span>
      </div>
      <div className="mt-1 h-4 overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-mint-deep transition-all" style={{ width: `${Math.max(rate * 100, rate > 0 ? 2 : 0)}%` }} />
      </div>
    </div>
  );
}

const EMPTY: DayStat = { ms: 0, acts: 0, earned: 0 };
/** 막대 색 — 흰 카드 위 대비 3:1 이상 */
const BAR = "#3d8fd1";

export function minutes(ms: number): string {
  if (ms <= 0) return "0분";
  const m = Math.round(ms / 60_000);
  return m < 1 ? "1분 미만" : `${m}분`;
}

function weekdayOf(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

function StatTile({ label, s }: { label: string; s: DayStat }) {
  return (
    <div className="rounded-2xl bg-paper p-4">
      <p className="text-base text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl">{minutes(s.ms)}</p>
      <p className="text-base text-ink-soft">
        활동 {s.acts}개 · 블록 +{s.earned}
      </p>
    </div>
  );
}

/** 지금 진도 — 장·날, 진도율, 만난 친구·도장 */
export function ProgressSummary({ progress, today }: { progress: Progress; today: string }) {
  const session = currentSession(progress);
  const chapter = chapterOf(session?.plan.chapter ?? progress.chapter);
  const weekAgo = today ? daysBefore(today, 6) : "";
  const playedThisWeek = Object.keys(progress.daily).filter((d) => d >= weekAgo && (progress.daily[d]?.ms ?? 0) > 0).length;
  return (
    <>
      {chapter ? (
        <>
          <p className="text-2xl">
            {chapter.no}장 {chapter.title} · {session?.practice ? `연습 놀이 (도장 ${progress.tries}번 못 받음)` : `${progress.day}일째`}
          </p>
          <p className="mt-1 text-ink-soft">{chapter.goal}</p>
        </>
      ) : (
        <p className="text-2xl">모든 장(1~{CHAPTERS.length}장)을 마쳤어요</p>
      )}
      <p className="mt-3">
        블록 <b>{progress.blocks}</b>개 · 최근 7일 중 <b>{playedThisWeek}</b>일 학습 · 오늘 놀이{" "}
        {progress.lastPlayedOn === today ? (
          <span className="inline-flex items-center gap-1 font-bold text-mint-deep">
            <UiIcon name="check" /> 했어요
          </span>
        ) : (
          "아직이에요"
        )}
      </p>
      <p className="mt-1">
        만난 숫자 친구 <b>{progress.friends.length}</b>/{FRIENDS.length} {progress.friends.length > 0 && <span className="text-ink-soft">({progress.friends.join(" · ")})</span>} · 도장{" "}
        <b>{progress.stamps.length}</b>/{CHAPTERS.length}
      </p>
      <RateBar label={`전체 진도율 (${CHAPTERS.length}장 · ${progressRate(progress).total}일)`} {...progressRate(progress)} />
    </>
  );
}

/** 학습 리포트 — 학습 시간·활동 수·블록 (모든 메뉴 합) */
export function ReportCard({ daily, today }: { daily: Record<string, DayStat>; today: string }) {
  const days = Array.from({ length: 7 }, (_, i) => daysBefore(today, 6 - i));
  const rows = days.map((d) => ({ d, s: daily[d] ?? EMPTY }));
  const week = rows.reduce((a, r) => ({ ms: a.ms + r.s.ms, acts: a.acts + r.s.acts, earned: a.earned + r.s.earned }), EMPTY);
  const max = Math.max(...rows.map((r) => r.s.ms));
  const scale = Math.max(max, 5 * 60_000);
  // 숫자는 오늘과 가장 많이 한 날에만 — 막대마다 숫자를 다 달면 읽기 어렵다(나머지는 막대를 누르거나 표로)
  const labelled = new Set([today, rows.find((r) => r.s.ms === max && max > 0)?.d]);
  return (
    <Card title="학습 리포트">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="오늘" s={daily[today] ?? EMPTY} />
        <StatTile label="최근 7일" s={week} />
      </div>
      <p className="mt-5 text-base text-ink-soft">최근 7일 학습 시간</p>
      <div className="mt-2 flex h-40 items-end gap-[2px] border-b-2 border-paper-deep" role="img" aria-label="최근 7일 날짜별 학습 시간 막대 그래프">
        {rows.map(({ d, s }) => (
          <div key={d} className="flex h-full flex-1 flex-col items-center justify-end" title={`${d.slice(5).replace("-", ".")} · ${minutes(s.ms)} · 활동 ${s.acts}개`}>
            {labelled.has(d) && s.ms > 0 && <span className="mb-1 text-sm text-ink">{minutes(s.ms)}</span>}
            <div className="w-3/5 rounded-t-[4px]" style={{ height: `${(s.ms / scale) * 85}%`, minHeight: s.ms > 0 ? 4 : 0, background: BAR }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[2px]">
        {rows.map(({ d }) => (
          <span key={d} className={`flex-1 text-center text-sm ${d === today ? "font-bold text-ink" : "text-ink-soft"}`}>
            {d === today ? "오늘" : weekdayOf(d)}
          </span>
        ))}
      </div>
      <details className="mt-3 text-base">
        <summary className="cursor-pointer text-ink-soft">표로 보기</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-ink-soft">
            <tr>
              <th className="font-normal">날짜</th>
              <th className="font-normal">학습 시간</th>
              <th className="font-normal">활동</th>
              <th className="font-normal">블록</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ d, s }) => (
              <tr key={d} className="border-t border-paper-deep">
                <td>
                  {d.slice(5).replace("-", ".")} ({weekdayOf(d)})
                </td>
                <td>{minutes(s.ms)}</td>
                <td>{s.acts}</td>
                <td>+{s.earned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  );
}

/** 장별 도장 — 장마다 목표와 도장 놀이 결과(첫 시도 정답률). 두 번 다 못 받은 장은 '다시 볼 장' */
export function StampCard({ history, stamps }: { history: DoneRecord[]; stamps: number[] }) {
  const tests = history.filter((r) => r.stamp && !r.practice);
  return (
    <Card title="장별 도장">
      {tests.length === 0 ? (
        <p className="text-ink-soft">아직 도장 놀이(5일째)를 한 장이 없어요.</p>
      ) : (
        <table className="w-full text-left">
          <thead className="text-ink-soft">
            <tr>
              <th className="py-1 font-normal">장</th>
              <th className="py-1 font-normal">목표</th>
              <th className="py-1 font-normal">결과</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((r, i) => (
              <tr key={i} className="border-t border-paper-deep">
                <td className="whitespace-nowrap py-2">{r.chapter}장</td>
                <td className="py-2">{chapterOf(r.chapter)?.goal ?? ""}</td>
                <td className="whitespace-nowrap py-2">
                  {r.total > 0 ? `${Math.round((r.correct / r.total) * 100)}%` : "—"}{" "}
                  <span className={`rounded-full px-2 text-sm ${r.passed ? "bg-mint" : "bg-lilac"}`}>{r.passed ? "도장" : stamps.includes(r.chapter) ? "다시 해서 도장" : "다시 볼 장"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function recordLabel(r: DoneRecord): string {
  if (r.practice) return `${r.chapter}장 연습 놀이`;
  return `${r.chapter}장 ${r.day}일째${r.stamp ? " · 도장 놀이" : ""}`;
}

/** 오늘의 놀이 기록 — 최근 30개 */
export function RecordTable({ history }: { history: DoneRecord[] }) {
  const recent = [...history].reverse().slice(0, 30);
  return (
    <Card title="오늘의 놀이 기록">
      {recent.length === 0 ? (
        <p className="text-ink-soft">아직 기록이 없어요.</p>
      ) : (
        <table className="w-full text-left">
          <thead className="text-ink-soft">
            <tr>
              <th className="py-1 font-normal">날짜</th>
              <th className="py-1 font-normal">놀이</th>
              <th className="py-1 font-normal">첫 시도 정답</th>
              <th className="py-1 font-normal">시간</th>
              <th className="py-1 font-normal">블록</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={i} className="border-t border-paper-deep">
                <td className="py-2">{r.on.slice(5).replace("-", ".")}</td>
                <td className="py-2">
                  {recordLabel(r)}
                  {r.passed === true && <span className="ml-2 rounded-full bg-mint px-2 text-sm">도장</span>}
                  {r.passed === false && <span className="ml-2 rounded-full bg-lilac px-2 text-sm">못 받음</span>}
                </td>
                <td className="py-2">{r.total > 0 ? `${r.correct}/${r.total} (${Math.round((r.correct / r.total) * 100)}%)` : "—"}</td>
                <td className="py-2">{r.ms ? minutes(r.ms) : "—"}</td>
                <td className="py-2">+{r.blocks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/** 한글나라에서 받아온 설정 — 여기서는 보기만(바꾸는 곳은 한글나라 부모 페이지) */
export function FamilyCard({ family, name }: { family: Family; name?: string }) {
  const days = family.studyDays.length === 7 ? "매일" : family.studyDays.map((d) => WEEKDAYS[d]).join("·");
  const voice = VOICES.find((v) => v.id === family.voice)?.name ?? family.voice;
  return (
    <Card title={name ? `한글나라에서 받아온 설정 — ${name}` : "한글나라에서 받아온 설정"}>
      <ul className="grid gap-2 sm:grid-cols-2">
        <li className="rounded-2xl bg-paper px-4 py-3">
          화면 보기 <b>{family.orientation === "portrait" ? "세로 모드" : "가로 모드"}</b>
        </li>
        <li className="rounded-2xl bg-paper px-4 py-3">
          공부하는 요일 <b>{days}</b>
        </li>
        <li className="rounded-2xl bg-paper px-4 py-3">
          성우 <b>{voice}</b>
        </li>
        <li className="rounded-2xl bg-paper px-4 py-3">
          한글나라 시작한 날 <b>{family.hangulStartOn ?? "기록 없음"}</b>
        </li>
      </ul>
      <p className="mt-3 text-base text-ink-soft">
        {family.at === 0
          ? "아직 한글나라 설정을 받아오지 못했어요 — 기본값(세로·매일·수아)으로 보여요."
          : !family.found
            ? "한글나라에 이 아이디 기록이 없어서 기본값(세로·매일·수아)이에요."
            : `마지막으로 받은 때 ${new Date(family.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`}{" "}
        바꾸려면 한글나라 부모 페이지에서 바꿔 주세요 — 숫자놀이도 다음에 열 때 따라와요.
      </p>
    </Card>
  );
}

/**
 * 프로그램 관리 — 하루 한 번, 오늘 한 판 더, 시작 장, 진도 초기화.
 * 내 진도에는 기기 저장(updateSaved), 아이 진도에는 서버 저장(관리자 화면)을 change 로 넘긴다.
 */
export function ProgramControls({ saved, today, change, who }: { saved: Saved; today: string; change: (fn: (s: Saved) => Saved) => void; who: string }) {
  const { progress, settings } = saved;
  const played = progress.lastPlayedOn === today && progress.extraOn !== today;
  const restart = (c: number) => {
    if (!window.confirm(`${who} — ${c}장부터 다시 시작할까요? 오늘의 놀이 진도가 ${c}장 1일로 바뀌어요. (블록·기록·친구·도장은 남아요)`)) return;
    change((s) => ({ ...s, progress: restartAt(s.progress, c) }));
  };
  return (
    <Card title="프로그램 관리">
      <label className="flex items-center justify-between gap-4">
        <span>하루 한 번만</span>
        <input
          type="checkbox"
          className="h-7 w-7 accent-[var(--mint-deep)]"
          checked={settings.oneADay}
          onChange={(e) => change((s) => ({ ...s, settings: { ...s.settings, oneADay: e.target.checked } }))}
        />
      </label>
      <button
        type="button"
        disabled={!played}
        onClick={() => change((s) => ({ ...s, progress: { ...s.progress, extraOn: today } }))}
        className="squish mt-3 w-full rounded-2xl px-5 py-3 text-left disabled:opacity-50"
        style={toneStyle("butter")}
      >
        오늘 한 판 더 열기 {played ? "" : "(지금 할 수 있어요)"}
      </button>
      <p className="mt-5 text-base text-ink-soft">시작 장 바꾸기 — 앞 장의 숫자 친구는 만난 것으로 쳐요</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {CHAPTERS.map((c) => (
          <button key={c.no} type="button" onClick={() => restart(c.no)} className={`squish rounded-2xl p-3 text-left ${progress.chapter === c.no ? "ring-4 ring-sky-deep" : ""}`}>
            <p className="flex items-center gap-1 font-display text-lg">
              {progress.stamps.includes(c.no) && <CheckMark on className="h-5 w-5 text-xs" />}
              {c.no}장
            </p>
            <p className="text-sm text-ink-soft">{c.title}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="squish ml-auto rounded-2xl px-5 py-2"
          style={toneStyle("peach")}
          onClick={() => {
            if (!window.confirm(`${who} — 진도·블록·친구·도장·기록을 모두 지우고 1장부터 시작할까요?`)) return;
            change((s) => ({ ...s, progress: initialProgress() }));
          }}
        >
          진도 초기화
        </button>
      </div>
    </Card>
  );
}
