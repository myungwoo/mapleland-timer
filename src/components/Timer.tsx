'use client';

import { useState, useEffect, useCallback } from 'react';

interface TimerProps {
  onTimeUpdate: (time: number) => void;
}

interface TimerState {
  time: number;
  isRunning: boolean;
  lastUpdated: number;
}

const STORAGE_KEY = 'maple-timer-state';

export default function Timer({ onTimeUpdate }: TimerProps) {
  const [time, setTime] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const state: TimerState = JSON.parse(savedState);
        if (state.isRunning) {
          const timeDiff = Math.floor((Date.now() - state.lastUpdated) / 1000);
          return state.time + timeDiff;
        }
        return state.time;
      }
    }
    return 0;
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const state: TimerState = JSON.parse(savedState);
        return state.isRunning;
      }
    }
    return false;
  });

  // 초기 시간을 부모 컴포넌트에 알림
  useEffect(() => {
    onTimeUpdate(time);
  }, []);

  // 상태 변경시 저장
  useEffect(() => {
    const state: TimerState = {
      time,
      isRunning,
      lastUpdated: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [time, isRunning]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  }, []);

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    onTimeUpdate(0);
  };

  const { hours, minutes, seconds } = formatTime(time);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">타이머</h2>
      <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white">
        {hours}:{minutes}:{seconds}
      </div>
      <div className="flex gap-4">
        <button
          onClick={isRunning ? handleStop : handleStart}
          className={`px-6 py-2 rounded-lg font-semibold ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } transition-colors`}
        >
          {isRunning ? '정지' : '시작'}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-lg font-semibold bg-gray-500 hover:bg-gray-600 text-white transition-colors"
        >
          리셋
        </button>
      </div>
    </div>
  );
}