'use client';

import { useState, useRef } from 'react';
import { HuntingRecord } from '@/types/hunting';
import Button, { IconButton } from './ui/Button';
import { useDialog } from './ui/Dialog';
import { normalizeRecords } from '@/lib/hunting';

interface HuntingRecordsProps {
  records: HuntingRecord[];
  onDelete: (id: string) => void;
  onLoad: (record: HuntingRecord) => void;
  onImport: (records: HuntingRecord[]) => void;
  onClearAll: () => void;
}

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}시간 ${minutes}분 ${secs}초`;
};

export default function HuntingRecords({ records, onDelete, onLoad, onImport, onClearAll }: HuntingRecordsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialog = useDialog();

  const filteredRecords = records.filter(record => {
    const query = searchQuery.toLowerCase();
    return record.location.toLowerCase().includes(query) ||
           (record.note && record.note.toLowerCase().includes(query));
  });

  const copyToClipboard = async (record: HuntingRecord) => {
    const formattedRecord = `
[메이플랜드 사냥 기록]
시간: ${formatDate(record.timestamp)}
장소: ${record.location}
진행 시간: ${formatDuration(record.duration)}
${record.note ? `\n메모: ${record.note}` : ''}

레벨: Lv.${record.stats.startLevel} (${record.results.startExpPercentage}%) → Lv.${record.stats.endLevel} (${record.results.endExpPercentage}%)
레벨 상승: ${record.results.levelDiff} 레벨

경험치
- 총 획득: ${record.results.expGained.toLocaleString()}
- 1분당: ${record.results.expPerMinute.toLocaleString()}

메소
- 순수 획득: ${record.results.rawMesoGained.toLocaleString()} 메소
- 총 순수익: ${record.results.netMesoGained.toLocaleString()} 메소
- 1분당: ${record.results.mesoPerMinute.toLocaleString()} 메소

