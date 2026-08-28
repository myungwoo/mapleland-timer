import { Item } from '@/components/ItemManager';
import { HuntingRecord, HuntingResults, HuntingStats } from '@/types/hunting';

export const EMPTY_STATS: HuntingStats = {
  location: '',
  startLevel: '',
  startExp: '',
  startMeso: '',
  endLevel: '',
  endExp: '',
  endMeso: '',
};

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

/** 레벨 대비 경험치를 퍼센트 문자열로. 모르는 레벨이면 0. */
export const calculateExpPercentage = (exp: number, level: number) => {
  const requiredExp = LEVEL_EXP_MAP[level] || 0;
  if (requiredExp === 0) return '0';
  return ((exp / requiredExp) * 100).toFixed(2);
};

/** 소수 둘째 자리까지. 개수는 분당으로 보면 소수가 되는 일이 잦다. */
const round2 = (value: number) => Math.round(value * 100) / 100;

const calculateItemStats = (items: Item[], minutesElapsed: number) =>
  items.map(item => {
    const startCount = parseInt(item.startCount) || 0;
    const endCount = parseInt(item.endCount) || 0;
    const price = parseInt(item.price) || 0;
    const diff = endCount - startCount;
    const perMinute = minutesElapsed > 0 ? diff / minutesElapsed : 0;

    return {
      name: item.name,
      diff,
      perMinute: round2(perMinute),
      value: diff * price,
    };
  });

/**
 * 사냥 한 판의 정산 결과. 입력은 전부 문자열이라 숫자로 못 읽히면 0으로 본다.
 *
 * 순수 함수라 언제 불러도 같은 답이 나온다. 그래서 결과를 기록에 넣어 두지 않고 볼 때마다
 * 다시 낸다 — 저장해 두면 수치의 뜻을 바꿀 때마다(5분당 → 분당처럼) 쌓인 기록을 전부
 * 손봐야 한다. 계산식은 최초 커밋 이후 바뀐 적이 없어서, 옛 기록을 다시 계산해도 그때
 * 보이던 숫자가 그대로 나온다.
 */
export const calculateResults = (
  stats: HuntingStats,
  items: Item[],
  elapsedTime: number,
): HuntingResults => {
  const startLevelNum = parseInt(stats.startLevel) || 0;
  const endLevelNum = parseInt(stats.endLevel) || 0;
  const startExpNum = parseInt(stats.startExp) || 0;
  const endExpNum = parseInt(stats.endExp) || 0;
  const startMesoNum = parseInt(stats.startMeso) || 0;
  const endMesoNum = parseInt(stats.endMeso) || 0;

  const levelDiff = endLevelNum - startLevelNum;

  // 총 획득 경험치: 레벨이 올랐으면 시작 레벨의 남은 경험치 + 사이 레벨 전체 + 종료 레벨의 경험치
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
  const expPerMinute = minutesElapsed > 0 ? totalExpGained / minutesElapsed : 0;

  const rawMesoGained = endMesoNum - startMesoNum;
  const itemStats = calculateItemStats(items, minutesElapsed);
  const itemValueChange = itemStats.reduce((sum, item) => sum + item.value, 0);
  const netMesoGained = rawMesoGained + itemValueChange;
  const mesoPerMinute = minutesElapsed > 0 ? netMesoGained / minutesElapsed : 0;

  return {
    levelDiff,
    startExpPercentage: calculateExpPercentage(startExpNum, startLevelNum),
    endExpPercentage: calculateExpPercentage(endExpNum, endLevelNum),
    expGained: totalExpGained,
    expPerMinute: Math.round(expPerMinute),
    rawMesoGained,
    itemStats,
    netMesoGained,
    mesoPerMinute: Math.round(mesoPerMinute),
  };
};

/** 저장된 기록의 정산 결과. 기록은 재료(stats·items·duration)만 들고 있다. */
export const resultsOf = (record: HuntingRecord): HuntingResults =>
  calculateResults(record.stats, record.items, record.duration);

/** 순수 메소만 따진 분당 수익(아이템 가치 제외). */
export const rawMesoPerMinute = (rawMesoGained: number, elapsedTime: number) => {
  const minutesElapsed = elapsedTime / 60;
  return minutesElapsed > 0 ? Math.round(rawMesoGained / minutesElapsed) : 0;
};

/** 초 단위 시간을 시:분:초 두 자리로. */
export const formatClock = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return { hours: '00', minutes: '00', seconds: '00' };
  }
  return {
    hours: Math.floor(totalSeconds / 3600).toString().padStart(2, '0'),
    minutes: Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0'),
    seconds: (totalSeconds % 60).toString().padStart(2, '0'),
  };
};
