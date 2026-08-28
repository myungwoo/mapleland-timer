'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Button, { IconButton } from './ui/Button';
import Card from './ui/Card';
import SegmentedControl from './ui/SegmentedControl';
import { useDialog } from './ui/Dialog';
import { formatClock } from '@/lib/hunting';
import { STORAGE_KEY } from '@/constants/storage';

interface TimerProps {
  onTimeUpdate: (time: number) => void;
  initialTime?: number;
  isRunning?: boolean;
  onRunningChange?: (isRunning: boolean) => void;
  mode?: 'stopwatch' | 'timer';
  onModeChange?: (mode: 'stopwatch' | 'timer') => void;
  targetTime: number | null;
  onTargetTimeChange: (targetTime: number | null) => void;
  /** 타이머가 끝났는데 아직 확인하지 않았으면 그 시각. */
  finishedAt: number | null;
  onFinished: () => void;
  onAcknowledgeFinish: () => void;
}

/** 알림음 설정. 모르는 값이면 켜 둔 것으로 본다. */
const readAlertSound = () => {
  try {
    return localStorage.getItem(STORAGE_KEY.ALERT_SOUND) !== 'off';
  } catch {
    return true;
  }
};

export default function Timer({
  onTimeUpdate,
  initialTime = 0,
  isRunning: externalIsRunning,
  onRunningChange,
  mode: externalMode = 'stopwatch',
  onModeChange,
  targetTime,
  onTargetTimeChange,
  finishedAt,
  onFinished,
  onAcknowledgeFinish,
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
  const [alertSound, setAlertSound] = useState<boolean>(true);
  const dialog = useDialog();

  // 저장된 설정은 첫 페인트 뒤에 읽는다. 서버에서 그린 화면과 어긋나지 않게.
  useEffect(() => {
    setAlertSound(readAlertSound());
  }, []);

  const toggleAlertSound = () => {
    const next = !alertSound;
    setAlertSound(next);
    try {
      localStorage.setItem(STORAGE_KEY.ALERT_SOUND, next ? 'on' : 'off');
    } catch {
      // 시크릿 모드처럼 localStorage 가 막힌 환경에서는 이번 세션만 적용된다.
    }
  };

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

  /**
   * 타이머가 0 에 닿았을 때.
   *
   * 신호를 세 겹으로 둔다. 깜빡임은 그 순간 화면을 보고 있어야 하고(모션을 줄인 사용자
   * 에게는 아예 보이지 않는다), 소리는 브라우저가 막거나 볼륨이 꺼져 있을 수 있다. 그래서
   * 확인을 누를 때까지 남는 배너가 실제로 놓치지 않게 해 주는 부분이다.
   */
  const handleFinish = useCallback(() => {
    startFlashing();
    onFinished();

    if (alertSound && audioRef.current && isAudioLoaded) {
      audioRef.current.play().catch(error => {
        if (error.name !== 'NotAllowedError') {
          console.error('Failed to play alert sound:', error);
        }
        // 막혀도 배너와 탭 제목이 남으니 조용히 넘어간다.
      });
    }
  }, [startFlashing, onFinished, alertSound, isAudioLoaded]);

  /**
   * 시작을 누른 김에 알림음을 한 번 재생해 잠금을 푼다.
   *
   * 브라우저는 사용자가 건드린 적 없는 페이지가 소리를 내는 걸 막는다. 타이머가 끝나는
   * 순간에는 사용자 조작이 없으므로, 조작이 있는 지금 무음으로 한 번 틀어 둬야 그때 소리가
   * 난다. 특히 iOS 사파리가 엄격하다.
   */
  const primeAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {
        // 여기서 막히면 그때도 안 울린다. 배너와 탭 제목으로 알린다.
      })
      .finally(() => {
        audio.muted = false;
      });
  }, []);

  const handleStart = useCallback(() => {
    primeAudio();
    onAcknowledgeFinish();
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
  }, [mode, time, onTargetTimeChange, onRunningChange, primeAudio, onAcknowledgeFinish]);

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
              handleFinish();
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
                handleFinish();
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
  }, [isRunning, time, onTimeUpdate, mode, targetTime, onTargetTimeChange, handleFinish, handleStop]);

  /**
   * 끝나는 시각에 맞춰 타이머를 하나 더 걸어 둔다.
   *
   * 화면을 그리는 쪽은 requestAnimationFrame 인데, 탭이 뒤로 가면 브라우저가 이걸 멈춘다.
   * 정작 알림이 필요한 건 다른 창을 보고 있을 때다. setTimeout 은 뒤에서도 돌아서(오래
   * 숨어 있으면 조금 늦을 수는 있다) 그 사이 소리와 탭 제목을 띄울 수 있다.
   */
  useEffect(() => {
    if (!isRunning || mode !== 'timer' || targetTime === null) return;

    const remainingMs = targetTime - Date.now();
    if (remainingMs <= 0) return;

    const timer = setTimeout(() => {
      setTime(0);
      onTimeUpdate(0);
      handleFinish();
      handleStop();
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [isRunning, mode, targetTime, onTimeUpdate, handleFinish, handleStop]);

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
          <div className="flex items-center gap-1">
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

            {/* 알림음은 타이머 모드에서만 울린다. 스탑워치에서는 보여 줄 이유가 없다. */}
            {mode === 'timer' && (
              <IconButton
                label={alertSound ? '알림음 켜짐 (눌러서 끄기)' : '알림음 꺼짐 (눌러서 켜기)'}
                onClick={toggleAlertSound}
                aria-pressed={alertSound}
                className="h-8 w-8"
              >
                {alertSound ? (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97M2.25 2.25l19.5 19.5m-9.756-9.756a6.002 6.002 0 0 0-3.75-6.66V4.5a2.25 2.25 0 1 0-4.5 0v.836a6 6 0 0 0-.09.077M18 9.75a6 6 0 0 0-2.34-4.755" />
                  </svg>
                )}
              </IconButton>
            )}
          </div>
        </div>

        {/*
          끝났다는 사실을 확인을 누를 때까지 남긴다. 깜빡임은 1.5 초 뒤 사라지고 모션을 줄인
          사용자에게는 처음부터 보이지 않으므로, 놓치지 않게 해 주는 건 이 배너다.
        */}
        {finishedAt !== null && (
          <div
            role="alert"
            className="flex w-full items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3"
          >
            <span className="text-lg leading-none" aria-hidden="true">⏰</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text">타이머가 끝났습니다</p>
              <p className="mt-0.5 text-xs text-muted">
                {new Date(finishedAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                종료
              </p>
            </div>
            <Button size="sm" variant="neutral" onClick={onAcknowledgeFinish}>
              확인
            </Button>
          </div>
        )}

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
