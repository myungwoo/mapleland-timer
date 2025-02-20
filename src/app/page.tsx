'use client';

import Timer from '@/components/Timer';
import StatsForm from '@/components/StatsForm';
import HuntingRecords from '@/components/HuntingRecords';
import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { HuntingRecord } from '@/types/hunting';

const STORAGE_KEY = 'maple-timer-records';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [records, setRecords] = useState<HuntingRecord[]>([]);

  // 모든 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRecords = localStorage.getItem(STORAGE_KEY);
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  }, [records, isLoading]);

  const handleSaveRecord = (record: HuntingRecord) => {
    setRecords(prev => [record, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(record => record.id !== id));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <ThemeToggle />
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">데이터를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <ThemeToggle />
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">메이플랜드 사냥 타이머</h1>
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8">
          <div className="space-y-8">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <Timer onTimeUpdate={setElapsedTime} />
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">사냥 기록 목록</h2>
              <HuntingRecords records={records} onDelete={handleDeleteRecord} />
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <StatsForm elapsedTime={elapsedTime} onSave={handleSaveRecord} />
          </div>
        </div>
      </div>
    </main>
  );
}
