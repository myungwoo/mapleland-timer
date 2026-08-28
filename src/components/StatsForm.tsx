'use client';

import ItemManager, { Item } from './ItemManager';
import Button, { IconButton } from './ui/Button';
import NumericInput from './ui/NumericInput';
import Card, { CardHeader } from './ui/Card';
import { HuntingStats } from '@/types/hunting';
import { EMPTY_STATS } from '@/lib/hunting';

interface StatsFormProps {
  stats: HuntingStats;
  onStatsChange: (stats: HuntingStats) => void;
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

/**
 * 시작/종료 값을 나란히 받는 한 줄. 같은 지표를 붙여 놔야 비교가 된다.
 *
 * `grouped` 인 칸은 세 자리마다 쉼표를 찍어 보여 준다 — 경험치와 메소는 여덟 자리를
 * 넘기기 일쑤라 쉼표 없이는 자릿수를 눈으로 세게 된다. 레벨은 세 자리라 그냥 둔다.
 */
function MetricRow({
  label,
  startValue,
  endValue,
  onChange,
  startName,
  endName,
  grouped = false,
}: {
  label: string;
  startValue: string;
  endValue: string;
  onChange: (name: string, value: string) => void;
  startName: keyof HuntingStats;
  endName: keyof HuntingStats;
  grouped?: boolean;
}) {
  const inputClass = 'field field-sunken font-mono';

  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-muted">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {([
          { name: startName, value: startValue, edge: '시작' },
          { name: endName, value: endValue, edge: '종료' },
        ] as const).map(({ name, value, edge }) =>
          grouped ? (
            <NumericInput
              key={name}
              value={value}
              onValueChange={(next) => onChange(name, next)}
              aria-label={`${edge} ${label}`}
              placeholder={edge}
              className={inputClass}
            />
          ) : (
            <input
              key={name}
              type="number"
              inputMode="numeric"
              value={value}
              onChange={(e) => onChange(name, e.target.value)}
              aria-label={`${edge} ${label}`}
              placeholder={edge}
              className={inputClass}
            />
          ),
        )}
      </div>
    </div>
  );
}

/**
 * 사냥 한 판의 입력. 값은 전부 위(page)에서 들고 있고 여기서는 화면만 그린다.
 *
 * 예전에는 이 컴포넌트가 상태와 localStorage 를 직접 들고 있으면서 `initialItems` 같은
 * prop 이 바뀔 때만 동기화했다. 그래서 아이템이 하나도 없는 기록을 불러오면
 * (`initialItems.length > 0` 이 거짓이라) 이전 아이템이 그대로 남았다.
 */
export default function StatsForm({
  stats,
  onStatsChange,
  items,
  onItemsChange,
  note,
  onNoteChange,
}: StatsFormProps) {
  const handleChange = (name: string, value: string) => {
    onStatsChange({ ...stats, [name]: value });
  };

  const handleFullClear = () => {
    if (window.confirm('모든 데이터를 전체 지우시겠습니까?')) {
      onStatsChange({ ...EMPTY_STATS });
      onItemsChange([]);
      onNoteChange('');
    }
  };

  const handlePartialClear = () => {
    if (window.confirm('경험치, 메소, 아이템 개수를 지우시겠습니까?\n(사냥터와 레벨은 유지됩니다)')) {
      onStatsChange({
        ...stats,
        startExp: '',
        startMeso: '',
        endExp: '',
        endMeso: '',
      });
      onItemsChange(items.map(item => ({ ...item, startCount: '', endCount: '' })));
      onNoteChange('');
    }
  };

  const handleSwap = () => {
    onStatsChange({
      ...stats,
      startLevel: stats.endLevel,
      startExp: stats.endExp,
      startMeso: stats.endMeso,
      endLevel: stats.startLevel,
      endExp: stats.startExp,
      endMeso: stats.startMeso,
    });
    onItemsChange(
      items.map(item => ({ ...item, startCount: item.endCount, endCount: item.startCount })),
    );
  };

  return (
    <>
      <Card className="space-y-5">
        <CardHeader
          title="사냥 기록 입력"
          description="사냥 전후 값을 넣으면 바로 정산됩니다."
          actions={
            <>
              <Button size="sm" variant="ghost" onClick={handlePartialClear}>
                일부 지우기
              </Button>
              <Button size="sm" variant="ghost" onClick={handleFullClear} className="text-danger hover:text-danger-hover">
                전체 지우기
              </Button>
            </>
          }
        />

        <div>
          <label htmlFor="location" className="mb-1.5 block text-xs font-medium text-muted">
            사냥터
          </label>
          <input
            id="location"
            type="text"
            name="location"
            value={stats.location}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
            placeholder="예: 커닝시티 지하철 3번 승강장"
            className="field field-sunken"
          />
        </div>

        <div className="space-y-4">
          {/*
            라벨 행은 아래 입력과 **똑같은** 2열 격자를 써야 "종료" 가 종료 입력 위에 온다.
            그래서 교체 버튼은 격자의 한 칸을 차지하지 않고 행 오른쪽 끝에 겹쳐 둔다 —
            버튼에 칸을 내주면 열 너비가 줄어 라벨이 입력과 어긋나고, 두 입력 사이에는
            값도 없는 빈 띠가 계속 남는다.
          */}
          <div className="relative flex min-h-8 items-center">
            <div className="grid w-full grid-cols-2 gap-2 text-[11px] font-semibold text-subtle">
              <span>시작</span>
              <span>종료</span>
            </div>
            <IconButton
              label="시작/종료 값 서로 바꾸기"
              onClick={handleSwap}
              className="absolute right-0 h-8 w-8"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </IconButton>
          </div>

          <MetricRow
            label="레벨"
            startName="startLevel"
            endName="endLevel"
            startValue={stats.startLevel}
            endValue={stats.endLevel}
            onChange={handleChange}
          />
          <MetricRow
            label="경험치"
            startName="startExp"
            endName="endExp"
            startValue={stats.startExp}
            endValue={stats.endExp}
            onChange={handleChange}
            grouped
          />
          <MetricRow
            label="메소"
            startName="startMeso"
            endName="endMeso"
            startValue={stats.startMeso}
            endValue={stats.endMeso}
            onChange={handleChange}
            grouped
          />
        </div>
      </Card>

      <Card>
        <ItemManager title="아이템 변동" items={items} onItemsChange={onItemsChange} />
      </Card>

      <Card>
        <label htmlFor="note" className="mb-1.5 block text-sm font-semibold text-text">
          노트
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="사냥터 자리, 같이 간 파티, 다음에 참고할 점 등"
          rows={3}
          className="field field-sunken resize-y"
        />
      </Card>
    </>
  );
}
