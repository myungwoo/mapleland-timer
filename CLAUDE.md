# 메이플랜드 사냥 타이머

사냥 한 판의 시간을 재고 경험치·메소 수익을 정산하는 정적 웹앱. 서버가 없고 데이터는
전부 브라우저에 남는다.

```bash
npm run dev     # 개발 서버
npm run lint
npm run build   # 정적 내보내기 → out/
```

## 깨뜨리면 안 되는 것

### 1. localStorage 키는 오리진을 공유한다

이 앱은 **다른 유틸들과 브라우저 저장소를 공유한다.**

- `https://myungwoo.github.io/mapleland-timer/` — 다른 프로젝트 페이지들과 오리진
  (`myungwoo.github.io`)이 같다.
- `https://mapleland.myungwoo.kr/hunt/` —
  [메이플랜드 유틸 모음](https://github.com/myungwoo/mapleland-utils)이 유틸 다섯 개를
  한 도메인의 하위 경로로 함께 배포한다.

**localStorage 는 오리진 단위다. 경로로 갈라지지 않는다.** `/hunt` 와 `/damage` 는 같은
저장소를 본다. 접두어 없는 키는 다른 유틸의 값을 조용히 덮어쓴다.

- **앱 전용 값은 `ml:hunt:` 로 시작한다.** 키는 `src/constants/storage.ts` 한 곳에만 적는다
  — 예전에 `page.tsx` 와 `StatsForm.tsx` 에 같은 키가 따로 적혀 있었고, 그런 상태로는
  한쪽만 고쳐도 티가 안 난다.
- **테마는 일부러 공유한다.** 키는 `ml:theme`, 값은 `'light' | 'dark' | 'system'`.
  같은 사이트인데 유틸마다 다크모드를 따로 기억하면 화면이 튄다. 대신 **모르는 값은
  시스템 설정으로 보고 덮어쓰지 않는다** — 데미지 계산기가 이 앱의 `'system'` 선택을
  덮어써서 지우던 버그가 실제로 있었다. `src/app/layout.tsx` 의 프리-페인트 스크립트와
  `ThemeToggle` 이 같은 규칙을 지켜야 한다.
- **키를 바꿀 때 예전 키를 지우지 않는다.** 새 키가 비어 있을 때만 한 번 복사한다
  (`migrateLegacyStorageKeys`). 배포를 되돌려도 사냥 기록이 남아 있어야 하고, 그래야
  여러 번 돌아도 결과가 같다.

### 2. 시간은 실제 시계로 계산한다

`setInterval` 횟수를 세면 탭이 백그라운드로 가거나 브라우저가 절전에 들어갈 때 어긋난다.
저장한 시작 시각과 현재 시각의 차이로 계산해야 브라우저를 닫았다 열어도 이어진다.

### 3. 서버가 없다

`output: "export"` 정적 빌드다. 라우트 핸들러·서버 액션·미들웨어를 넣으면 빌드가 깨진다.
`basePath` 는 배포하는 쪽이 `NEXT_PUBLIC_BASE_PATH` 로 주입한다(`next.config.ts`).
경로 하나에 묶이지 않아야 하므로, `public/` 에셋은 `'./alert.mp3'` 처럼 상대경로로 쓴다.
