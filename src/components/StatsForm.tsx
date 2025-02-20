'use client';

import { useState, useEffect } from 'react';
import ItemManager, { Item } from './ItemManager';
import { HuntingStats, HuntingRecord } from '@/types/hunting';

// 레벨별 필요 경험치 맵
const LEVEL_EXP_MAP: { [key: number]: number } = {
  1: 15, 2: 34, 3: 57, 4: 92, 5: 135, 6: 372, 7: 560, 8: 840, 9: 1242, 10: 1716,
  11: 2360, 12: 3216, 13: 4200, 14: 5460, 15: 7050, 16: 8840, 17: 11040, 18: 13716,
  19: 16680, 20: 20216, 21: 24402, 22: 28980, 23: 34320, 24: 40512, 25: 54900,
  26: 57210, 27: 63666, 28: 73080, 29: 83270, 30: 95700, 31: 108480, 32: 122760,
  33: 138666, 34: 155540, 35: 174216, 36: 194832, 37: 216600, 38: 240550, 39: 266682,
  40: 294216, 41: 324240, 42: 356916, 43: 391160, 44: 428280, 45: 468450, 46: 510420,
  47: 555680, 48: 604416, 49: 655200, 50: 709716, 51: 748608, 52: 789631, 53: 832902,
  54: 878545, 55: 926689, 56: 977471, 57: 1031036, 58: 1087536, 59: 1147132, 60: 1209904,
  61: 1276301, 62: 1346242, 63: 1420016, 64: 1497832, 65: 1579913, 66: 1666492,
  67: 1757185, 68: 1854143, 69: 1955750, 70: 2062925, 71: 2175973, 72: 2295216,
  73: 2420993, 74: 2553663, 75: 2693603, 76: 2841212, 77: 2996910, 78: 3161140,
  79: 3334370, 80: 3517903, 81: 3709827, 82: 3913127, 83: 4127556, 84: 4353756,
  85: 4592341, 86: 4844001, 87: 5109452, 88: 5389449, 89: 5684790, 90: 5996316,
  91: 6324914, 92: 6617519, 93: 7037118, 94: 7422752, 95: 7829518, 96: 8258575,
  97: 8711144, 98: 9188514, 99: 9620440, 100: 10223168, 101: 10783397, 102: 11374327,
  103: 11997640, 104: 12655110, 105: 13348610, 106: 14080113, 107: 14851703,
  108: 15665576, 109: 16524049, 110: 17429566, 111: 18384706, 112: 19392187,
  113: 20454878, 114: 21575805, 115: 22758159, 116: 24005306, 117: 25320796,
  118: 26708375, 119: 28171993, 120: 29715818, 121: 31344244, 122: 33061908,
  123: 34873700, 124: 36784778, 125: 38800583, 126: 40926854, 127: 43169645,
  128: 45535341, 129: 48030677, 130: 50662758, 131: 53439077, 132: 56367538,
  133: 59456479, 134: 62714694, 135: 66151459, 136: 69776558, 137: 73600313,
  138: 77633610, 139: 81887931, 140: 86375389, 141: 91108760, 142: 96101520,
  143: 101367883, 144: 106922842, 145: 112782213, 146: 118962678, 147: 125481832,
  148: 132358236, 149: 139611467, 150: 147262175, 151: 155332142, 152: 163844343,
  153: 172823012, 154: 182293713, 155: 192283408, 156: 202820538, 157: 213935103,
  158: 225658746, 159: 238024845, 160: 251068606, 161: 264827165, 162: 279339693,
  163: 294647508, 164: 310794191, 165: 327825712, 166: 345790561, 167: 364739883,
  168: 384727628, 169: 405810702, 170: 428049128, 171: 451506220, 172: 476248760,
  173: 502347192, 174: 529875818, 175: 558913012, 176: 589541445, 177: 621848316,
  178: 655925603, 179: 691870326, 180: 729784819, 181: 769777027, 182: 811960808,
  183: 856456260, 184: 903390063, 185: 952895838, 186: 1005114529, 187: 1060194805,
  188: 1118293480, 189: 1179575962, 190: 1244216724, 191: 1312399800, 192: 1384319309,
  193: 1460180007, 194: 1540197871, 195: 1624600714, 196: 1713628833, 197: 1807535693,
  198: 1906588648, 199: 2011069705, 200: 2121276324
};

