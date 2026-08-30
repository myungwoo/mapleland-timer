import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
// 한글까지 한 벌로 덮는 본문 폰트. dynamic-subset 이라 unicode-range 로 92 조각으로
// 갈려 있고, 실제로는 화면에 뜬 글자가 든 조각만 받는다. next/font 는 unicode-range 를
// 다루지 못해 @font-face 를 직접 쓴다 — 대신 src/ 안에 둬서 webpack 이 url() 을
// basePath 붙은 경로로 다시 쓰게 한다(public/ 에 두면 경로가 배포처에 묶인다).
import "./fonts/pretendard.css";
import "./globals.css";
import {
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '@/constants/storage';

// 타이머 숫자와 정산 수치용. 자릿수가 늘어도 폭이 흔들리지 않아야 한다.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "메이플랜드 사냥 타이머",
  description: "메이플랜드 사냥 기록 및 타이머",
};

export const viewport: Viewport = {
  // 폰에서 한 손으로 쓰는 화면이라 주소창 색까지 테마를 따라가게 한다.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090b11" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // 첫 페인트 전에 테마를 정해 색이 튀는 것을 막는다.
            // 키는 사이트 전체가 공유한다(mapleland.myungwoo.kr 의 유틸들이 같은 값을 쓴다).
            // 새 키가 비어 있으면 접두어 없던 예전 키에서 한 번 옮겨 오고,
            // 'system' 과 알 수 없는 값은 시스템 설정으로 취급한다.
            __html: `
              try {
                var k = '${THEME_STORAGE_KEY}';
                var t = localStorage.getItem(k);
                if (t === null) {
                  t = localStorage.getItem('${LEGACY_THEME_STORAGE_KEY}');
                  if (t !== null) localStorage.setItem(k, t);
                }
                var dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', dark)
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${jetbrainsMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
