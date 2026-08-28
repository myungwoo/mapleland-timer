import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** 안쪽 여백을 직접 다루고 싶을 때(예: 표가 가장자리까지 닿는 카드) 끈다. */
  padded?: boolean;
}

/** 화면의 모든 덩어리는 이 카드 하나로 통일한다. 경계는 테두리, 그림자는 아주 얕게. */
export default function Card({ children, className = '', padded = true }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface shadow-card ${
        padded ? 'p-5 sm:p-6' : ''
      } ${className}`}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  /** 제목 아래 한 줄 설명. 없으면 생략된다. */
  description?: ReactNode;
  /** 오른쪽에 붙는 액션들. */
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, actions, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-text">{title}</h2>
        {description && <p className="mt-1 text-xs text-subtle">{description}</p>}
      </div>
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
