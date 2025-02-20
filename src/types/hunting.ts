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
  };
}