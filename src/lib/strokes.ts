/**
 * 숫자 획 — 따라쓰기 판(components/StrokeBoard)이 쓰는 획 길과 판정(2026-10-29 사용자: 아이들이 숫자를 똑바로 못 쓴다 —
 * 업체 따라쓰기처럼 시작점에서 획 길을 따라 그어야만 칠해지고, 길을 벗어나면 더 칠해지지 않게).
 *
 * 숫자 하나 = 가로 100 × 세로 140 칸. 위 줄 TOP, 가운데 점선 MID, 아래 줄 BOTTOM 사이에 쓴다.
 * 획 = 쓰는 차례대로 놓은 중심선 점들(앞 점에서 뒤 점 방향으로 긋는다). 4·5 는 업체처럼 두 획, 나머지는 한 획.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export type Pt = readonly [number, number];

export const DIGIT_W = 100;
export const DIGIT_H = 140;
export const TOP = 14;
export const MID = 70;
export const BOTTOM = 126;
/** 획 길 굵기 — 이 안에서 긋는다 */
export const LANE = 16;
/** 손끝이 획 길 가운데서 이만큼 안이면 길 위로 본다(길 굵기 반 + 4살 손 여유) */
export const TOLERANCE = 15;
/** 펜 머리에서 이만큼 안을 눌러야 시작한다 */
export const HEAD_REACH = 22;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** 타원 호 — 각도는 수학 방향(0° 오른쪽, 90° 위), a0 에서 a1 쪽으로 */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt[] {
  const steps = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 8));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / steps);
    return [cx + rx * Math.cos(a), cy - ry * Math.sin(a)] as const;
  });
}

function line(a: Pt, b: Pt): Pt[] {
  const steps = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
  return Array.from({ length: steps + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps] as const);
}

/** 2차 베지어 */
function bend(p0: Pt, p1: Pt, p2: Pt): Pt[] {
  const steps = 16;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]] as const;
  });
}

/** 이어 붙이기 — 겹치는 점은 하나만 */
function join(...parts: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const part of parts) {
    for (const p of part) {
      const last = out[out.length - 1];
      if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.5) out.push(p);
    }
  }
  return out;
}

const deg = (a: number) => [Math.cos(rad(a)), Math.sin(rad(a))] as const;
const at = (cx: number, cy: number, r: number, a: number): Pt => [cx + r * deg(a)[0], cy - r * deg(a)[1]];

/** 0~9 의 획(쓰는 차례) */
export const DIGIT_STROKES: Readonly<Record<string, readonly (readonly Pt[])[]>> = {
  // 위에서 시작해 왼쪽으로 한 바퀴
  "0": [arc(50, 70, 32, 56, 90, 450)],
  // 위에서 아래로 곧게(업체처럼 깃발 없이)
  "1": [line([50, TOP], [50, BOTTOM])],
  // 위로 둥글게 넘어가 왼쪽 아래로 비스듬히, 아래 줄을 따라 오른쪽
  "2": [join(arc(50, 44, 30, 30, 160, -30), line(at(50, 44, 30, -30), [18, BOTTOM]), line([18, BOTTOM], [84, BOTTOM]))],
  // 위 배 → 가운데 → 아래 배
  "3": [join(arc(50, 41, 27, 27, 150, -90), arc(50, 97, 29, 29, 90, -150))],
  // 사선 내려와 가로로(↙ →), 그다음 세로(↓)
  "4": [join(line([48, TOP], [14, 90]), line([14, 90], [88, 90])), line([70, TOP], [70, BOTTOM])],
  // 세로 내려와 배를 둥글게, 그다음 위 가로 막대(→)
  "5": [join(line([26, TOP], [26, 62]), line([26, 62], at(48, 92, 31, 115)), arc(48, 92, 31, 31, 115, -150)), line([26, TOP], [80, TOP])],
  // 오른쪽 위에서 왼쪽으로 휘어 내려와 아래 동그라미
  "6": [join(bend([74, 16], [30, 22], [21, 92]), arc(50, 96, 29, 29, 180, 540))],
  // 위 가로 → 오른쪽에서 비스듬히 아래로
  "7": [join(line([18, TOP], [82, TOP]), line([82, TOP], [40, BOTTOM]))],
  // 위 동그라미 왼쪽 → 가운데에서 아래 동그라미 한 바퀴 → 위 동그라미 오른쪽으로 돌아 처음 자리
  "8": [join(arc(50, 41, 25, 27, 90, 270), arc(50, 97, 29, 29, 90, -270), arc(50, 41, 25, 27, -90, 90))],
  // 오른쪽에서 위로 동그라미 한 바퀴, 그다음 곧게 아래로
  "9": [join(arc(48, 42, 28, 28, 0, 360), line([76, 42], [74, BOTTOM]))],
};

