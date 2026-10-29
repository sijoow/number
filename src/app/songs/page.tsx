"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 노래 — 부모가 이 폰에 넣어 둔 노래 듣기(파일은 기기에만)
const SongsScreen = dynamic(() => import("@/components/songs/SongsScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <SongsScreen />;
}