interface StatsFormProps {
  elapsedTime: number;
  onSave: (record: HuntingRecord) => void;
}

// localStorage 키
const STORAGE_KEYS = {
  STATS: 'maple-timer-stats',
  ITEMS: 'maple-timer-items'
} as const;

export default function StatsForm({ elapsedTime, onSave }: StatsFormProps) {
  const [stats, setStats] = useState<HuntingStats>(() => {
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
      return savedStats ? JSON.parse(savedStats) : {
        location: '',
        startLevel: '',
        startExp: '',
        startMeso: '',
        endLevel: '',
        endExp: '',
        endMeso: ''
      };
    }
    return {
      location: '',
      startLevel: '',
      startExp: '',
      startMeso: '',
      endLevel: '',
      endExp: '',
      endMeso: ''
    };
  });

  const [items, setItems] = useState<Item[]>(() => {
    if (typeof window !== 'undefined') {
      const savedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return savedItems ? JSON.parse(savedItems) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStats(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    if (window.confirm('모든 데이터를 초기화하시겠습니까?')) {
      setStats({
        location: '',
        startLevel: '',
        startExp: '',
        startMeso: '',
        endLevel: '',
        endExp: '',
        endMeso: ''
      });
      setItems([]);
    }
  };

  const handleSave = () => {
    if (!stats.location.trim()) {
      alert('사냥터 이름을 입력해주세요.');
      return;
    }

    const results = calculateResults();
    const record: HuntingRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      duration: elapsedTime,
      location: stats.location,
      stats,
      items,
      results
    };

    onSave(record);
  };

  const calculateExpPercentage = (exp: number, level: number) => {
    const requiredExp = LEVEL_EXP_MAP[level] || 0;
    if (requiredExp === 0) return 0;
    return ((exp / requiredExp) * 100).toFixed(2);
  };

  const calculateItemStats = (items: Item[], minutesElapsed: number) => {
    return items.map(item => {
      const startCount = parseInt(item.startCount) || 0;
      const endCount = parseInt(item.endCount) || 0;
      const price = parseInt(item.price) || 0;
      const diff = endCount - startCount;
      const perFiveMin = minutesElapsed > 0 ? (diff / minutesElapsed) * 5 : 0;

      return {
        name: item.name,
        diff,
        perFiveMin: Math.round(perFiveMin * 100) / 100,
        value: diff * price
      };
    });
  };

  const calculateResults = () => {
    const startLevelNum = parseInt(stats.startLevel) || 0;
    const endLevelNum = parseInt(stats.endLevel) || 0;
    const startExpNum = parseInt(stats.startExp) || 0;
    const endExpNum = parseInt(stats.endExp) || 0;
    const startMesoNum = parseInt(stats.startMeso) || 0;
    const endMesoNum = parseInt(stats.endMeso) || 0;

    const levelDiff = endLevelNum - startLevelNum;

    // 총 획득 경험치 계산
    let totalExpGained = 0;

    if (levelDiff === 0) {
      totalExpGained = endExpNum - startExpNum;
    } else if (levelDiff > 0) {
      totalExpGained = (LEVEL_EXP_MAP[startLevelNum] || 0) - startExpNum;

      for (let level = startLevelNum + 1; level < endLevelNum; level++) {
        totalExpGained += LEVEL_EXP_MAP[level] || 0;
      }

      totalExpGained += endExpNum;
    }

    const minutesElapsed = elapsedTime / 60;
    const expPerFiveMin = minutesElapsed > 0 ? (totalExpGained / minutesElapsed) * 5 : 0;

    // 메소 계산
    const rawMesoGained = endMesoNum - startMesoNum;
    const itemStats = calculateItemStats(items, minutesElapsed);
    const itemValueChange = itemStats.reduce((sum, item) => sum + item.value, 0);
    const netMesoGained = rawMesoGained + itemValueChange;
    const mesoPerFiveMin = minutesElapsed > 0 ? (netMesoGained / minutesElapsed) * 5 : 0;

    return {
      levelDiff,
      startExpPercentage: calculateExpPercentage(startExpNum, startLevelNum).toString(),
      endExpPercentage: calculateExpPercentage(endExpNum, endLevelNum).toString(),
      expGained: totalExpGained,
      expPerFiveMin: Math.round(expPerFiveMin),
      rawMesoGained,
      itemStats,
      netMesoGained,
      mesoPerFiveMin: Math.round(mesoPerFiveMin)
    };
  };

  const results = calculateResults();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">사냥 입력</h2>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          초기화
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">사냥터</label>
        <input
          type="text"
          name="location"
          value={stats.location}
          onChange={handleChange}
          placeholder="사냥터 이름을 입력하세요"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <h3 className="font-semibold">시작</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">레벨</label>
            <input
              type="number"
              name="startLevel"
              value={stats.startLevel}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">경험치</label>
            <input
              type="number"
              name="startExp"
              value={stats.startExp}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">메소</label>
            <input
              type="number"
              name="startMeso"
              value={stats.startMeso}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">종료</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">레벨</label>
            <input
              type="number"
              name="endLevel"
              value={stats.endLevel}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">경험치</label>
            <input
              type="number"
              name="endExp"
              value={stats.endExp}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">메소</label>
            <input
              type="number"
              name="endMeso"
              value={stats.endMeso}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <ItemManager
          title="아이템 변동"
          items={items}
          onItemsChange={setItems}
        />
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">결과</h3>
        <ul className="space-y-4">
          <li className="pb-3 border-b">
            <div className="font-medium mb-2">레벨 업: {results.levelDiff} 레벨</div>
            <ul className="ml-4 space-y-1 text-sm">
              <li>시작: Lv.{stats.startLevel} ({results.startExpPercentage}%)</li>
              <li>종료: Lv.{stats.endLevel} ({results.endExpPercentage}%)</li>
            </ul>
          </li>

          <li className="pb-3 border-b">
            <div className="font-medium mb-2">경험치</div>
            <ul className="ml-4 space-y-1 text-sm">
              <li>총 획득: {results.expGained.toLocaleString()}</li>
              <li>5분당: {results.expPerFiveMin.toLocaleString()}</li>
            </ul>
          </li>

          <li className="pb-3 border-b">
            <div className="font-medium mb-2">메소</div>
            <ul className="ml-4 space-y-1 text-sm">
              <li>총 획득: {results.rawMesoGained.toLocaleString()} 메소</li>
              <li>5분당: {Math.round(results.rawMesoGained / (elapsedTime / 60) * 5).toLocaleString()} 메소</li>
            </ul>
          </li>

          {results.itemStats.length > 0 && (
            <li className="pb-3 border-b">
              <div className="font-medium mb-2">아이템</div>
              <ul className="ml-4 space-y-2 text-sm">
                {results.itemStats.map((item, index) => (
                  <li key={index}>
                    <div className="font-medium text-gray-700">{item.name}</div>
                    <ul className="ml-4 space-y-1">
                      <li>총 {item.diff > 0 ? '획득' : '사용'}: {Math.abs(item.diff).toLocaleString()}개</li>
                      <li>5분당 {item.diff > 0 ? '획득' : '사용'}: {Math.abs(item.perFiveMin).toLocaleString()}개</li>
                      <li className="text-gray-500">가치: {item.value.toLocaleString()} 메소</li>
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          )}

          <li>
            <div className="font-medium mb-2">순수익</div>
            <ul className="ml-4 space-y-1 text-sm">
              <li className="font-medium text-blue-600">총 순수익: {results.netMesoGained.toLocaleString()} 메소</li>
              <li className="font-medium text-blue-600">5분당 순수익: {results.mesoPerFiveMin.toLocaleString()} 메소</li>
            </ul>
          </li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          기록 저장
        </button>
      </div>
    </div>
  );
}