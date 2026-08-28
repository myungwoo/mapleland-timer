'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import SegmentedControl from './ui/SegmentedControl';
import { useDialog } from './ui/Dialog';
import { formatClock } from '@/lib/hunting';

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
  const dialog = useDialog();

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

  const handleReset = async () => {
    const shown = formatClock(time);
    const confirmed = await dialog.confirm({
      title: '타이머를 초기화할까요?',
      description: `지금 표시된 ${shown.hours}:${shown.minutes}:${shown.seconds} 가 00:00:00 이 됩니다.`,
      confirmLabel: '초기화',
      tone: 'danger',
    });
    if (!confirmed) return;

    setIsRunning(false);
    if (onRunningChange) {
      onRunningChange(false);
    }
    onTargetTimeChange(null);
    setTime(0);
    onTimeUpdate(0);
  };

  const startEditing = () => {
    if (!isRunning) {
      const { hours, minutes, seconds } = formatClock(time);
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

  const commitEdit = () => {
    const totalSeconds =
      parseInt(editValues.hours) * 3600 +
      parseInt(editValues.minutes) * 60 +
      parseInt(editValues.seconds);

    setTime(totalSeconds);
    onTimeUpdate(totalSeconds);
    setIsEditing(false);
  };

  const handleTimeInputBlur = (e: React.FocusEvent) => {
    // 다른 시간 입력 필드로 포커스가 이동하는 경우 blur 처리를 하지 않음
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.classList.contains('time-input')) {
      return;
    }
    commitEdit();
  };

  const handleTimeInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleModeChange = (newMode: 'stopwatch' | 'timer') => {
    if (!isRunning) {
      setMode(newMode);
      if (onModeChange) {
        onModeChange(newMode);
      }
      setTime(0);
      onTimeUpdate(0);
    }
  };

  const { hours, minutes, seconds } = formatClock(time);
  const nextHourTime = getNextHourTime();

  const editInputClass =
    'time-input w-[2.4ch] rounded-md bg-transparent p-0 text-center font-mono text-4xl font-semibold ' +
    'text-text tabular-nums border-0 focus:outline-none focus:ring-0 sm:w-[2.6ch] sm:text-5xl';

  return (
    <Card className={isFlashing ? 'animate-flash' : ''}>
      <div className="flex flex-col items-center gap-5">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            aria-label="타이머 모드"
            value={mode}
            onChange={handleModeChange}
            disabled={isRunning}
            options={[
              { value: 'stopwatch', label: '스탑워치' },
              { value: 'timer', label: '타이머' },
            ]}
          />
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              isRunning ? 'text-success' : 'text-subtle'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRunning ? 'animate-pulse bg-success' : 'bg-border-strong'
              }`}
              aria-hidden="true"
            />
            {isRunning ? '측정 중' : '멈춤'}
          </span>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1 py-2">
            <input
              type="text"
              inputMode="numeric"
              aria-label="시"
              value={editValues.hours}
              onChange={(e) => handleTimeInputChange('hours', e.target.value)}
              onBlur={handleTimeInputBlur}
              onKeyDown={handleTimeInputKeyDown}
              className={editInputClass}
              autoFocus
            />
            <span className="font-mono text-4xl font-semibold text-subtle sm:text-5xl">:</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label="분"
              value={editValues.minutes}
              onChange={(e) => handleTimeInputChange('minutes', e.target.value)}
              onBlur={handleTimeInputBlur}
              onKeyDown={handleTimeInputKeyDown}
              className={editInputClass}
            />
            <span className="font-mono text-4xl font-semibold text-subtle sm:text-5xl">:</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label="초"
              value={editValues.seconds}
              onChange={(e) => handleTimeInputChange('seconds', e.target.value)}
              onBlur={handleTimeInputBlur}
              onKeyDown={handleTimeInputKeyDown}
              className={editInputClass}
            />
          </div>
        ) : (
          // 멈춰 있을 때만 시간을 직접 고칠 수 있다. 버튼으로 만들어 두면 눌러도 된다는 게
          // 보이고 키보드로도 닿는다 — 예전에는 그냥 텍스트라 알 방법이 없었다.
          <button
            type="button"
            onClick={startEditing}
            disabled={isRunning}
            aria-label={isRunning ? '측정 중에는 시간을 수정할 수 없습니다' : '시간 직접 입력'}
            className="group relative rounded-xl px-3 py-2 transition-colors
              enabled:hover:bg-surface-sunken disabled:cursor-default
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="block font-mono text-[2.75rem] font-semibold leading-none tracking-tight text-text tabular-nums sm:text-6xl">
              {hours}:{minutes}:{seconds}
            </span>
            {!isRunning && (
              <span className="mt-2 block text-[11px] text-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                눌러서 직접 입력
              </span>
            )}
          </button>
        )}

        {isRunning && nextHourTime && mode === 'stopwatch' && (
          <p className="text-xs text-subtle">
            {parseInt(hours) + 1}시간 도달 예정 · <span className="font-mono">{nextHourTime}</span>
          </p>
        )}

        <div className="flex w-full max-w-sm gap-2">
          <Button
            size="lg"
            variant={isRunning ? 'danger' : 'success'}
            onClick={isRunning ? handleStop : handleStart}
            className="flex-1"
          >
            {isRunning ? '정지' : '시작'}
          </Button>
          <Button size="lg" variant="neutral" onClick={handleReset}>
            리셋
          </Button>
        </div>
      </div>
    </Card>
  );
}
