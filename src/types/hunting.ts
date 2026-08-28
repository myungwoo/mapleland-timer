import { Item } from '@/components/ItemManager';

export interface HuntingStats {
  location: string;
  startLevel: string;
  startExp: string;
  startMeso: string;
  endLevel: string;
  endExp: string;
  endMeso: string;
}

/**
 * 사냥 한 판의 정산 결과. 저장하지 않고 볼 때마다 다시 낸다.
 *
 * `*PerMinute` 은 반올림하지 않은 값이다. 표시 단위(1분/5분/1시간)를 곱한 **뒤에** 한 번만
 * 반올림해야 한다 — 분당으로 먼저 반올림하고 곱하면 5분당 596,828 이 596,830 으로 어긋난다.
 */
export interface HuntingResults {
  levelDiff: number;
  startExpPercentage: string;
  endExpPercentage: string;
  expGained: number;
  expPerMinute: number;
  rawMesoGained: number;
  netMesoGained: number;
  mesoPerMinute: number;
  itemStats: {
    name: string;
    diff: number;
    perMinute: number;
    value: number;
  }[];
}

export interface HuntingRecord {
  id: string;
  timestamp: number;
  duration: number;
  location: string;
  stats: HuntingStats;
  items: Item[];
  note: string;
}
