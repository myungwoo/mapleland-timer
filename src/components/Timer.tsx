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
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValues, setEditValues] = useState({ hours: '00', minutes: '00', seconds: '00' });

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

  const handleTimeClick = () => {
    if (!isRunning) {
      const { hours, minutes, seconds } = formatTime(time);
      setEditValues({ hours, minutes, seconds });
      setIsEditing(true);
    }
  };

  const handleTimeInputChange = (field: 'hours' | 'minutes' | 'seconds', value: string) => {
    let numValue = parseInt(value) || 0;

    // 각 필드의 최대값 제한
    if (field === 'hours') {
      numValue = Math.min(Math.max(numValue, 0), 99);
    } else {
      numValue = Math.min(Math.max(numValue, 0), 59);
    }

    setEditValues(prev => ({
      ...prev,
      [field]: numValue.toString().padStart(2, '0')
    }));
  };

  const handleTimeInputBlur = (e: React.FocusEvent) => {
    // 다른 시간 입력 필드로 포커스가 이동하는 경우 blur 처리를 하지 않음
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.classList.contains('time-input')) {
      return;
    }

    const totalSeconds =
      parseInt(editValues.hours) * 3600 +
      parseInt(editValues.minutes) * 60 +
      parseInt(editValues.seconds);

    setTime(totalSeconds);
    onTimeUpdate(totalSeconds);
    setIsEditing(false);
  };

  const handleTimeInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const totalSeconds =
        parseInt(editValues.hours) * 3600 +
        parseInt(editValues.minutes) * 60 +
        parseInt(editValues.seconds);

      setTime(totalSeconds);
      onTimeUpdate(totalSeconds);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const { hours, minutes, seconds } = formatTime(time);
  const nextHourTime = getNextHourTime();

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">타이머</h2>
      <div
        className={`text-5xl font-mono font-bold text-gray-900 dark:text-white ${!isRunning ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={handleTimeClick}
      >
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editValues.hours}
              onChange={(e) => handleTimeInputChange('hours', e.target.value)}
              onBlur={handleTimeInputBlur}
              onKeyDown={handleTimeInputKeyDown}
              className="time-input w-[4ch] px-2 text-4xl bg-transparent text-center focus:outline-none focus:border-b-2 focus:border-blue-500"
              autoFocus
            />
            <span className="text-4xl">:</span>
            <input
              type="text"
              value={editValues.minutes}
              onChange={(e) => handleTimeInputChange('minutes', e.target.value)}
              onBlur={handleTimeInputBlur}
              onKeyDown={handleTimeInputKeyDown}
              className="time-input w-[4ch] px-2 text-4xl bg-transparent text-center focus:outline-none focus:border-b-2 focus:border-blue-500"
            />
            <span className="text-4xl">:</span>
            <input
              type="text"
              value={editValues.seconds}
              onChange={(e) => handleTimeInputChange('seconds', e.target.value)}
              onBlur={handleTimeInputBlur}
              onKeyDown={handleTimeInputKeyDown}
              className="time-input w-[4ch] px-2 text-4xl bg-transparent text-center focus:outline-none focus:border-b-2 focus:border-blue-500"
            />
          </div>
        ) : (
          <span className="text-6xl">{hours}:{minutes}:{seconds}</span>
        )}
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