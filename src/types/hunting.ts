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

export interface HuntingRecord {
  id: string;
  timestamp: number;
  duration: number;
  location: string;
  stats: HuntingStats;
  items: Item[];
  note: string;
  results: {
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
      /** 아래 `expPerFiveMin` 과 같은 이유로 남겨 둔다. */
      perFiveMin?: number;
    }[];

    /**
     * 예전에는 분당이 아니라 5분당으로 쟀다.
     *
     * 지우지 않고 같이 써 둔다. 배포를 되돌리면 예전 화면이 이 값을 읽는데, 없으면 쌓아 둔
     * 기록이 전부 0 으로 보인다. `normalizeRecords` 가 반대 방향(예전 → 지금)을 맡는다.
     * 읽을 일은 없다 — 분당 값에서 그대로 유도된다.
     */
    expPerFiveMin?: number;
    mesoPerFiveMin?: number;
  };
}