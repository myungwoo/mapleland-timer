'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerProps {
  onTimeUpdate: (time: number) => void;
  initialTime?: number;
  isRunning?: boolean;
  onRunningChange?: (isRunning: boolean) => void;
  mode?: 'stopwatch' | 'timer';
  onModeChange?: (mode: 'stopwatch' | 'timer') => void;
  targetTime: number | null;
  onTargetTimeChange: (targetTime: number | null) => void;
}

export default function Timer({
  onTimeUpdate,
  initialTime = 0,
  isRunning: externalIsRunning,
  onRunningChange,
  mode: externalMode = 'stopwatch',
  onModeChange,
  targetTime,
  onTargetTimeChange
}: TimerProps) {
  const [time, setTime] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<'stopwatch' | 'timer'>(externalMode);
  const isInitializedRef = useRef<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValues, setEditValues] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const startFlashing = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 1500); // 3번 깜빡임 (0.5초 * 3)
  }, []);

  // 알림음 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('./alert.mp3');
      audioRef.current.addEventListener('canplaythrough', () => {
        setIsAudioLoaded(true);
      });
      audioRef.current.load();
    }
  }, []);

  // 알림음 재생 함수
  const playAlertSound = useCallback(() => {
    startFlashing();
    if (audioRef.current && isAudioLoaded) {
      audioRef.current.play().catch(error => {
        if (error.name === 'NotAllowedError') {
          console.log('Timer completed but sound could not be played due to browser restrictions');
        } else {
          console.error('Failed to play alert sound:', error);
        }
      });
      // 소리 재생 성공 여부와 관계없이 시각적 피드백 제공
    }
  }, [startFlashing, isAudioLoaded]);

  const handleStart = useCallback(() => {
    const now = Date.now();
    if (mode === 'timer') {
      onTargetTimeChange(now + (time * 1000)); // 타이머 모드에서는 목표 시간을 설정
    } else {
      onTargetTimeChange(now - (time * 1000)); // 스탑워치 모드에서는 시작 시간을 설정
    }
    setIsRunning(true);
    if (onRunningChange) {
      onRunningChange(true);
    }
  }, [mode, time, onTargetTimeChange, onRunningChange]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    if (onRunningChange) {
      onRunningChange(false);
    }
  }, [onRunningChange]);

  // 외부에서 제어되는 mode 상태 동기화
  useEffect(() => {
    setMode(externalMode);
  }, [externalMode]);

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
          const now = Date.now();
          if (mode === 'timer') {
            onTargetTimeChange(now + (initialTime * 1000));
          } else {
            onTargetTimeChange(now - (initialTime * 1000));
          }
        }
      }
    } else {
      isInitializedRef.current = true;
    }
  }, [externalIsRunning, initialTime, isRunning, onTimeUpdate, mode, onTargetTimeChange]);

  useEffect(() => {
    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    const updateTimer = () => {
      if (isRunning && targetTime !== null) {
        const now = Date.now();
        const timeDiff = now - lastUpdateTime;
        lastUpdateTime = now;

        // 브라우저 탭이 비활성화되어 있었을 경우를 대비해 시간 차이가 너무 크면 보정
        if (timeDiff > 1000) {
          if (mode === 'timer') {
            const remainingTime = Math.max(0, Math.floor((targetTime - now) / 1000));
            setTime(remainingTime);
            onTimeUpdate(remainingTime);

            if (remainingTime === 0) {
              playAlertSound();
              handleStop();
              return;
            }
          } else {
            const elapsedTime = Math.floor((now - targetTime) / 1000);
            setTime(elapsedTime);
            onTimeUpdate(elapsedTime);
          }
        } else {
          if (mode === 'timer') {
            const remainingTime = Math.max(0, Math.floor((targetTime - now) / 1000));
            if (remainingTime !== time) {
              setTime(remainingTime);
              onTimeUpdate(remainingTime);

              if (remainingTime === 0) {
                playAlertSound();
                handleStop();
                return;
              }
            }
          } else {
            const elapsedTime = Math.floor((now - targetTime) / 1000);
            if (elapsedTime !== time) {
              setTime(elapsedTime);
              onTimeUpdate(elapsedTime);
            }
          }
        }

        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (isRunning) {
      if (targetTime === null) {
        const now = Date.now();
        if (mode === 'timer') {
          onTargetTimeChange(now + (time * 1000));
        } else {
          onTargetTimeChange(now - (time * 1000));
        }
      }
      lastUpdateTime = Date.now();
      updateTimer();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning, time, onTimeUpdate, mode, targetTime, onTargetTimeChange, playAlertSound, handleStop]);

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
    if (!isRunning || !targetTime) return null;

    const now = Date.now();
    const elapsedMs = now - targetTime;
    const nextHourMs = Math.ceil(elapsedMs / (3600 * 1000)) * (3600 * 1000);
    const nextHourTime = new Date(targetTime + nextHourMs);

    return nextHourTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [isRunning, targetTime]);

  const handleReset = () => {
    if (window.confirm('타이머를 초기화하시겠습니까?')) {
      setIsRunning(false);
      if (onRunningChange) {
        onRunningChange(false);
      }
      onTargetTimeChange(null);
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

  const handleModeToggle = () => {
    if (!isRunning) {
      const newMode = mode === 'stopwatch' ? 'timer' : 'stopwatch';
      setMode(newMode);
      if (onModeChange) {
        onModeChange(newMode);
      }
      setTime(0);
      onTimeUpdate(0);
    }
  };

  const { hours, minutes, seconds } = formatTime(time);
  const nextHourTime = getNextHourTime();

  return (
    <div className={`flex flex-col items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md ${
      isFlashing ? 'animate-flash' : ''
    }`}>
      <h2
        className={`text-2xl font-semibold text-gray-900 dark:text-white ${!isRunning ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={handleModeToggle}
      >
        {mode === 'stopwatch' ? '스탑워치' : '타이머'}
      </h2>
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
      {isRunning && nextHourTime && mode === 'stopwatch' && (
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