'use client';

import { ReactNode } from 'react';
import Button from './ui/Button';
import Card, { CardHeader } from './ui/Card';
import { HuntingResults, HuntingStats } from '@/types/hunting';
import { formatClock, rawMesoPerMinute } from '@/lib/hunting';

interface ResultsPanelProps {
  stats: HuntingStats;
  results: HuntingResults;
  elapsedTime: number;
  onSave: () => void;
}

/** 메소는 자릿수가 커서 억/만 단위를 같이 보여 줘야 한눈에 크기가 잡힌다. */
const toKoreanUnit = (value: number) => {
  const abs = Math.abs(value);
  if (abs < 10_000) return null;

  const sign = value < 0 ? '-' : '';
  const eok = Math.floor(abs / 100_000_000);
  const man = Math.floor((abs % 100_000_000) / 10_000);

  if (eok > 0) return `${sign}${eok}억${man > 0 ? ` ${man.toLocaleString()}만` : ''}`;
  return `${sign}${man.toLocaleString()}만`;
};

const formatDuration = (seconds: number) => {
  const { hours, minutes, seconds: secs } = formatClock(seconds);
  return `${hours}:${minutes}:${secs}`;
};

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'accent' | 'gold';
}

const TONE_CLASS = {
  default: 'text-text',
  accent: 'text-accent',
  gold: 'text-gold',
} as const;

function StatTile({ label, value, hint, tone = 'default' }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-sunken px-3 py-2.5">
      <div className="text-[11px] font-medium text-subtle">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold leading-tight ${TONE_CLASS[tone]}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-subtle">{hint}</div>}
    </div>
  );
}

/**
 * 입력한 값이 어떻게 정산되는지 실시간으로 보여 주는 패널.
 *
 * 예전에는 중첩된 `<ul>` 안에 "총 획득: 123" 같은 줄이 열 몇 개 이어져 있어서, 정작
 * 중요한 분당 수익을 찾으려면 목록 전체를 읽어야 했다. 자주 보는 수치를 타일로 올리고
 * 나머지는 아래로 내렸다.
 */
export default function ResultsPanel({ stats, results, elapsedTime, onSave }: ResultsPanelProps) {
  const hasDuration = elapsedTime > 0;
  const endExpPercent = Math.min(100, Math.max(0, parseFloat(results.endExpPercentage) || 0));
  const itemValueTotal = results.itemStats.reduce((sum, item) => sum + item.value, 0);
  const netUnit = toKoreanUnit(results.netMesoGained);

  return (
    /*
      화면보다 길어지면 결과만 안에서 스크롤되고, 저장 버튼은 아래에 붙어 항상 보인다.
      버튼까지 같이 스크롤되면 값을 다 넣고도 저장을 찾아 내려가야 한다.
    */
    <Card padded={false} className="flex min-h-0 flex-col overflow-hidden">
      <div className="scrollbar-slim min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
        <CardHeader
          title="정산 결과"
          description={
            hasDuration ? (
              <>
                진행 시간 <span className="font-mono text-muted">{formatDuration(elapsedTime)}</span> 기준
              </>
            ) : (
              '진행 시간이 0이라 분당 수치는 계산되지 않습니다.'
            )
          }
        />

        {/* 레벨 진행 */}
        <div>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-text">
              Lv.{stats.startLevel || '—'}{' '}
              <span className="font-mono text-xs text-subtle">({results.startExpPercentage}%)</span>
            </span>
            <span className="text-subtle" aria-hidden="true">
              →
            </span>
            <span className="font-medium text-text">
              Lv.{stats.endLevel || '—'}{' '}
              <span className="font-mono text-xs text-subtle">({results.endExpPercentage}%)</span>
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
            role="img"
            aria-label={`종료 레벨 경험치 ${results.endExpPercentage}%`}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${endExpPercent}%` }}
            />
          </div>
          {results.levelDiff !== 0 && (
            <p className="mt-2 text-xs font-medium text-accent">
              {results.levelDiff > 0 ? `${results.levelDiff} 레벨 상승` : `${results.levelDiff} 레벨`}
            </p>
          )}
        </div>

        {/* 자주 보는 수치 */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="총 경험치"
            value={results.expGained.toLocaleString()}
          />
          <StatTile
            label="1분당 경험치"
            value={results.expPerMinute.toLocaleString()}
            tone="accent"
          />
          <StatTile
            label="총 순수익"
            value={results.netMesoGained.toLocaleString()}
            hint={netUnit ? `${netUnit} 메소` : '메소'}
          />
          <StatTile
            label="1분당 순수익"
            value={results.mesoPerMinute.toLocaleString()}
            hint="메소"
            tone="gold"
          />
        </div>

        {/* 순수익이 어떻게 나왔는지 */}
        <div className="space-y-1.5 rounded-xl border border-border px-3 py-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">순수 메소</span>
            <span className="font-mono text-text">{results.rawMesoGained.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">아이템 가치</span>
            <span className="font-mono text-text">
              {itemValueTotal > 0 ? '+' : ''}
              {itemValueTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5">
            <span className="font-medium text-text">순수익</span>
            <span className="font-mono font-semibold text-gold">
              {results.netMesoGained.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-subtle">
            <span>순수 메소 1분당</span>
            <span className="font-mono">
              {rawMesoPerMinute(results.rawMesoGained, elapsedTime).toLocaleString()}
            </span>
          </div>
        </div>

        {/* 아이템별 변동 */}
        {results.itemStats.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted">아이템별</h3>
            <ul className="space-y-1.5">
              {results.itemStats.map((item, index) => (
                <li
                  key={index}
                  className="flex items-baseline justify-between gap-3 rounded-lg bg-surface-sunken px-3 py-2 text-xs"
                >
                  <span className="min-w-0 truncate font-medium text-text">
                    {item.name || '이름 없음'}
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={`font-mono font-medium ${
                        item.diff > 0 ? 'text-success' : item.diff < 0 ? 'text-danger' : 'text-subtle'
                      }`}
                    >
                      {item.diff > 0 ? '+' : ''}
                      {item.diff.toLocaleString()}개
                    </span>
                    <span className="ml-2 font-mono text-subtle">
                      1분당 {Math.abs(item.perMinute).toLocaleString()}
                    </span>
                    <span className="block font-mono text-subtle">
                      {item.value.toLocaleString()} 메소
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      <div className="border-t border-border p-4">
        <Button variant="primary" size="lg" onClick={onSave} className="w-full">
          기록 저장
        </Button>
      </div>
    </Card>
  );
}
