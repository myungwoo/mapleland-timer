'use client';

import ThemeToggle from './ThemeToggle';
import Button from './ui/Button';
import { formatClock } from '@/lib/hunting';

interface AppHeaderProps {
  elapsedTime: number;
  isRunning: boolean;
  mode: 'stopwatch' | 'timer';
  recordCount: number;
  onOpenRecords: () => void;
}

/**
 * 화면 위에 붙어 있는 헤더.
 *
 * 폰에서는 입력 폼이 길어서 스크롤을 내리면 타이머가 화면 밖으로 나간다. 측정 중일 때만
 * 여기에 시계를 띄워, 아래쪽에서 수치를 적는 동안에도 시간이 보이게 한다.
 */
export default function AppHeader({
  elapsedTime,
  isRunning,
  mode,
  recordCount,
  onOpenRecords,
}: AppHeaderProps) {
  const { hours, minutes, seconds } = formatClock(elapsedTime);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <h1 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-text">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.9} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
          <span className="truncate">메이플랜드 사냥 타이머</span>
        </h1>

        {isRunning && (
          <span
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1
              font-mono text-sm font-semibold tabular-nums text-success sm:ml-4"
            aria-live="off"
            title={mode === 'timer' ? '남은 시간' : '경과 시간'}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
            {hours}:{minutes}:{seconds}
          </span>
        )}

        <div className={`flex items-center gap-1 ${isRunning ? '' : 'ml-auto'}`}>
          <Button size="sm" variant="neutral" onClick={onOpenRecords}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className="hidden sm:inline">기록</span>
            {recordCount > 0 && (
              <span className="rounded-md bg-surface-sunken px-1.5 font-mono text-[11px] text-muted">
                {recordCount}
              </span>
            )}
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
