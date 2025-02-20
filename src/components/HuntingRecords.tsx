'use client';

import { useState, useRef } from 'react';
import { HuntingRecord } from '@/types/hunting';

interface HuntingRecordsProps {
  records: HuntingRecord[];
  onDelete: (id: string) => void;
  onLoad: (record: HuntingRecord) => void;
  onImport: (records: HuntingRecord[]) => void;
  onClearAll: () => void;
}

export default function HuntingRecords({ records, onDelete, onLoad, onImport, onClearAll }: HuntingRecordsProps) {
  const [selectedRecord, setSelectedRecord] = useState<HuntingRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}시간 ${minutes}분 ${secs}초`;
  };

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
- 5분당: ${record.results.expPerFiveMin.toLocaleString()}

메소
- 순수 획득: ${record.results.rawMesoGained.toLocaleString()} 메소
- 총 순수익: ${record.results.netMesoGained.toLocaleString()} 메소
- 5분당: ${record.results.mesoPerFiveMin.toLocaleString()} 메소

${record.results.itemStats.length > 0 ? `아이템 변동:
${record.results.itemStats.map(item => `- ${item.name}: ${item.diff > 0 ? '+' : ''}${item.diff.toLocaleString()}개 (5분당 ${item.perFiveMin.toFixed(2)}개)
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
    reader.onload = (e) => {
      try {
        const importedRecords = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedRecords)) {
          if (window.confirm('기존 기록에 추가하시겠습니까?\n취소를 선택하면 기존 기록이 삭제됩니다.')) {
            onImport([...records, ...importedRecords]);
          } else {
            onImport(importedRecords);
          }
        }
      } catch (error) {
        console.error('Failed to parse records:', error);
        alert('파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  if (records.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            기록 불러오기
          </button>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          저장된 사냥 기록이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            if (window.confirm('모든 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
              onClearAll();
            }
          }}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          모든 기록 삭제
        </button>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            기록 불러오기
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            기록 내보내기
          </button>
        </div>
      </div>
      <div className="grid gap-4">
        {records.map(record => (
          <div
            key={record.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedRecord(record === selectedRecord ? null : record)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{record.location}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(record.timestamp)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">진행 시간: {formatDuration(record.duration)}</p>
                {record.note && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">
                    {record.note}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('이 기록의 데이터를 불러오시겠습니까?\n현재 입력된 데이터는 사라집니다.')) {
                      onLoad(record);
                    }
                  }}
                  className="relative group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="기록 불러오기"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500 dark:text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    기록 불러오기
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(record);
                  }}
                  className="relative group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="기록 복사"
                >
                  {copiedId === record.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500 dark:text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500 dark:text-blue-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                  )}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {copiedId === record.id ? '복사됨!' : '기록 복사'}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('이 기록을 삭제하시겠습니까?')) {
                      onDelete(record.id);
                    }
                  }}
                  className="relative group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="기록 삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500 dark:text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    기록 삭제
                  </span>
                </button>
              </div>
            </div>

            {selectedRecord?.id === record.id && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3 text-sm">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">레벨</div>
                  <p className="text-gray-700 dark:text-gray-300">Lv.{record.stats.startLevel} ({record.results.startExpPercentage}%) → Lv.{record.stats.endLevel} ({record.results.endExpPercentage}%)</p>
                  <p className="text-blue-600 dark:text-blue-400">총 {record.results.levelDiff} 레벨 상승</p>
                </div>

                <div>
                  <div className="font-medium text-gray-900 dark:text-white">경험치</div>
                  <p className="text-gray-700 dark:text-gray-300">총 획득: {record.results.expGained.toLocaleString()}</p>
                  <p className="text-gray-700 dark:text-gray-300">5분당: {record.results.expPerFiveMin.toLocaleString()}</p>
                </div>

                <div>
                  <div className="font-medium text-gray-900 dark:text-white">메소</div>
                  <p className="text-gray-700 dark:text-gray-300">총 획득: {record.results.rawMesoGained.toLocaleString()} 메소</p>
                  <p className="text-gray-700 dark:text-gray-300">순수익: {record.results.netMesoGained.toLocaleString()} 메소</p>
                  <p className="text-gray-700 dark:text-gray-300">5분당: {record.results.mesoPerFiveMin.toLocaleString()} 메소</p>
                </div>

                {record.results.itemStats.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">아이템</div>
                    <ul className="ml-4 space-y-2">
                      {record.results.itemStats.map((item, index) => (
                        <li key={index}>
                          <div className="font-medium text-gray-700 dark:text-gray-300">{item.name}</div>
                          <p className="text-gray-700 dark:text-gray-300">총 {item.diff > 0 ? '획득' : '사용'}: {Math.abs(item.diff).toLocaleString()}개</p>
                          <p className="text-gray-700 dark:text-gray-300">5분당: {Math.abs(item.perFiveMin).toLocaleString()}개</p>
                          <p className="text-gray-500 dark:text-gray-400">가치: {item.value.toLocaleString()} 메소</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}