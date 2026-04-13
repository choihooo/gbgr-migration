# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 작업할 때 참고하는 가이드입니다.

**중요:** 이 프로젝트에서는 모든 커밋 메시지, 이슈, PR 설명을 **한국어**로 작성합니다.

---

## 📋 필수 명령어

### 개발
```bash
# 의존성 설치 (pnpm 9.0.0+ 필요)
pnpm install

# 개발 서버 실행 (Main + Renderer 동시 빌드 및 실행)
pnpm dev

# Renderer만 개별 실행
pnpm dev:renderer
```

### 빌드
```bash
# 전체 빌드 (Main + Preload + Renderer)
pnpm build

# 개별 프로세스 빌드
pnpm build:main       # Electron 메인 프로세스
pnpm build:preload    # 프리로드 스크립트
pnpm build:renderer   # React 앱
```

### 실행
```bash
# 프로덕션 빌드 후 실행
pnpm start:prod

# 프로덕션 모드로 실행 (빌드 포함)
pnpm start
```

### 플랫폼별 패키징
```bash
pnpm build:mac        # macOS용 설치 파일
pnpm build:win        # Windows용 설치 파일
pnpm build:all        # 전체 플랫폼
```

### 코드 품질
```bash
# Lint 및 자동 수정
pnpm lint

# Lint 검사만
pnpm lint:check

# 포맷팅
pnpm format

# 타입 체크
pnpm typecheck           # 전체
pnpm typecheck:main      # Main 프로세스만
pnpm typecheck:preload   # Preload만
pnpm typecheck:renderer  # Renderer만
```

---

## 🏗️ 아키텍처 개요

### Electron 프로세스 구조

이 프로젝트는 **세 개의 독립적인 프로세스**로 구성됩니다:

1. **Main Process** (`src/main/`)
   - Electron 메인 프로세스, 윈도우 관리
   - GA4 이벤트 전송 (Measurement Protocol)
   - IPC 핸들러, 알림 관리

2. **Preload** (`src/preload/`)
   - Context Bridge로 보안된 API 노출
   - Renderer → Main IPC 통신 중계

3. **Renderer Process** (`src/renderer/`)
   - React UI 애플리케이션
   - 자세 분석, 대시보드, 위젯

### 핵심 아키텍처 패턴

**FSD (Feature-Sliced Design) 기반 구조:**
```
src/renderer/src/
├── entities/          # 비즈니스 엔티티 (user, session, posture, dashboard)
│   ├── user/         # 인증, 사용자 정보
│   ├── session/      # 세션 관리, 메트릭 전송
│   ├── posture/      # 자세 분석 엔진 (PostureClassifier, ScoreProcessor)
│   └── dashboard/    # 대시보드 데이터 쿼리
├── features/          # 사용자 기능 (calibration, notification, dashboard UI)
├── shared/            # 공유 라이브러리 (UI, analytics, api)
└── widgets/           # 위젯 관련
```

**상태 관리 전략:**
- **Zustand**: 클라이언트 상태 (자세, 카메라, 알림 설정)
  - `usePostureStore`: 실시간 자세 상태
  - `useCameraStore`: 카메라 표시/숨김
  - `useNotificationStore`: 알림 설정
- **TanStack Query**: 서버 상태 (대시보드 데이터, 세션)
- **localStorage**: 윈도우 간 동기화 (자세 상태, 활성 추적)

### 다중 윈도우 동기화 (중요)

메인 윈도우와 위젯 간 상태 동기화는 **localStorage의 storage 이벤트**로 구현:

```typescript
// 메인 창: 상태 변경 시 localStorage에 타임스탬프 기록
localStorage.setItem('mainWindowActiveAt', Date.now().toString());

// 위젯: storage 이벤트로 메인 창 활성 상태 감지
window.addEventListener('storage', (e) => {
  if (e.key === 'mainWindowActiveAt') {
    const lastActive = Number(e.newValue);
    const isMainActive = Date.now() - lastActive < 2000;
    // 메인이 활성화되어 있으면 위젯은 판정하지 않고 동기화만 수행
  }
});
```

**스마트 판정 전략:**
- 메인 창 활성화 시: 위젯은 판정을 하지 않고 메인 결과만 동기화
- 메인 창 비활성화 시: 위젯이 독립적으로 자세 판정 수행

---

## 🔑 핵심 기술적 의사결정

### 자세 분석 파이프라인

실시간 자세 분석을 위한 다단계 처리 파이프라인:

1. **MediaPipe Vision**: 신체 키포인트 추출
2. **PI (Posture Index) 계산**: 정량적 자세 평가
3. **ScoreProcessor**: 다단계 스무딩
   - Moving Average → EMA(30) → EMA(70)
   - 히스테리시스 로직 (enter_bad: 1.2, exit_bad: 0.8)
   - 점수 클램핑 (-10 ~ 40)
4. **PostureClassifier**: 최종 자세 분류 (거북목/기린/등급)

**캘리브레이션 신뢰성 확보:**
- `trimmedStats`: 상하 5% 절사 평균으로 이상치 제거
- `errorChecks`: 밝기, 자세 안정성 검증
- 측정 횟수: 100회 샘플링

### GA4 이벤트 추적 구조

**보안을 위해 Renderer가 GA SDK를 직접 호출하지 않음:**

```
Renderer logEvent
  → preload contextBridge
  → IPC
  → Main Process
  → GA4 Measurement Protocol
```

