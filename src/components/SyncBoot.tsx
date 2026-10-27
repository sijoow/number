"use client";

import { useEffect } from "react";
import { startFamily } from "@/lib/family";
import { startSync } from "@/lib/sync";

/** 앱이 뜨면 MongoDB 와 진도를 맞추고, 한글나라 설정을 받아 온다 — 화면에는 아무것도 그리지 않는다 */
export function SyncBoot() {
  useEffect(() => {
    startSync();
    startFamily();
  }, []);
  return null;
}
