"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 모험 지도 — 장 = 섬, 그 장의 5일 = 섬 안의 길
const MapScreen = dynamic(() => import("@/components/map/MapScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <MapScreen />;
}
