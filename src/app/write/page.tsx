"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 숫자 쓰기 — 1~20 따라 쓰기
const WriteScreen = dynamic(() => import("@/components/write/WriteScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <WriteScreen />;
}