${record.results.itemStats.length > 0 ? `아이템 변동:
${record.results.itemStats.map(item => `- ${item.name}: ${item.diff > 0 ? '+' : ''}${item.diff.toLocaleString()}개 (1분당 ${item.perMinute.toFixed(2)}개)
  가치: ${item.value.toLocaleString()} 메소`).join('\n')}` : ''}`;

    try {
      await navigator.clipboard.writeText(formattedRecord);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(records, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maple-timer-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      let importedRecords: HuntingRecord[];
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error('기록 배열이 아닙니다.');
        // 예전에 내보낸 파일은 5분당 값을 담고 있다.
        importedRecords = normalizeRecords(parsed);
      } catch (error) {
        console.error('Failed to parse records:', error);
        await dialog.alert({
          title: '파일을 읽지 못했습니다',
          description: '내보내기로 받은 JSON 파일인지 확인해 주세요.',
        });
        return;
      }

      // 예전에는 확인창의 "취소" 가 곧 전체 교체였다. 두 갈래 버튼에 세 갈래 뜻을 담느라
      // 문구를 잘못 읽으면 저장된 기록이 통째로 사라졌고, 서버가 없어 되돌릴 수도 없었다.
      const mode = await dialog.ask<'append' | 'replace' | 'cancel'>({
        title: `기록 ${importedRecords.length}건을 불러옵니다`,
        description:
          records.length > 0
            ? `지금 저장된 기록은 ${records.length}건입니다. 어떻게 할까요?`
            : undefined,
        cancelValue: 'cancel',
        choices:
          records.length > 0
            ? [
                { value: 'cancel', label: '취소', tone: 'neutral' },
                { value: 'replace', label: '모두 교체', tone: 'danger' },
                { value: 'append', label: '기존에 추가', tone: 'primary' },
              ]
            : [
                { value: 'cancel', label: '취소', tone: 'neutral' },
                { value: 'append', label: '불러오기', tone: 'primary' },
              ],
      });

      if (mode === 'append') onImport([...records, ...importedRecords]);
      else if (mode === 'replace') onImport(importedRecords);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="neutral" onClick={() => fileInputRef.current?.click()}>
          불러오기
        </Button>
        <Button size="sm" variant="neutral" onClick={handleExport} disabled={records.length === 0}>
          내보내기
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-danger hover:text-danger-hover"
          disabled={records.length === 0}
          onClick={async () => {
            const confirmed = await dialog.confirm({
              title: `기록 ${records.length}건을 모두 삭제할까요?`,
              description: '되돌릴 수 없습니다. 남겨 두려면 먼저 내보내기로 파일을 받아 두세요.',
              confirmLabel: '모두 삭제',
              tone: 'danger',
            });
            if (confirmed) onClearAll();
          }}
        >
          모두 삭제
        </Button>
      </div>

      {records.length > 0 && (
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="사냥터 또는 노트로 검색"
            aria-label="기록 검색"
            className="field field-sunken pl-9"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
      )}

      {records.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-subtle">
          저장된 사냥 기록이 없습니다.
          <br />
          정산 결과에서 <span className="text-muted">기록 저장</span>을 누르면 여기에 쌓입니다.
        </p>
      ) : filteredRecords.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-subtle">
          &lsquo;{searchQuery}&rsquo; 와 맞는 기록이 없습니다.
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredRecords.map(record => {
            const expanded = expandedId === record.id;
            return (
              <li
                key={record.id}
                className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong"
              >
                <div className="flex flex-col gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : record.id)}
                    aria-expanded={expanded}
                    className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
                  >
                    <div className="flex items-baseline gap-2">
                      <h3 className="truncate text-sm font-semibold text-text">{record.location}</h3>
                      <span className="shrink-0 font-mono text-[11px] text-subtle">
                        {formatDuration(record.duration)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-subtle">{formatDate(record.timestamp)}</p>

                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="text-subtle">EXP/분</dt>
                        <dd className="font-mono font-medium text-accent">
                          {record.results.expPerMinute.toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="text-subtle">수익/분</dt>
                        <dd className="font-mono font-medium text-gold">
                          {record.results.mesoPerMinute.toLocaleString()}
                        </dd>
                      </div>
                    </dl>

                    {record.note && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted">{record.note}</p>
                    )}
                  </button>

                  <div className="flex items-center justify-end gap-0.5 border-t border-border pt-1.5">
                    <IconButton
                      className="h-8 w-8"
                      label="이 기록 불러오기"
                      tone="success"
                      onClick={async () => {
                        const confirmed = await dialog.confirm({
                          title: `'${record.location}' 기록을 불러올까요?`,
                          description: '지금 입력 중인 내용이 이 기록의 값으로 바뀝니다. 저장된 기록은 그대로입니다.',
                          confirmLabel: '불러오기',
                          tone: 'primary',
                        });
                        if (confirmed) onLoad(record);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                    </IconButton>
                    <IconButton
                      className="h-8 w-8"
                      label={copiedId === record.id ? '복사됨' : '텍스트로 복사'}
                      tone={copiedId === record.id ? 'success' : 'accent'}
                      onClick={() => copyToClipboard(record)}
                    >
                      {copiedId === record.id ? (
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                        </svg>
                      )}
                    </IconButton>
                    <IconButton
                      className="h-8 w-8"
                      label="이 기록 삭제"
                      tone="danger"
                      onClick={async () => {
                        const confirmed = await dialog.confirm({
                          title: `'${record.location}' 기록을 삭제할까요?`,
                          description: '되돌릴 수 없습니다.',
                          confirmLabel: '삭제',
                          tone: 'danger',
                        });
                        if (confirmed) onDelete(record.id);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </IconButton>
                  </div>
                </div>

                {expanded && (
                  <div className="space-y-3 border-t border-border px-3 py-3 text-xs">
                    <div>
                      <div className="mb-1 font-semibold text-muted">레벨</div>
                      <p className="text-text">
                        Lv.{record.stats.startLevel} ({record.results.startExpPercentage}%) → Lv.
                        {record.stats.endLevel} ({record.results.endExpPercentage}%)
                        <span className="ml-2 text-accent">{record.results.levelDiff} 레벨</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="text-subtle">총 경험치</span>
                        <span className="font-mono text-text">{record.results.expGained.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-subtle">순수 메소</span>
                        <span className="font-mono text-text">{record.results.rawMesoGained.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-subtle">총 순수익</span>
                        <span className="font-mono text-gold">{record.results.netMesoGained.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-subtle">수익/분</span>
                        <span className="font-mono text-gold">{record.results.mesoPerMinute.toLocaleString()}</span>
                      </div>
                    </div>

                    {record.results.itemStats.length > 0 && (
                      <div>
                        <div className="mb-1 font-semibold text-muted">아이템</div>
                        <ul className="space-y-1">
                          {record.results.itemStats.map((item, index) => (
                            <li key={index} className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-text">{item.name || '이름 없음'}</span>
                              <span className="shrink-0 font-mono text-subtle">
                                <span className={item.diff > 0 ? 'text-success' : item.diff < 0 ? 'text-danger' : ''}>
                                  {item.diff > 0 ? '+' : ''}
                                  {item.diff.toLocaleString()}개
                                </span>
                                {' · '}
                                {item.value.toLocaleString()} 메소
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
