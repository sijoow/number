import type { Metadata, Viewport } from "next";
import { AuthGate } from "@/components/auth/AuthGate";
// 프리텐다드(app/fonts) — 글자 조각별 파일, 화면에 나온 글자만 내려받는다
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "하온이의 숫자놀이",
  description: "우리 아이 숫자 놀이 — 숫자 친구들과 하나부터 스물까지",
  appleWebApp: { capable: true, title: "숫자놀이", statusBarStyle: "default" },
  // 아이콘은 app/icon.png(숫자 친구 1 얼굴, public/img/app-icon.png 사본 — 한글나라와 같은 방식)
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 아이가 두 손가락으로 화면을 키우다 길을 잃지 않게
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fff8ee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="h-full">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
