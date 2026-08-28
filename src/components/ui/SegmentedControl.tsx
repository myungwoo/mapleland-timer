'use client';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** 타이머가 도는 중처럼 모드를 바꾸면 안 되는 상황. */
  disabled?: boolean;
  'aria-label': string;
}

/**
 * 스탑워치 ↔ 타이머처럼 둘 중 하나를 고르는 컨트롤.
 *
 * 예전에는 제목 `<h2>` 를 클릭해야 모드가 바뀌었다. 눌러야 한다는 걸 알 방법이 없었고
 * 키보드로는 아예 닿지 않았다.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex rounded-xl border border-border bg-surface-sunken p-1 ${
        disabled ? 'opacity-55' : ''
      }`}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50
              disabled:cursor-not-allowed
              ${
                selected
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-subtle hover:text-text disabled:hover:text-subtle'
              }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
