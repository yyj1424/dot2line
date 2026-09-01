import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DOT2LINE | 기준정보부터 창고·배송까지, 하나로 연결하는 물류 플랫폼",
  description:
    "MDM(기준정보), WMS(창고관리), TMS(배송관리)를 하나로 연결한 물류 통합 플랫폼 DOT2LINE. 지금 무료로 시작해보세요.",
  openGraph: {
    title: "DOT2LINE | 물류의 선형적 가치를 만듭니다",
    description:
      "기준정보(MDM)부터 창고(WMS), 배송(TMS), 정산까지 끊김 없이 연결하는 물류 통합 플랫폼",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
