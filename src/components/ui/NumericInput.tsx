'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * 화면에 보일 때만 세 자리마다 쉼표를 넣는다.
 *
 * 밖으로 내보내는 값(`onValueChange`)은 항상 숫자만 있는 문자열이다. 정산은 이 값을
 * `parseInt` 로 읽고 기록도 이 모양으로 저장되어 있어서, 쉼표가 상태까지 들어가면
 * `parseInt('1,000,000')` 이 1 이 되고 예전에 저장한 기록과도 모양이 달라진다.
 */
const toRaw = (input: string) => {
  const negative = input.trimStart().startsWith('-');
  const digits = input.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (digits === '') return negative ? '-' : '';
  return (negative ? '-' : '') + digits;
};

const format = (raw: string) => {
  if (raw === '' || raw === '-') return raw;
  const negative = raw.startsWith('-');
  const digits = negative ? raw.slice(1) : raw;
  return (negative ? '-' : '') + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/** 문자열 앞쪽에 숫자가 몇 개 있는지. 쉼표 개수가 바뀌어도 커서를 되돌리는 기준이 된다. */
const countDigits = (text: string) => (text.match(/\d/g) ?? []).length;

/** 숫자를 `count` 개 지난 지점의 인덱스. */
const indexAfterDigits = (text: string, count: number) => {
  if (count === 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i])) {
      seen++;
      if (seen === count) return i + 1;
    }
  }
  return text.length;
};

interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** 숫자만 있는 문자열. 빈 문자열이면 빈 칸. */
  value: string;
  onValueChange: (value: string) => void;
}

export default function NumericInput({ value, onValueChange, ...props }: NumericInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  // 쉼표가 늘거나 줄면 커서가 끝으로 튄다. 입력 직전에 세어 둔 "앞쪽 숫자 개수" 로
  // 같은 자리에 돌려놓는다.
  useLayoutEffect(() => {
    if (caretRef.current === null || !inputRef.current) return;
    inputRef.current.setSelectionRange(caretRef.current, caretRef.current);
    caretRef.current = null;
  });

  const commit = (nextText: string, digitsBeforeCaret: number) => {
    const raw = toRaw(nextText);
    caretRef.current = indexAfterDigits(format(raw), digitsBeforeCaret);
    onValueChange(raw);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: text, selectionStart } = event.target;
    commit(text, countDigits(text.slice(0, selectionStart ?? text.length)));
  };

  /**
   * 쉼표 바로 뒤에서 Backspace 를 누르면 쉼표만 지워지고, 다시 서식을 입히면 그 쉼표가
   * 되살아나 아무 일도 일어나지 않은 것처럼 보인다. 이때는 쉼표 앞의 숫자를 지운다.
   * Delete 도 같은 이유로 손봐 준다.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const { value: text, selectionStart, selectionEnd } = input;
    if (selectionStart === null || selectionStart !== selectionEnd) return;

    if (event.key === 'Backspace' && text[selectionStart - 1] === ',') {
      event.preventDefault();
      const cut = selectionStart - 2;
      commit(text.slice(0, cut) + text.slice(cut + 1), countDigits(text.slice(0, cut)));
    } else if (event.key === 'Delete' && text[selectionStart] === ',') {
      event.preventDefault();
      const cut = selectionStart + 1;
      commit(
        text.slice(0, cut) + text.slice(cut + 1),
        countDigits(text.slice(0, selectionStart)),
      );
    }
  };

  return (
    <input
      ref={inputRef}
      // 쉼표가 들어가야 하므로 type="number" 는 쓸 수 없다. 폰에서 숫자 자판이 뜨도록
      // inputMode 로 대신한다.
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={format(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
