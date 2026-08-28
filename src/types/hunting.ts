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

/**
 * 예전 배포가 읽던 정산 결과.
 *
 * **지금 화면은 이 값을 읽지 않는다.** 기록을 그릴 때마다 stats/items/duration 에서 다시
 * 낸다(`resultsOf`). 그런데도 계속 저장하는 이유는 배포를 되돌릴 때다 — 예전 화면은
 * `record.results.expGained` 를 곧바로 읽어서, 이게 없으면 0 으로 보이는 정도가 아니라
 * 기록 목록 전체가 예외로 죽는다.
 */
export interface LegacyResults {
  levelDiff: number;
  startExpPercentage: string;
  endExpPercentage: string;
  expGained: number;
  expPerFiveMin: number;
  rawMesoGained: number;
  netMesoGained: number;
  mesoPerFiveMin: number;
  itemStats: {
    name: string;
    diff: number;
    perFiveMin: number;
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
  /** 되돌린 배포만 읽는다. 쓰기 전용 — 화면은 `resultsOf` 로 다시 계산한다. */
  results?: LegacyResults;
}
