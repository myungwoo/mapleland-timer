import type { Config } from "tailwindcss";
import formsPlugin from '@tailwindcss/forms';

/** globals.css 의 `--x` 토큰을 투명도 유틸(`bg-accent/10`)까지 되는 색으로 만든다. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: {
          DEFAULT: token('surface'),
          sunken: token('surface-sunken'),
        },
        border: {
          DEFAULT: token('border'),
          strong: token('border-strong'),
        },
        text: {
          DEFAULT: token('text'),
          muted: token('text-muted'),
          subtle: token('text-subtle'),
        },
        muted: token('text-muted'),
        subtle: token('text-subtle'),
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          fg: token('accent-fg'),
        },
        gold: {
          DEFAULT: token('gold'),
          strong: token('gold-strong'),
        },
        success: {
          DEFAULT: token('success'),
          hover: token('success-hover'),
        },
        danger: {
          DEFAULT: token('danger'),
          hover: token('danger-hover'),
        },
        ring: token('ring'),
      },
      fontFamily: {
        // 본문은 Pretendard 한 벌로 라틴과 한글을 모두 덮는다(@font-face 는
        // src/app/fonts/pretendard.css). OS 기본 한글 폰트로 새지 않아 윈도우에서
        // 굴림으로 보이던 문제가 없고, 어느 OS 에서나 같은 서체로 보인다.
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
        // 숫자는 자릿수 폭이 고정된 JetBrains Mono 를 유지한다. 한글은 여기에 없으므로
        // 글자 단위 대체로 Pretendard 가 받는다 — monospace(굴림체)까지 내려가면 안 된다.
        mono: ['var(--font-mono)', 'Pretendard Variable', 'ui-monospace', 'monospace'],
      },
      borderColor: {
        DEFAULT: token('border'),
      },
      boxShadow: {
        // 그림자를 얕게 깔고 경계는 테두리로 잡는다. 다크에서 그림자는 거의 보이지 않으므로
        // 카드 구분은 테두리가 맡는다.
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        lifted: '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
        overlay: '0 20px 50px -12px rgb(15 23 42 / 0.35)',
      },
      keyframes: {
        flash: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgb(var(--danger) / 0.85)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
      },
      animation: {
        flash: 'flash 0.5s cubic-bezier(0.4, 0, 0.6, 1) 3',
        'slide-in-right': 'slide-in-right 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        // 나가는 동안 마지막 프레임에 머물러야 사라지기 직전에 튀지 않는다.
        'slide-out-right': 'slide-out-right 0.18s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'fade-in': 'fade-in 0.18s ease-out',
        'fade-out': 'fade-out 0.18s ease-out forwards',
      },
    },
  },
  plugins: [
    formsPlugin,
  ],
};
export default config;
