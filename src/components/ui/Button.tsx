'use client';

import { forwardRef } from 'react';

type Variant = 'primary' | 'success' | 'danger' | 'neutral' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

/**
 * 버튼 외형을 한곳에 모아 둔다.
 *
 * 예전에는 화면마다 `bg-blue-500 hover:bg-blue-600 ...` 을 손으로 적어서, 같은 무게의
 * 액션인데 화면마다 색과 크기가 달랐다. 색은 토큰만 쓴다.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-sm',
  success: 'bg-success text-white hover:bg-success-hover shadow-sm dark:text-[rgb(var(--accent-fg))]',
  danger: 'bg-danger text-white hover:bg-danger-hover shadow-sm dark:text-[rgb(var(--accent-fg))]',
  neutral:
    'bg-surface text-text border border-border hover:bg-surface-sunken hover:border-border-strong',
  ghost: 'text-muted hover:bg-surface-sunken hover:text-text',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'neutral', size = 'md', className = '', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center font-medium whitespace-nowrap
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50
        focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        disabled:opacity-45 disabled:pointer-events-none
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
});

export default Button;

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 스크린리더용 이름 겸 호버 툴팁 문구. */
  label: string;
  tone?: 'default' | 'accent' | 'success' | 'danger';
}

const TONES: Record<NonNullable<IconButtonProps['tone']>, string> = {
  default: 'text-subtle hover:text-text',
  accent: 'text-accent hover:text-accent-hover',
  success: 'text-success hover:text-success-hover',
  danger: 'text-danger hover:text-danger-hover',
};

/**
 * 아이콘만 있는 버튼. 툴팁은 네이티브 `title` 로 맡긴다 — 예전에는 직접 만든
 * 툴팁이 카드마다 세 개씩 떠서 터치 기기에서는 아예 뜨지 않았다.
 */
export function IconButton({
  label,
  tone = 'default',
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
        transition-colors hover:bg-surface-sunken
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50
        disabled:opacity-45 disabled:pointer-events-none
        ${TONES[tone]} ${className}`}
      {...props}
    />
  );
}
