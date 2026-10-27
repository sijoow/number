"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 숫자 친구 — 만난 친구 앨범
const FriendsScreen = dynamic(() => import("@/components/friends/FriendsScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <FriendsScreen />;
}
