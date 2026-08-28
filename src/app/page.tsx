'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import AppHeader from '@/components/AppHeader';
import Timer from '@/components/Timer';
import StatsForm from '@/components/StatsForm';
import ResultsPanel from '@/components/ResultsPanel';
import HuntingRecords from '@/components/HuntingRecords';
import Drawer from '@/components/ui/Drawer';
import { DialogProvider } from '@/components/ui/Dialog';
import { HuntingRecord, HuntingStats } from '@/types/hunting';
import { Item } from '@/components/ItemManager';
import { STORAGE_KEY, migrateLegacyStorageKeys } from '@/constants/storage';
import { DEFAULT_RATE, EMPTY_STATS, calculateResults, readRate, type RateMinutes } from '@/lib/hunting';

interface TimerState {
  time: number;
  isRunning: boolean;
  targetTime: number | null;
  mode: 'stopwatch' | 'timer';
  /**
   * 타이머가 끝났는데 아직 확인하지 않았다면 그 시각. 확인하면 null 이 된다.
   *
   * 저장해 두는 이유는 자리를 비운 사이 끝난 경우 때문이다 — 예전에는 다시 열면 조용히
   * 0 으로 돌아가서, 끝났다는 사실 자체를 알 방법이 없었다. 이 필드가 없던 시절에 저장된
   * 값은 undefined 로 읽혀 '알릴 것 없음' 이 된다.
   */
  finishedAt?: number | null;
}

