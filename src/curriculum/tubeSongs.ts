/**
 * 유튜브 노래 — 부모가 알려 준 공식 영상 중 유튜브가 퍼가기를 허락한 것만(oEmbed 로 확인). 앱에는 영상 번호와 이름만 적는다.
 * 틀 때는 유튜브가 주는 플레이어 그대로(lib/youtube) — 내려받지 않고, 플레이어를 숨기거나 가린 채 소리만 틀지 않는다(유튜브 약관).
 * 2026-10-29 사용자: 「넘버블럭스 - 한국 - Topic」의 「일」. 자동 믹스(주소의 list=RD…)는 넣지 않는다 — 다음 곡을 유튜브가 골라
 * 모르는 영상으로 흘러갈 수 있어서. 곡은 하나씩 여기에 적는다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export interface TubeSong {
  /** 유튜브 영상 번호(주소 watch?v= 뒤 11자) */
  id: string;
  /** 보이는 이름 — 숫자면 그 숫자 친구가 노래 그림(lib/songTitle) */
  title: string;
  /** 길이(초) — 목록에 「3:45」처럼. 모르면 비워 둔다 */
  seconds?: number;
}

export const TUBE_SONGS: readonly TubeSong[] = [{ id: "t3oy6Jrd5vc", title: "일", seconds: 225 }];

/** 노래 목록에서 한 줄을 가리키는 열쇠 — 폰에 넣은 파일 번호와 겹치지 않게 앞에 yt: */
export const tubeKey = (id: string): string => `yt:${id}`;

/** 노래 화면을 열면서 그 노래를 바로 튼다(홈 노래 풍선) */
export const songHref = (key: string): string => `/songs?play=${encodeURIComponent(key)}`;
