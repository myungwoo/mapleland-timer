import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '@/constants/storage';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "메이플랜드 사냥 타이머",
  description: "메이플랜드 사냥 기록 및 타이머",
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