/** layout.tsx 의 metadata.title 과 같다. 알림 때 제목을 바꿨다가 되돌리는 기준. */
const BASE_TITLE = '메이플랜드 사냥 타이머';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [records, setRecords] = useState<HuntingRecord[]>([]);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  // 타이머가 끝났는데 아직 확인하지 않았으면 그 시각.
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [rate, setRate] = useState<RateMinutes>(DEFAULT_RATE);

  // 입력 중인 한 판. 폼과 결과 패널이 같은 값을 봐야 해서 여기서 들고 있는다.
  const [stats, setStats] = useState<HuntingStats>(EMPTY_STATS);
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState<string>('');

  // 모든 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 접두어 없던 예전 키에 남은 기록을 먼저 옮겨 온다.
      migrateLegacyStorageKeys();

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
              const remainingTime = Math.max(0, Math.ceil((timerState.targetTime - now) / 1000));
              if (remainingTime <= 0) {
                // 자리를 비운 사이 끝났다. 조용히 지우지 않고 끝난 시각을 남겨 알린다.
                setIsTimerRunning(false);
                setTargetTime(null);
                setElapsedTime(0);
                setFinishedAt(timerState.targetTime);
              } else {
                setElapsedTime(remainingTime);
              }
            } else {
              const elapsedSeconds = Math.floor((now - timerState.targetTime) / 1000);
              setElapsedTime(elapsedSeconds);
            }
          } else {
            setElapsedTime(timerState.time);
            setFinishedAt(timerState.finishedAt ?? null);
          }
        } catch (error) {
          console.error('Failed to parse timer state:', error);
        }
      }

      // 입력 중이던 한 판
      const savedStats = localStorage.getItem(STORAGE_KEY.STATS);
      if (savedStats) {
        setStats({ ...EMPTY_STATS, ...JSON.parse(savedStats) });
      }

      const savedItems = localStorage.getItem(STORAGE_KEY.ITEMS);
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }

      const savedNote = localStorage.getItem(STORAGE_KEY.NOTE);
      if (savedNote) {
        setNote(savedNote);
      }

      setRate(readRate());

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
        mode: timerMode,
        finishedAt,
      };
      localStorage.setItem(STORAGE_KEY.TIMER, JSON.stringify(timerState));
    }
  }, [isLoading, elapsedTime, isTimerRunning, timerMode, targetTime, finishedAt]);

  /**
   * 끝난 걸 확인할 때까지 탭 제목에 남긴다.
   *
   * 사냥 중에는 게임 창을 보고 있어서 화면 안 신호는 눈에 들어오지 않는다. 탭 제목은
   * 권한을 물어보지 않고도 창 밖에서 보이는 유일한 자리다.
   */
  useEffect(() => {
    if (finishedAt === null) return;
    document.title = `⏰ 시간 종료 · ${BASE_TITLE}`;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [finishedAt]);

  const handleTimerFinished = useCallback(() => setFinishedAt(Date.now()), []);
  const handleAcknowledgeFinish = useCallback(() => setFinishedAt(null), []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY.RECORDS, JSON.stringify(records));
    }
  }, [records, isLoading]);

  // 입력 중인 값도 그대로 남긴다. 예전에는 StatsForm 이 따로 저장했는데, 이제 값의 주인이
  // 하나뿐이라 "화면에 보이는 것"과 "저장된 것"이 어긋날 일이 없다.
  useEffect(() => {
    if (!isLoading) localStorage.setItem(STORAGE_KEY.STATS, JSON.stringify(stats));
  }, [stats, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(STORAGE_KEY.ITEMS, JSON.stringify(items));
  }, [items, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(STORAGE_KEY.NOTE, note);
  }, [note, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(STORAGE_KEY.RATE, String(rate));
  }, [rate, isLoading]);

  const results = useMemo(
    () => calculateResults(stats, items, elapsedTime),
    [stats, items, elapsedTime],
  );

  // 사냥터를 채우면 오류 문구는 바로 거둔다. 저장을 다시 눌러야 사라지면 잔소리가 된다.
  const handleStatsChange = (next: HuntingStats) => {
    setStats(next);
    if (locationError && next.location.trim()) setLocationError(null);
  };

  const handleSaveRecord = () => {
    if (!stats.location.trim()) {
      // 확인창으로 알리면 어느 칸이 문제인지 가려 버린다. 그 칸 아래 붙여 두고 포커스를 옮긴다.
      setLocationError('사냥터 이름을 입력해 주세요.');
      return;
    }

    const record: HuntingRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      duration: elapsedTime,
      location: stats.location,
      stats,
      items,
      note: note.trim(),
    };

    setLocationError(null);
    setRecords(prev => [record, ...prev]);
    setIsRecordsOpen(true);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(record => record.id !== id));
  };

  const handleLoadRecord = (record: HuntingRecord) => {
    setElapsedTime(record.duration);
    setLocationError(null);
    setStats({ ...EMPTY_STATS, ...record.stats });
    setItems(record.items);
    setNote(record.note);
    setIsRecordsOpen(false);
  };

  const handleImportRecords = (newRecords: HuntingRecord[]) => {
    setRecords(newRecords);
  };

  const handleClearAllRecords = () => {
    setRecords([]);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-sm text-subtle">데이터를 불러오는 중…</p>
      </main>
    );
  }

  return (
    <DialogProvider>
      <div className="min-h-screen bg-bg">
        <AppHeader
          elapsedTime={elapsedTime}
          isRunning={isTimerRunning}
          mode={timerMode}
          recordCount={records.length}
          onOpenRecords={() => setIsRecordsOpen(true)}
        />

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {/*
            넓은 화면에서는 왼쪽에 타이머와 입력, 오른쪽에 정산 결과를 붙여 두고 결과만
            따라다니게 한다. 좁은 화면에서는 그대로 한 줄로 쌓이고, 결과와 저장 버튼이
            입력 아래 마지막에 온다 — 실제로 값을 다 적은 뒤에 보는 순서다.
          */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6">
            <div className="flex flex-col gap-4">
              <Timer
                onTimeUpdate={setElapsedTime}
                initialTime={elapsedTime}
                isRunning={isTimerRunning}
                onRunningChange={setIsTimerRunning}
                mode={timerMode}
                onModeChange={setTimerMode}
                targetTime={targetTime}
                onTargetTimeChange={setTargetTime}
                finishedAt={finishedAt}
                onFinished={handleTimerFinished}
                onAcknowledgeFinish={handleAcknowledgeFinish}
              />
              <StatsForm
                stats={stats}
                onStatsChange={handleStatsChange}
                locationError={locationError}
                items={items}
                onItemsChange={setItems}
                note={note}
                onNoteChange={setNote}
              />
            </div>

            {/*
              패널이 화면보다 길어지면(아이템이 여럿일 때) 고정된 채로 아래쪽이 잘려서,
              저장 버튼을 누르려면 페이지 맨 아래까지 내려야 했다. 안에서 스크롤시켜
              언제나 패널 전체에 닿게 한다.
            */}
            <div className="lg:sticky lg:top-[4.5rem] lg:flex lg:max-h-[calc(100vh-6rem)]">
              <ResultsPanel
                stats={stats}
                results={results}
                elapsedTime={elapsedTime}
                rate={rate}
                onRateChange={setRate}
                onSave={handleSaveRecord}
              />
            </div>
          </div>
        </main>

        <Drawer
          open={isRecordsOpen}
          onClose={() => setIsRecordsOpen(false)}
          title="사냥 기록"
          description={records.length > 0 ? `${records.length}개 저장됨` : undefined}
        >
          <HuntingRecords
            records={records}
            rate={rate}
            onDelete={handleDeleteRecord}
            onLoad={handleLoadRecord}
            onImport={handleImportRecords}
            onClearAll={handleClearAllRecords}
          />
        </Drawer>
      </div>
    </DialogProvider>
  );
}
