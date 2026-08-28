/**
 * localStorage 키를 한곳에 모아 둔다.
 *
 * mapleland.myungwoo.kr 은 유틸 여러 개가 한 오리진을 공유한다(myungwoo.github.io 의
 * 프로젝트 페이지들도 마찬가지다). 앱 전용 값에 `ml:hunt:` 접두어를 안 붙이면 다른
 * 유틸의 키와 부딪힌다.
 */
export const STORAGE_KEY = {
  RECORDS: 'ml:hunt:records',
  STATS: 'ml:hunt:stats',
  ITEMS: 'ml:hunt:items',
  TIMER: 'ml:hunt:timer',
  NOTE: 'ml:hunt:note',
  RATE: 'ml:hunt:rate',
} as const;

/**
 * 테마는 반대로 **일부러 공유한다.**
 *
 * 같은 사이트인데 유틸마다 다크모드가 따로 기억되면 화면이 튄다. 그래서 접두어 없이
 * 사이트 전역 키를 쓰고, 값 집합('light' | 'dark' | 'system')을 다른 유틸과 맞춘다.
 * 모르는 값은 시스템 설정으로 취급하고 **덮어쓰지 않는다** — 덮어쓰면 다른 유틸에서
 * 고른 설정이 사라진다.
 */
export const THEME_STORAGE_KEY = 'ml:theme';

/** 접두어를 붙이기 전에 쓰던 키들. */
export const LEGACY_THEME_STORAGE_KEY = 'theme';

const LEGACY_KEYS: Record<string, string> = {
  'maple-timer-records': STORAGE_KEY.RECORDS,
  'maple-timer-stats': STORAGE_KEY.STATS,
  'maple-timer-items': STORAGE_KEY.ITEMS,
  'maple-timer-state': STORAGE_KEY.TIMER,
  'maple-timer-note': STORAGE_KEY.NOTE,
};

/**
 * 예전 키에 있던 값을 새 키로 한 번 옮긴다.
 *
 * 새 키가 비어 있을 때만 복사하고, 옛 키는 지우지 않는다 — 배포를 되돌릴 일이 생겨도
 * 사냥 기록이 남아 있어야 한다. localStorage 를 읽기 전에 불러야 한다.
 */
export const migrateLegacyStorageKeys = () => {
  try {
    for (const [legacyKey, key] of Object.entries(LEGACY_KEYS)) {
      if (localStorage.getItem(key) !== null) continue;

      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null) localStorage.setItem(key, legacyValue);
    }
  } catch {
    // 시크릿 모드처럼 localStorage 가 막힌 환경에서는 그냥 넘어간다.
  }
};
