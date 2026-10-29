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
  | { kind: "sort"; by: "color" | "size" | "mix"; rounds: number }
  // ── 업체 유아 단계 놀이(2026-10-28 사용자: 토도수학 유아 단계 구성요소를 그대로 따라서 — 그림·목소리는 우리 것) ──
  /**
   * 수 세기 기초 — 물건을 세고 숫자 카드 둘 중에 고르기(카드 위에 그 수만큼 점). 처음엔 1, 2, 3 … 차례로 한 줄,
   * mix 면 섞인 수를 무리 지어(2×2, 3×2 …) — 업체도 첫 섬만 차례로, 다음 섬부터 섞는다(2026-10-29 녹화)
   */
  | { kind: "count-up"; range: NumRange; mix?: boolean }
  /** 짝 연결하기 — 위·아래 줄의 짝을 선으로 잇기. same 은 같은 물건끼리, number 는 숫자(nums 범위)와 그 수만큼의 점 */
  | { kind: "match"; by: "same" | "number"; nums?: NumRange; rounds: number }
  /** 작은 농장 — 병아리가 하나씩 헛간에 들어가고 "헛간에 몇 마리 있을까?" 카드 둘 중에 고르기, 지붕을 열어 확인 */
  | { kind: "farm"; range: NumRange; rounds: number }
  /** 숫자 퍼즐 — 탈리 막대(|, ||, …) 칸 아래에 숫자 타일을 끌어다 놓기 */
  | { kind: "tally"; range: NumRange }
  /** 도형 맞추기 — 흩어진 모양 카드에서 같은 모양끼리(크기·색이 달라도) 둘씩 짝짓기 */
  | { kind: "shape-pair"; rounds: number }
  /** 주사위 찾기 — "셋!" 눈이 그 수인 주사위를 칸에 끌어다 놓기. 작은 수부터 차례로(업체 「도미노 산수」, 6까지) */
  | { kind: "dice"; range: NumRange }
  /**
   * 가게 놀이 — 숫자 친구 손님이 물건을 달라고 한다. ask "name" 은 "딸기를 주세요!" 선반의 다른 물건 셋 중에 그것 하나를 바구니에(업체 「동물 마트」 그대로,
   * 레벨 A — 2026-10-29 사용자), "count"(기본) 는 "사과 세 개 주세요!" 그만큼 담고 「다 담았어」(놀이터)
   */
  | { kind: "shop"; range: NumRange; rounds: number; ask?: "name" | "count" }
  /** 수직선 밝히기 — "1 + ? = 3" 블록 막대를 수직선에 놓아 목표 수까지 채우고 ✓. 합이 max 이하 */
  | { kind: "number-line"; max: number; rounds: number };

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
