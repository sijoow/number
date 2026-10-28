"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 블록 탑 — 모은 블록을 쌓아 층마다 숫자 친구가 이사 온다
const TowerScreen = dynamic(() => import("@/components/tower/TowerScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <TowerScreen />;
}
