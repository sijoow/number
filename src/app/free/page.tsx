"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 놀이터 — 진도에 따라 열린 놀이를 언제든
const FreeScreen = dynamic(() => import("@/components/free/FreeScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <FreeScreen />;
}
