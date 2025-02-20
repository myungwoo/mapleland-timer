'use client';

import Timer from '@/components/Timer';
import StatsForm from '@/components/StatsForm';
import HuntingRecords from '@/components/HuntingRecords';
import { useState, useEffect } from 'react';
import { HuntingRecord } from '@/types/hunting';

const STORAGE_KEY = 'maple-timer-records';

export default function Home() {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [records, setRecords] = useState<HuntingRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const savedRecords = localStorage.getItem(STORAGE_KEY);
      return savedRecords ? JSON.parse(savedRecords) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const handleSaveRecord = (record: HuntingRecord) => {
    setRecords(prev => [record, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(record => record.id !== id));
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">메이플랜드 사냥 타이머</h1>
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8">
          <div className="space-y-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <Timer onTimeUpdate={setElapsedTime} />
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">사냥 기록 목록</h2>
              <HuntingRecords records={records} onDelete={handleDeleteRecord} />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <StatsForm elapsedTime={elapsedTime} onSave={handleSaveRecord} />
          </div>
        </div>
      </div>
    </main>
  );
}
