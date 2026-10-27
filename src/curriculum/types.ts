/**
 * 과정표 모양 — 장(章)마다 하루치 놀이(DayPlan)가 있고, 하루치는 놀이 설계도(ActivitySpec) 몇 개.
 * 설계도는 "무엇을 몇 판" 까지만 — 실제 문제(어떤 수·어떤 물건·보기 순서)는 lib/rounds 가 시작할 때 섞어서 만든다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import type { ShapeId } from "./things.ts";

/** 수 범위 [작은 수, 큰 수] */
export type NumRange = readonly [number, number];

export type ActivitySpec =
  /** 숫자 친구 만나기 — 친구 소개 + 블록 하나씩 세기 + 숫자 모양 */
  | { kind: "meet"; n: number }
  /** 하나씩 눌러 세기 — 물건을 하나씩 누르며 세고 "모두 몇 개?" */
  | { kind: "count"; range: NumRange; rounds: number }
  /** 몇 개일까 — 물건 무리를 보고 맞는 숫자 고르기 */
  | { kind: "how-many"; range: NumRange; rounds: number }
  /** 숫자 찾기 — "셋! 어디 있을까?" 듣고 숫자 카드 고르기 */
  | { kind: "find-num"; range: NumRange; rounds: number }
  /** 블록 쌓기 — 숫자만큼 블록을 쌓고 "다 됐어" */
  | { kind: "build"; range: NumRange; rounds: number }
  /** 숫자 따라 쓰기 */
  | { kind: "trace"; digits: readonly number[] }
  /** 짝짝 손뼉 — 숫자만큼 손뼉 */
  | { kind: "clap"; range: NumRange; rounds: number }
  /** 더 많은 쪽·더 적은 쪽 — show "numbers" 면 물건 대신 숫자(+ 그 수만큼 블록)로 "어느 수가 더 클까?"(B10) */
  | { kind: "compare"; range: NumRange; rounds: number; ask: "more" | "fewer" | "mix"; show?: "things" | "numbers" }
  /** 다음 숫자 — 1 2 3 ? */
  | { kind: "next-num"; range: NumRange; rounds: number }
  /** 모양 찾기 — vary(기본)면 크기·색·돌림이 달라도 같은 모양(A5), false 면 반듯한 기본 모양으로 이름부터(A2) */
  | { kind: "shape"; shapes: readonly ShapeId[]; rounds: number; vary?: boolean }
  /** 규칙 찾기 — AB(사과 바나나 사과 바나나 ?) · AAB · ABC */
  | { kind: "pattern"; level: "ab" | "aab" | "abc"; rounds: number }
  /** 모아 보기 — 블록 둘 무리를 합치면 몇 개? */
  | { kind: "join"; max: number; rounds: number }
  /** 크기 비교 — 같은 모양 둘 중 더 큰 것·더 작은 것(A9) */
  | { kind: "size"; ask: "bigger" | "smaller" | "mix"; rounds: number }
  /** 더하기 — "둘 더하기 하나는?" 블록 두 무리 + 기호(B5). 합이 max 이하 */
  | { kind: "add"; max: number; rounds: number }
  /** 빼기 — "셋 빼기 하나는?" 블록이 떠나고 남은 수(B7). 빼어지는 수가 max 이하, 답은 1 이상 */
  | { kind: "subtract"; max: number; rounds: number }
  /** 모양 나누기 — "빨간 것을 모두 골라 봐!" 색·크기에 따라 골라 모으기(B9) */
  | { kind: "sort"; by: "color" | "size" | "mix"; rounds: number };

export type ActivityKind = ActivitySpec["kind"];

export interface DayPlan {
  chapter: number;
  /** 장 안에서 몇째 날 (1부터) */
  day: number;
  title: string;
  /** 장 끝 도장 놀이 날 — 점수 놀이만, 첫 시도만 채점 */
  stamp: boolean;
  activities: ActivitySpec[];
}

/** 업체(토도수학) 레벨 — A 유아 · B 유치원 기초(2026-10-27 사용자: 업체 나이대별 과정을 따라가기) */
export type Level = "A" | "B";

export interface Chapter {
  no: number;
  /** 업체 레벨과 학습 목표 번호 — 장 하나 = 학습 목표 하나(예: "A1") */
  level: Level;
  code: string;
  title: string;
  /** 부모 페이지·스케줄에 보이는 이 장의 목표 */
  goal: string;
  /** 이 장에서 다루는 수 범위 — 놀이터가 이 범위로 열린다 */
  range: NumRange;
  /** 이 장에서 처음 만나는 숫자 친구 */
  meets: readonly number[];
  days: readonly (readonly ActivitySpec[])[];
}
