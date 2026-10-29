"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 생각 놀이 — 업체 「사고력 세상」 Lv.1 을 우리 그림으로
const ThinkScreen = dynamic(() => import("@/components/think/ThinkScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <ThinkScreen />;
}
