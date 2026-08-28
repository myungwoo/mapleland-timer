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

/** 사냥 한 판의 정산 결과. 저장하지 않고 볼 때마다 다시 낸다. */
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