**필수 환경변수 (루트 .env):**
```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=YOUR_API_SECRET  # Main 프로세스에서만 사용
GA4_DEBUG_MP=true               # DebugView 활성화
```

**이벤트 중복 방지:**
- localStorage 플래그로 전송 여부 추적 (`ga_onboarding_enter_sent`, `ga_measure_page_enter_sent` 등)
- 로그아웃/계정 전환 시 `clearAnalyticsFlags()`로 플래그 정리
- 플래그 설정은 **이벤트 전송 전**에 수행 (레이스 컨디션 방지)

### 성능 최적화

- MediaPipe `detectForVideo`: 프레임별 호출로 중복 처리 방지
- 다단계 스무딩으로 채터링 방지
- 위젯과 메인의 판정 중복 방지 (스마트 전략)
- Recharts lazy loading으로 초기 번들 크기 최적화

---

## 📁 주요 파일 및 디렉토리

### 핵심 비즈니스 로직
- `src/renderer/src/entities/posture/lib/PostureClassifier.ts`: 자세 분류 엔진
- `src/renderer/src/entities/posture/lib/ScoreProcessor.ts`: 점수 처리 파이프라인
- `src/renderer/src/entities/posture/lib/calculations.ts`: PI 계산, EMA 스무딩
- `src/renderer/src/entities/posture/lib/errorChecks.ts`: 캘리브레이션 검증

### 상태 관리
- `src/renderer/src/entities/posture/api/usePostureStore.ts`: 자세 상태 (Zustand)
- `src/renderer/src/widgets/camera/lib/useCameraStore.ts`: 카메라 상태 (Zustand)
- `src/renderer/src/features/notification/lib/useNotificationStore.ts`: 알림 설정 (Zustand)

### 커스텀 훅
- `src/renderer/src/features/dashboard/hooks/useAutoMetricsSender.ts`: 5분마다 자동 메트릭 전송
- `src/renderer/src/features/dashboard/hooks/useSessionCleanup.ts`: 세션 정리
- `src/renderer/src/widgets/widget/lib/useWidget.ts`: 위젯 상태 관리

### 공유 라이브러리
- `src/renderer/src/shared/lib/analytics/`: GA4 이벤트 추적
- `src/renderer/src/shared/lib/analytics/storage-keys.ts`: localStorage 키 상수
- `src/renderer/src/shared/lib/analytics/validation.ts`: 검증 헬퍼 함수
- `src/renderer/src/shared/lib/analytics/cleanup.ts`: 플래그 클린업 함수
- `src/renderer/src/shared/lib/calibration-gate.ts`: 캘리브레이션 게이트
- `src/renderer/src/shared/api/instance.ts`: Axios 인스턴스, 토큰 리프레시

---

## 🎨 개발 규칙

### 컴포넌트 설계
- **Pages**: 비즈니스 로직, 데이터 페칭 담당
- **Components**: UI 표현에 집중, 최대한 순수 함수로 작성
- `clsx` + `tailwind-merge`로 조건부 스타일링

### GA 이벤트 추가 시 체크리스트
1. `src/renderer/src/shared/lib/analytics/schema.ts`에 타입 정의
2. `src/renderer/src/shared/lib/analytics/events.ts`에 이벤트 함수 추가
3. 중복 방지가 필요한 경우 `storage-keys.ts`에 키 추가
4. userId/sessionId 검증 시 `validation.ts` 헬퍼 함수 사용
5. 로그아웃 시 정리가 필요한 플래그는 `cleanup.ts`에 추가

### 커밋 컨벤션 (한국어)
```
feat(ga): 새로운 GA 이벤트 추가
fix(auth): 로그인 토큰 갱신 로직 수정
refactor(posture): 자세 분석 코드 리팩토링
docs: README 업데이트
```

### PR 템플릿 사용
- `.github/PULL_REQUEST_TEMPLATE.md` 참고
- AS-IS / TO-BE 형식으로 변경사항 명확히 작성

---

## 🧪 테스트 및 디버깅

### GA4 DebugView
1. `.env`에 `GA4_DEBUG_MP=true` 설정
2. Main 프로세스 터미널에서 `debug/mp/collect` 응답 확인
3. GA4 DebugView에서 실시간 이벤트 확인

### 개발자 콘솔 로그
- GA 이벤트: `[analytics]` 접두사
- 자세 분석: `[posture]` 접두사
- 세션 관리: `[session]` 접두사

---

## ⚠️ 주의사항

1. **환경변수 필수**: 루트 `.env`에 GA4 관련 환경변수 필수
2. **타임스탬프 검증**: GA 이벤트 전송 시 서버/클라이언트 타임스탬프 폴백 로직 필수
3. **플래그 클린업**: 로그아웃/계정 전환 시 GA 플래그 정리 필수
4. **위젯 동기화**: 메인 창 활성화 시 위젯이 판정하지 않도록 주의
5. **섀도잉 방지**: 변수명 중복 섀도잉 주의 (예: `userId` → `storedUserId`)

---

## 🔗 참고 링크

- [electron-vite](https://github.com/electron-vite/electron-vite-react): 보일러플레이트
- [MediaPipe Vision](https://github.com/google/mediapipe): 자세 인식 라이브러리
- [Zustand](https://zustand-demo.pmnd.rs/): 상태 관리
- [TanStack Query](https://tanstack.com/query/latest): 서버 상태 관리
