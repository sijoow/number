/**
 * 성우 — Typecast 목소리. 소리 파일은 목소리마다 따로 구워 둔다(scripts/typecast.mts).
 * 어느 성우로 읽을지는 한글나라 설정(settings.voice)을 따른다(lib/hangul) — 두 앱이 같은 목소리로 들린다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export const VOICES = [
  { id: "minjeong", name: "민정" },
  { id: "sua", name: "수아" },
] as const;

export type VoiceId = (typeof VOICES)[number]["id"];

// 한글나라와 같이 수아 한 목소리로 굽는다(2026-10-26 사용자 선택)
export const DEFAULT_VOICE: VoiceId = "sua";

export function isVoiceId(v: unknown): v is VoiceId {
  return VOICES.some((x) => x.id === v);
}
