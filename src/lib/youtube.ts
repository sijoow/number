/**
 * 유튜브 플레이어 — 유튜브가 주는 공식 IFrame Player API 를 한 번만 불러온다(curriculum/tubeSongs 노래를 틀 때, 2026-10-29 사용자).
 * 약관대로: 플레이어는 보이게(200×200 이상, 위에 아무것도 덮지 않는다), 아이가 눌러서 튼다. 영상에서 소리만 꺼내 틀지 않는다.
 * 플레이어는 쿠키를 덜 쓰는 youtube-nocookie 주소로 띄운다(아이 앱). 인터넷이 없으면 불러오기가 실패한다.
 */

/** 플레이어 상태 번호(유튜브) */
export const TUBE = { ended: 0, playing: 1, paused: 2, buffering: 3 } as const;

export interface TubePlayer {
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface TubeEvent {
  target: TubePlayer;
  data: number;
}

interface TubeApi {
  Player: new (
    el: HTMLElement,
    opts: {
      host?: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: TubeEvent) => void;
        onStateChange?: (e: TubeEvent) => void;
        onError?: (e: TubeEvent) => void;
      };
    },
  ) => TubePlayer;
}

declare global {
  interface Window {
    YT?: TubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<TubeApi> | null = null;

/** 플레이어 스크립트 — 한 번만 불러온다. 12초 안에 안 오면(인터넷 없음) 실패, 다음에 다시 시도 */
export function loadTube(): Promise<TubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  loading ??= new Promise<TubeApi>((resolve, reject) => {
    const fail = () => {
      loading = null;
      reject(new Error("youtube"));
    };
    const before = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      before?.();
      if (window.YT?.Player) resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      s.remove();
      fail();
    };
    document.head.append(s);
    window.setTimeout(() => {
      if (!window.YT?.Player) fail();
    }, 12000);
  });
  return loading;
}
