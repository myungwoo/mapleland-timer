'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Button from './Button';

type Tone = 'primary' | 'danger' | 'neutral';

export interface DialogChoice<T> {
  value: T;
  label: string;
  tone?: Tone;
}

interface DialogRequest<T> {
  title: string;
  description?: ReactNode;
  /** 왼쪽부터 차례로 놓인다. 마지막이 기본 동작이다. */
  choices: DialogChoice<T>[];
  /** Esc, 바깥 클릭, 닫기로 물러났을 때의 값. */
  cancelValue: T;
}

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  /** 진행 버튼 문구. 무엇이 일어나는지 적는다("확인" 보다 "삭제"). */
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Tone;
}

interface DialogApi {
  /** 여러 갈래 중 하나를 고르게 한다. 물러나면 `cancelValue`. */
  ask: <T,>(request: DialogRequest<T>) => Promise<T>;
  /** 진행/취소 두 갈래. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** 알리기만 한다. */
  alert: (options: { title: string; description?: ReactNode }) => Promise<void>;
}

const DialogContext = createContext<DialogApi | null>(null);

export const useDialog = () => {
  const api = useContext(DialogContext);
  if (!api) throw new Error('useDialog 는 DialogProvider 안에서만 쓸 수 있습니다.');
  return api;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 앱 안에서 그리는 확인창.
 *
 * `window.confirm` 을 대신한다. 브라우저 기본 확인창은 문구를 다듬을 수도, 버튼을 셋으로
 * 늘릴 수도, 위험한 동작을 눈에 띄게 만들 수도 없었다 — 기록 불러오기의 "취소를 선택하면
 * 기존 기록이 삭제됩니다" 처럼 두 갈래 버튼에 세 갈래 뜻을 우겨넣는 일이 생긴다.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest<unknown> | null>(null);
  const resolverRef = useRef<((value: unknown) => void) | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const ask = useCallback(<T,>(next: DialogRequest<T>) => {
    // 확인창이 떠 있는 동안에는 뒤쪽 조작이 막히므로 요청이 겹칠 일은 없다.
    // 그래도 겹치면 앞 요청은 물러난 것으로 본다 — 응답을 영영 기다리게 두지 않는다.
    resolverRef.current?.(next.cancelValue);
    return new Promise<T>(resolve => {
      resolverRef.current = resolve as (value: unknown) => void;
      setRequest(next as DialogRequest<unknown>);
    });
  }, []);

  const settle = useCallback((value: unknown) => {
    setRequest(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(value);
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      ask,
      confirm: ({ title, description, confirmLabel, cancelLabel = '취소', tone = 'primary' }) =>
        ask<boolean>({
          title,
          description,
          cancelValue: false,
          choices: [
            { value: false, label: cancelLabel, tone: 'neutral' },
            { value: true, label: confirmLabel, tone },
          ],
        }),
      alert: ({ title, description }) =>
        ask<void>({
          title,
          description,
          cancelValue: undefined,
          choices: [{ value: undefined, label: '확인', tone: 'primary' }],
        }),
    }),
    [ask],
  );

  useEffect(() => {
    if (!request) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    // 기본 동작(마지막 버튼)에 포커스를 준다. 단 그게 되돌릴 수 없는 동작이면 안전한
    // 쪽(첫 버튼)에 준다 — Enter 를 무심코 눌러 기록이 사라지면 복구할 방법이 없다.
    const buttons = [...(panelRef.current?.querySelectorAll<HTMLElement>('button') ?? [])];
    const destructive = request.choices[request.choices.length - 1]?.tone === 'danger';
    (destructive ? buttons[0] : buttons[buttons.length - 1])?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        settle(request.cancelValue);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      // 확인창 밖으로 포커스가 새 나가지 않게 가둔다.
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [request, settle]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      {request && (
        <div
          // Drawer 가 document 에서 Escape 를 듣고 있다. 확인창이 떠 있을 때 Esc 로
          // 서랍까지 같이 닫히지 않도록, 서랍은 이 표시가 붙은 층에서 온 키를 넘긴다.
          data-dialog-layer=""
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
        >
          <div
            className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-[2px]"
            onClick={() => settle(request.cancelValue)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby={request.description ? 'dialog-description' : undefined}
            className="relative w-full max-w-sm animate-fade-in rounded-2xl border border-border
              bg-surface p-5 shadow-overlay"
          >
            <h2 id="dialog-title" className="text-base font-semibold tracking-tight text-text">
              {request.title}
            </h2>
            {request.description && (
              <p id="dialog-description" className="mt-2 whitespace-pre-line text-sm text-muted">
                {request.description}
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {request.choices.map((choice, index) => (
                <Button
                  key={index}
                  variant={choice.tone ?? 'neutral'}
                  onClick={() => settle(choice.value)}
                >
                  {choice.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
