'use client';

import { useState } from 'react';
import { HuntingRecord } from '@/types/hunting';

interface HuntingRecordsProps {
  records: HuntingRecord[];
  onDelete: (id: string) => void;
}

export default function HuntingRecords({ records, onDelete }: HuntingRecordsProps) {
  const [selectedRecord, setSelectedRecord] = useState<HuntingRecord | null>(null);

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

  if (records.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        저장된 사냥 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('이 기록을 삭제하시겠습니까?')) {
                    onDelete(record.id);
                  }
                }}
                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm"
              >
                삭제
              </button>
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