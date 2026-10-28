"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { toneStyle } from "@/components/ui";
import { chapterOf } from "@/curriculum/course";
import { authHeaders } from "@/lib/auth";
import { fetchFamilyOf } from "@/lib/family";
import type { Family } from "@/lib/hangul";
import { progressRate } from "@/lib/progress";
import { emptySaved, toSaved, type Saved } from "@/lib/store";
import { Card, FamilyCard, ProgramControls, ProgressSummary, RecordTable, ReportCard, StampCard } from "./report";
import { ScheduleCard } from "./schedule";

/*
 * 관리자(마스터) 화면 — 아이별 숫자놀이 진도·리포트 보기, 프로그램 관리.
 * 아이 목록은 한글나라 계정 그대로(계정 만들기·비밀번호는 한글나라 관리자 페이지에서).
 * 아이 진도는 숫자놀이 DB 문서를 직접 읽고 바꾼다(/api/progress?profile=아이디) — 아이 기기는 다음에 켜질 때 따라간다.
 */

interface Child {
  id: string;
  name: string;
  source: "env" | "hangul";
  saved: Saved | null;
}

type ChildList = { db: boolean; children: Child[] };

async function fetchChildren(): Promise<ChildList | string> {
  try {
    const res = await fetch("/api/admin/children", { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) return res.status === 401 ? "로그인이 풀렸어요. 다시 로그인해 주세요." : "아이 목록을 못 불러왔어요.";
    const body = (await res.json()) as { db: boolean; children: (Omit<Child, "saved"> & { saved: unknown })[] };
    return { db: body.db, children: body.children.map((c) => ({ ...c, saved: c.saved ? toSaved(c.saved as Record<string, unknown>) : null })) };
  } catch {
    return "연결이 안 돼요.";
  }
}

export function AdminPanel({ today }: { today: string }) {
  const [list, setList] = useState<ChildList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [family, setFamily] = useState<{ id: string; f: Family | null } | null>(null);
  const [tick, setTick] = useState(0);
  const load = () => setTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    void fetchChildren().then((r) => {
      if (!alive) return;
      if (typeof r === "string") setError(r);
      else {
        setError(null);
        setList(r);
      }
    });
    return () => {
      alive = false;
    };
  }, [tick]);

  useEffect(() => {
    if (!sel) return;
    let alive = true;
    void fetchFamilyOf(sel).then((f) => alive && setFamily({ id: sel, f }));
    return () => {
      alive = false;
    };
  }, [sel]);

  const child = list?.children.find((c) => c.id === sel) ?? null;
  const fam = family?.id === sel ? family.f : null;

  /** 아이 진도 바꾸기 — 지금 시각으로 찍어서 서버에 올린다 */
  const change = async (id: string, fn: (s: Saved) => Saved) => {
    const cur = list?.children.find((c) => c.id === id);
    if (!cur) return;
    const next = { ...fn(cur.saved ?? emptySaved()), updatedAt: Date.now() };
    const res = await fetch(`/api/progress?profile=${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(next),
    }).catch(() => null);
    if (!res?.ok) window.alert("저장하지 못했어요. 잠시 뒤에 다시 해 주세요.");
    load();
  };

  return (
    <Card
      title={
        <>
          <Icon emoji="👑" /> 관리자 — 아이별 숫자놀이
        </>
      }
      right={
        <button type="button" className="squish rounded-full px-4 py-1 text-base" onClick={load}>
          새로고침
        </button>
      }
    >
      {error && <p className="mb-3 text-peach-deep">{error}</p>}
      {list && !list.db && <p className="mb-3 rounded-2xl bg-paper p-3 text-base">MongoDB 가 아직 연결되지 않아서 아이 진도를 볼 수 없어요. .env.local 에 MONGODB_URI 를 넣으면 켜져요.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list?.children.map((c) => {
          const p = c.saved?.progress;
          return (
            <button key={c.id} type="button" onClick={() => setSel(sel === c.id ? null : c.id)} className="squish rounded-2xl p-4 text-left" style={sel === c.id ? toneStyle("sky") : undefined}>
              <p className="font-display text-xl">
                {c.name} <span className="text-base text-ink-soft">@{c.id}</span>
              </p>
              {p ? (
                <p className="text-base text-ink-soft">
                  {chapterOf(p.chapter) ? `${p.chapter}장 ${p.day}일째` : "다 마침"} · 진도율 {Math.round(progressRate(p).rate * 100)}% · 블록 {p.blocks}
                  <br />
                  최근 학습 {p.lastPlayedOn?.slice(5).replace("-", ".") ?? "없음"}
                </p>
              ) : (
                <p className="text-base text-ink-soft">아직 숫자놀이 기록이 없어요</p>
              )}
            </button>
          );
        })}
        {list && list.children.length === 0 && <p className="text-ink-soft">아이 계정이 없어요. 한글나라 관리자 페이지에서 만들어 주세요.</p>}
      </div>
      <p className="mt-3 text-base text-ink-soft">아이 계정 만들기·비밀번호 바꾸기는 한글나라 관리자 페이지에서 해요 — 같은 계정으로 숫자놀이에도 들어와요.</p>

      {child && (
        <div className="mt-6 flex flex-col gap-4 rounded-[1.6rem] bg-paper p-4">
          <p className="font-display text-2xl">
            {child.name} <span className="text-lg text-ink-soft">@{child.id}</span>
          </p>
          {fam && <FamilyCard family={fam} name={child.name} own={child.saved?.settings.orientation} />}
          {child.saved ? (
            <>
              <div className="rounded-2xl bg-card p-4">
                <ProgressSummary progress={child.saved.progress} today={today} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ReportCard daily={child.saved.progress.daily} today={today} />
                <StampCard history={child.saved.progress.history} stamps={child.saved.progress.stamps} />
              </div>
              <RecordTable history={child.saved.progress.history} />
            </>
          ) : (
            <p className="text-ink-soft">이 아이디로 아직 숫자놀이를 한 적이 없어요. 아래에서 시작 장을 정해 둘 수 있어요.</p>
          )}
          {list?.db && <ScheduleCard saved={child.saved ?? emptySaved()} today={today} studyDays={fam?.studyDays ?? [0, 1, 2, 3, 4, 5, 6]} name={child.name} change={(fn) => void change(child.id, fn)} />}
          {list?.db && <ProgramControls saved={child.saved ?? emptySaved()} today={today} who={child.name} hangulView={fam?.orientation} change={(fn) => void change(child.id, fn)} />}
        </div>
      )}
    </Card>
  );
}