/** 글자 하나하나를 옆으로 놓은 획(두 자리 수는 둘째 숫자를 오른쪽 칸으로) */
export function strokesOf(text: string): Pt[][] {
  return [...text].flatMap((ch, i) => (DIGIT_STROKES[ch] ?? []).map((s) => s.map(([x, y]) => [x + i * DIGIT_W, y] as const)));
}

/** 획의 누적 길이 — lens[i] = 첫 점에서 i 번째 점까지 */
export function lengthsOf(stroke: readonly Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < stroke.length; i++) out.push(out[i - 1] + Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1]));
  return out;
}

/** 획 위 s 자리의 점과 긋는 방향(라디안, 화면 기준 — 오른쪽 0, 아래 +) */
export function pointAt(stroke: readonly Pt[], lens: readonly number[], s: number): { p: Pt; angle: number } {
  const total = lens[lens.length - 1];
  const d = Math.max(0, Math.min(total, s));
  let i = 1;
  while (i < lens.length - 1 && lens[i] < d) i++;
  const a = stroke[i - 1];
  const b = stroke[i];
  const seg = lens[i] - lens[i - 1] || 1;
  const t = (d - lens[i - 1]) / seg;
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

/** 앞으로만 — 손끝을 지금 자리 조금 뒤 ~ 조금 앞 사이의 획에 비춰 본다(한 바퀴 도는 0·8 에서 건너뛰지 않게) */
const BACK = 6;
const AHEAD = 28;

/**
 * 손끝 p 로 획을 얼마나 그었나 — 길 위(TOLERANCE 안)면 더 간 만큼(뒤로는 안 간다), 길을 벗어났으면 그대로 + off.
 * 반환 s 는 새 자리(누적 길이).
 */
export function traceStep(stroke: readonly Pt[], lens: readonly number[], s: number, p: Pt): { s: number; off: boolean } {
  const lo = s - BACK;
  const hi = s + AHEAD;
  let best = Infinity;
  let bestS = s;
  for (let i = 1; i < stroke.length; i++) {
    if (lens[i] < lo || lens[i - 1] > hi) continue;
    const a = stroke[i - 1];
    const b = stroke[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    const q: Pt = [a[0] + dx * t, a[1] + dy * t];
    const dist = Math.hypot(p[0] - q[0], p[1] - q[1]);
    const along = Math.max(lo, Math.min(hi, lens[i - 1] + (lens[i] - lens[i - 1]) * t));
    if (dist < best) {
      best = dist;
      bestS = along;
    }
  }
  if (best > TOLERANCE) return { s, off: true };
  return { s: Math.max(s, bestS), off: false };
}

/** 획을 다 그었나 — 끝 조금 앞이면 다 그은 것으로 */
export function strokeDone(lens: readonly number[], s: number): boolean {
  return s >= lens[lens.length - 1] - 4;
}

/** SVG 경로 */
export function pathOf(stroke: readonly Pt[]): string {
  return stroke.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}
