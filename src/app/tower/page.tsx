"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 친구 집 짓기 — 모은 블록으로 숫자 친구 집을 짓는다(친구 숫자만큼 블록 = 한 집)
const TowerScreen = dynamic(() => import("@/components/tower/TowerScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <TowerScreen />;
}
