'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { IconButton } from './Button';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/**
 * 오른쪽에서 밀려 나오는 패널. 기록 목록처럼 늘 보일 필요는 없지만 자주 여는 것들을 담는다.
 *
 * 좁은 화면에서는 화면을 꽉 채운다 — 폰에서 기록을 볼 때 옆에 남는 배경은 쓸모가 없다.
 */
export default function Drawer({ open, onClose, title, description, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // 확인창이 이 위에 떠 있으면 Esc 는 그쪽 몫이다. 여기까지 처리하면 확인창을 물리는
      // 김에 서랍까지 닫혀 버린다.
      if ((event.target as Element | null)?.closest?.('[data-dialog-layer]')) return;
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    // 패널이 떠 있는 동안 뒤 화면이 같이 스크롤되지 않게 막는다.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex h-full w-full animate-slide-in-right flex-col border-l border-border
          bg-bg shadow-overlay outline-none sm:max-w-[30rem]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-text">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}
          </div>
          <IconButton label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </header>
        <div className="scrollbar-slim flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
