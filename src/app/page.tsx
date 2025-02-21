'use client';

import Timer from '@/components/Timer';
import StatsForm from '@/components/StatsForm';
import HuntingRecords from '@/components/HuntingRecords';
import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { HuntingRecord, HuntingStats } from '@/types/hunting';
import { Item } from '@/components/ItemManager';

const STORAGE_KEY = {
  RECORDS: 'maple-timer-records',
  STATS: 'maple-timer-stats',
  ITEMS: 'maple-timer-items',
  TIMER: 'maple-timer-state',
  NOTE: 'maple-timer-note'
};

interface TimerState {
  time: number;
  isRunning: boolean;
  targetTime: number | null;
  mode: 'stopwatch' | 'timer';
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [records, setRecords] = useState<HuntingRecord[]>([]);
  const [currentStats, setCurrentStats] = useState<HuntingStats | null>(null);
  const [currentItems, setCurrentItems] = useState<Item[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');

  // 모든 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 기록 데이터 로드
      const savedRecords = localStorage.getItem(STORAGE_KEY.RECORDS);
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }

      // 타이머 상태 로드
      const savedTimerState = localStorage.getItem(STORAGE_KEY.TIMER);
      if (savedTimerState) {
        try {
          const timerState: TimerState = JSON.parse(savedTimerState);
          setIsTimerRunning(timerState.isRunning);
          setTimerMode(timerState.mode);
          setTargetTime(timerState.targetTime);

          if (timerState.isRunning && timerState.targetTime) {
            const now = Date.now();
            if (timerState.mode === 'timer') {
              const remainingTime = Math.max(0, Math.floor((timerState.targetTime - now) / 1000));
              if (remainingTime <= 0) {
                // 타이머가 이미 종료된 상태면 조용히 초기화
                setIsTimerRunning(false);
                setTargetTime(null);
                setElapsedTime(0);
              } else {
                setElapsedTime(remainingTime);
              }
            } else {
              const elapsedSeconds = Math.floor((now - timerState.targetTime) / 1000);
              setElapsedTime(elapsedSeconds);
            }
          } else {
            setElapsedTime(timerState.time);
          }
        } catch (error) {
          console.error('Failed to parse timer state:', error);
        }
      }

      // 현재 통계 데이터 로드
      const savedStats = localStorage.getItem(STORAGE_KEY.STATS);
      if (savedStats) {
        setCurrentStats(JSON.parse(savedStats));
      }

      // 현재 아이템 데이터 로드
      const savedItems = localStorage.getItem(STORAGE_KEY.ITEMS);
      if (savedItems) {
        setCurrentItems(JSON.parse(savedItems));
      }

      // 노트 데이터 로드
      const savedNote = localStorage.getItem(STORAGE_KEY.NOTE);
      if (savedNote) {
        setCurrentNote(savedNote);
      }

      setIsLoading(false);
    }
  }, []);

  // 타이머 상태 저장
  useEffect(() => {
    if (!isLoading) {
      const timerState: TimerState = {
        time: elapsedTime,
        isRunning: isTimerRunning,
        targetTime,
        mode: timerMode
      };
      localStorage.setItem(STORAGE_KEY.TIMER, JSON.stringify(timerState));
    }
  }, [isLoading, elapsedTime, isTimerRunning, timerMode, targetTime]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY.RECORDS, JSON.stringify(records));
    }
  }, [records, isLoading]);

  const handleSaveRecord = (record: HuntingRecord) => {
    setRecords(prev => [record, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(record => record.id !== id));
  };

  const handleLoadRecord = (record: HuntingRecord) => {
    // 타이머 시간 설정
    setElapsedTime(record.duration);

    // 통계 데이터 설정
    setCurrentStats(record.stats);
    localStorage.setItem(STORAGE_KEY.STATS, JSON.stringify(record.stats));

    // 아이템 데이터 설정
    setCurrentItems(record.items);
    localStorage.setItem(STORAGE_KEY.ITEMS, JSON.stringify(record.items));

    // 노트 데이터 설정
    setCurrentNote(record.note);
    localStorage.setItem(STORAGE_KEY.NOTE, record.note);
  };

  const handleImportRecords = (newRecords: HuntingRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem(STORAGE_KEY.RECORDS, JSON.stringify(newRecords));
  };

  const handleClearAllRecords = () => {
    setRecords([]);
    localStorage.setItem(STORAGE_KEY.RECORDS, JSON.stringify([]));
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
            <div className="bg-white dark:bg-gray-800">
              <Timer
                onTimeUpdate={setElapsedTime}
                initialTime={elapsedTime}
                isRunning={isTimerRunning}
                onRunningChange={setIsTimerRunning}
                mode={timerMode}
                onModeChange={setTimerMode}
                targetTime={targetTime}
                onTargetTimeChange={setTargetTime}
              />
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">사냥 기록 목록</h2>
              <HuntingRecords
                records={records}
                onDelete={handleDeleteRecord}
                onLoad={handleLoadRecord}
                onImport={handleImportRecords}
                onClearAll={handleClearAllRecords}
              />
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <StatsForm
              elapsedTime={elapsedTime}
              onSave={handleSaveRecord}
              initialStats={currentStats}
              initialItems={currentItems}
              initialNote={currentNote}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
