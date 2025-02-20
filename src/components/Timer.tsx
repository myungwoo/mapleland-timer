'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerProps {
  onTimeUpdate: (time: number) => void;
  initialTime?: number;
  isRunning?: boolean;
  onRunningChange?: (isRunning: boolean) => void;
}

interface TimerState {
  time: number;
  isRunning: boolean;
  startTime: number | null;
}

const STORAGE_KEY = 'maple-timer-state';

export default function Timer({
  onTimeUpdate,
  initialTime = 0,
  isRunning: externalIsRunning,
  onRunningChange
}: TimerProps) {
  const [time, setTime] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // 초기 상태 로드
  useEffect(() => {
    if (!isInitializedRef.current && typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        try {
          const state: TimerState = JSON.parse(savedState);
          if (externalIsRunning === undefined) {
            setIsRunning(state.isRunning);
            setTime(state.time);
            onTimeUpdate(state.time);
            if (state.isRunning && state.startTime) {
              startTimeRef.current = state.startTime;
            }
          }
        } catch (error) {
          console.error('Failed to parse timer state:', error);
        }
      }
      isInitializedRef.current = true;
    }
  }, [externalIsRunning, onTimeUpdate]);

  // 외부에서 제어되는 isRunning 상태와 initialTime 동기화
  useEffect(() => {
    if (isInitializedRef.current) {
      if (externalIsRunning !== undefined) {
        setIsRunning(externalIsRunning);
      }
      if (!isRunning) {
        setTime(initialTime);
        onTimeUpdate(initialTime);
        if (externalIsRunning) {
          startTimeRef.current = Date.now() - (initialTime * 1000);
        }
      }
    }
  }, [externalIsRunning, initialTime, isRunning, onTimeUpdate]);

  // 상태 변경시 저장
  useEffect(() => {
    if (isInitializedRef.current) {
      const state: TimerState = {
        time,
        isRunning,
        startTime: isRunning ? startTimeRef.current : null
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [time, isRunning]);

  useEffect(() => {
    let animationFrameId: number;

    const updateTimer = () => {
      if (isRunning && startTimeRef.current > 0) {
        const now = Date.now();
        const newTime = Math.floor((now - startTimeRef.current) / 1000);

        if (newTime !== time) {
          setTime(newTime);
          onTimeUpdate(newTime);
        }

        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (isRunning) {
      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now() - (time * 1000);
      }
      updateTimer();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning, time, onTimeUpdate]);

  const formatTime = useCallback((totalSeconds: number) => {
    if (!Number.isFinite(totalSeconds)) {
      return {
        hours: '00',
        minutes: '00',
        seconds: '00'
      };
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  }, []);

  const getNextHourTime = useCallback(() => {
    if (!isRunning || !startTimeRef.current) return null;

    const now = Date.now();
    const elapsedMs = now - startTimeRef.current;
    const nextHourMs = Math.ceil(elapsedMs / (3600 * 1000)) * (3600 * 1000);
    const nextHourTime = new Date(startTimeRef.current + nextHourMs);

    return nextHourTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [isRunning]);

  const handleStart = () => {
    const now = Date.now();
    startTimeRef.current = now - (time * 1000);
    setIsRunning(true);
    if (onRunningChange) {
      onRunningChange(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    if (onRunningChange) {
      onRunningChange(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('타이머를 초기화하시겠습니까?')) {
      setIsRunning(false);
      if (onRunningChange) {
        onRunningChange(false);
      }
      startTimeRef.current = 0;
      setTime(0);
      onTimeUpdate(0);
    }
  };

  const { hours, minutes, seconds } = formatTime(time);
  const nextHourTime = getNextHourTime();

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">타이머</h2>
      <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white">
        {hours}:{minutes}:{seconds}
      </div>
      {isRunning && nextHourTime && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {parseInt(hours) + 1}시간 도달 예정: {nextHourTime}
        </div>
      )}
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