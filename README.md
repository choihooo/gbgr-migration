# GBGR (거부기린)

> 실시간 웹캠 자세 인식을 통해 거북목과 같은 잘못된 자세를 교정하고 사용자에게 통계 피드백을 제공하는 데스크탑 애플리케이션

<p align="center">
  <img src="bg.png" alt="거부기린 아이콘"  />
</p>

---

## 🔗 데모 & 자료

- 서비스 다운로드 페이지: [https://choihooo.github.io/bugi-download/](https://choihooo.github.io/bugi-download/)

---

## ✨ 핵심 요약 (TL;DR)

- **문제 인식**: 장시간 컴퓨터 사용으로 인해 무의식적으로 자세가 흐트러져 거북목, 어깨 비대칭 등의 문제를 겪는 사용자가 많습니다.
- **핵심 해결 전략**:
  - 웹캠을 통해 사용자의 자세를 실시간으로 분석하고 시각적으로 피드백합니다.
  - 잘못된 자세가 감지되면 알림을 보내 즉각적인 교정을 유도합니다.
  - 세션별 자세 데이터를 기록하고 통계 대시보드를 제공하여 장기적인 습관 개선을 돕습니다.
- **프론트엔드 기술 포인트**:
  - `@mediapipe/tasks-vision`을 활용하여 웹캠 영상에서 실시간으로 신체 키포인트를 추출하고 자세를 분석합니다.
  - `Zustand`를 사용해 세션, 알림, 카메라 등 복잡한 클라이언트 상태를 효율적으로 관리합니다.
  - `Recharts`를 이용해 사용자의 자세 점수, 패턴 등 통계 데이터를 시각화하여 제공합니다.
  - `Electron`의 IPC 통신을 활용하여 메인 윈도우와 위젯 간의 상태를 동기화합니다.

---

## 🧩 주요 기능

1. **실시간 자세 분석 및 위젯**
   - 설명: 웹캠을 통해 사용자의 자세를 실시간으로 분석하고, MediaPipe를 활용해 신체 키포인트를 추출합니다. 메인 화면과 데스크탑 위젯을 통해 현재 자세 상태(거북목/기린)를 실시간으로 확인하고 세션을 제어할 수 있습니다. 위젯은 항상 위에 표시되며 크기 조절이 가능합니다.
   - 기술 포인트: `react-webcam`, `@mediapipe/tasks-vision`, Electron `BrowserWindow`, `PostureClassifier`
   - 주요 특징:
     - PI(Posture Index) 계산을 통한 정량적 자세 평가
     - EMA(Exponential Moving Average) 스무딩으로 노이즈 제거
     - ScoreProcessor를 통한 다단계 스무딩 (Moving Average → EMA(30) → EMA(70))
     - 히스테리시스 로직으로 채터링 방지 (enter_bad: 1.2, exit_bad: 0.8)
     - 정면성 검사(roll, centerRatio)로 측정 신뢰도 보장
     - **위젯 독립 동작**: 메인 창이 없어도 위젯만으로 자세 판정 가능
     - **스마트 동기화**: 메인 창이 활성화되어 있으면 위젯은 판정을 하지 않고 동기화만 수행

2. **캘리브레이션 시스템**
   - 설명: 사용자 개인의 정상 자세를 기준으로 설정하는 캘리브레이션 기능입니다. 측정 중 밝기, 자세 안정성 등을 검사하여 신뢰할 수 있는 기준값을 확보합니다.
   - 기술 포인트: `trimmedStats` (상하 5% 절사 평균 및 표준편차), `errorChecks` (밝기/안정성 검증)

3. **통계 대시보드**
   - 설명: 일별, 주별 데이터를 기반으로 자세 점수 변화, 주요 자세 패턴, 출석률, 평균 자세 점수, 레벨 진행도 등을 시각적으로 분석합니다. Recharts를 활용한 다양한 차트로 사용자의 장기적인 자세 개선 추이를 확인할 수 있습니다.
   - 기술 포인트: `TanStack Query` (서버 데이터 캐싱 및 동기화), `Recharts` (차트 시각화)
   - 주요 패널:
     - 평균 자세 점수 그래프 (시간대별 추이)
     - 자세 패턴 분석 (거북목/기린 비율)
     - 출석률 및 연속 출석 일수
     - 레벨 진행도 및 달성률

4. **자세 교정 알림**
   - 설명: 거북목이나 비대칭 자세가 일정 시간 이상 지속되면 데스크탑 알림을 보내 사용자가 인지하고 바로잡을 수 있도록 돕습니다. 알림 강도와 주기를 사용자가 설정할 수 있습니다.
   - 기술 포인트: Electron `Notification` API, `useNotificationScheduler` 훅, `Zustand` (알림 상태 관리)

5. **세션 관리**
   - 설명: 자세 측정 세션을 시작, 일시정지, 재개, 종료할 수 있습니다. 세션 중 수집된 메트릭 데이터는 주기적으로 서버에 저장되며, 세션 종료 시 리포트를 제공합니다.
   - 기술 포인트: `useAutoMetricsSender` (자동 메트릭 전송), `useSessionCleanup` (세션 정리)

---

## 🛠 기술 스택

### Frontend

- **Framework**: `Electron`, `React`
- **Language**: `TypeScript`
- **State Management**: `Zustand`, `TanStack Query`
- **Styling**: `Tailwind CSS`
- **Build/Bundle**: `Vite`
- **Pose Detection**: `@mediapipe/tasks-vision`

### 협업 & 기타

- **Version Control**: `Git`, GitHub
- **CI**: `GitHub Actions`
- **Package Manager**: `pnpm`
- **Linting & Formatting**: `Biome`
- **Form Validation**: `react-hook-form`, `zod`
- **Animation**: `framer-motion`
- **Routing**: `react-router-dom`

## 📐 개발 규약

- 프로젝트 헌법: `.specify/memory/constitution.md`
- Renderer는 Node/Electron API에 직접 접근하지 않고, preload `contextBridge` 계약을 통해서만 시스템 기능을 사용합니다.
- Renderer 구조는 FSD 레이어 규칙을 따르며, 클라이언트 상태는 `Zustand`, 서버 상태는 `TanStack Query`로 분리합니다.
- 머지 기준은 `Biome check`, `TypeScript typecheck`, `build` 검증 통과입니다.
- 태그 릴리즈는 `vX.Y.Z` 규칙을 사용하며 macOS/Windows 빌드와 업데이트 메타데이터 업로드가 모두 완료되어야 합니다.

---

## 📈 Google Analytics (GA4)

현재 앱의 분석 이벤트는 **Renderer에서 GA SDK를 직접 호출하지 않고**, 아래 경로로 전송됩니다.

`renderer logEvent -> preload contextBridge -> ipc -> main -> GA4 Measurement Protocol`

### 필수 환경변수 (루트 `.env`)

```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=YOUR_API_SECRET
GA4_DEBUG_MP=true
```

- `GA4_API_SECRET`은 Main 프로세스에서만 사용되며 Renderer 번들에 포함되지 않습니다.
- 자동 `page_view`/URL 기반 추적은 사용하지 않고, 퍼널/핵심 행동 이벤트만 전송합니다.

### DebugView 확인

- `GA4_DEBUG_MP=true`일 때:
  - `mp/collect` 전송 시 `debug_mode`가 포함되어 DebugView 확인 가능
  - `debug/mp/collect` 검증 응답이 메인 터미널에 출력됨

---

## 📁 프로젝트 구조

Electron 프로젝트는 일반적으로 **Main Process**, **Preload Scripts**, **Renderer Process** 세 가지 프로세스로 구성됩니다. 이 프로젝트는 Vite를 사용하여 각 프로세스를 독립적으로 빌드하고, TypeScript와 React를 활용한 구조로 설계되었습니다.

**참고 보일러플레이트**:

- [electron-vite-react](https://github.com/electron-vite/electron-vite-react) - Electron Vite React 템플릿
- [electron-vite](https://github.com/alex8088/electron-vite) - Vite 기반 Electron 보일러플레이트
- [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) - Webpack 기반 Electron + React 보일러플레이트
- [vite-electron-builder](https://github.com/cawa-93/vite-electron-builder) - Vite + Electron Builder 보일러플레이트


```bash
src/
├── main/           # Electron 메인 프로세스
│   └── src/
│       ├── index.ts              # IPC 핸들러 및 앱 초기화
│       ├── mainWindow.ts        # 메인 윈도우 생성 및 관리
│       ├── widgetWindow.ts      # 위젯 윈도우 생성 및 관리
│       └── notificationHandlers.ts  # 알림 관련 핸들러
├── preload/        # Electron 프리로드 스크립트
│   └── src/
│       └── index.ts             # Context Bridge API 노출
└── renderer/       # React 애플리케이션 (UI)
    └── src/
        ├── api/                  # API 요청 관련 훅 (TanStack Query)
        │   ├── dashboard/        # 대시보드 데이터 쿼리
        │   ├── session/          # 세션 관리 뮤테이션
        │   └── login/            # 인증 관련
        ├── assets/               # 이미지, 폰트 등 정적 에셋
        ├── entities/             # 비즈니스 엔티티 (FSD 아키텍처)
        │   └── posture/          # 자세 분석 엔티티
        │       └── lib/
        │           ├── PostureClassifier.ts    # 자세 분류 엔진
        │           ├── ScoreProcessor.ts       # 점수 처리 파이프라인
        │           ├── calculations.ts         # PI 계산, EMA 스무딩
        │           └── errorChecks.ts          # 캘리브레이션 검증
        │   ├── Button/           # 버튼 컴포넌트
        │   ├── Modal/            # 모달 컴포넌트
        │   └── ...
        ├── hooks/                # 커스텀 훅
        │   ├── useNotificationScheduler.ts  # 알림 스케줄링
        │   ├── useAutoMetricsSender.ts      # 자동 메트릭 전송
        │   └── useWidget.ts                 # 위젯 상태 관리
        ├── layout/               # 페이지 레이아웃 컴포넌트
        ├── pages/                # 라우팅 단위 페이지 컴포넌트
        │   ├── Main/             # 메인 대시보드 페이지
        │   ├── Widget/          # 위젯 페이지
        │   ├── Calibration/     # 캘리브레이션 페이지
        │   └── ...
        ├── store/                # Zustand 전역 스토어
        │   ├── usePostureStore.ts    # 자세 상태 관리
        │   ├── useCameraStore.ts     # 카메라 상태 관리
        │   └── useNotificationStore.ts  # 알림 설정 관리
        ├── styles/               # 전역 스타일 및 Tailwind 설정
        ├── types/                # 공용 타입 정의
        └── utils/                # 유틸리티 함수
```

- **컴포넌트 설계**: 페이지(Pages)가 비즈니스 로직과 데이터 페칭을 담당하고, 컴포넌트(Components)는 UI 표현에 집중하는 구조를 지향합니다. `pose-detection` 폴더에는 자세 인식 관련 핵심 로직이 클래스 기반으로 구현되어 있습니다.
- **디자인 시스템**: `Button`, `Modal`, `TextField`, `ToggleSwitch` 등 핵심 UI를 공통 컴포넌트로 만들어 일관성을 유지하고 재사용성을 높였습니다. `clsx`와 `tailwind-merge`를 활용해 조건부 스타일링을 관리합니다.
- **상태 관리 전략**:
  - `Zustand`로 클라이언트 상태(자세, 카메라, 알림 설정) 관리
  - `TanStack Query`로 서버 상태 캐싱 및 동기화
  - 위젯과 메인 윈도우 간 동기화는 `localStorage`의 `storage` 이벤트 활용

---

## 🚀 실행 방법

```bash
# 1. 의존성 설치
pnpm install

# 2. 개발 서버 실행 (메인 + 렌더러 동시 실행)
pnpm dev

# 3. 프로덕션 빌드
pnpm build

# 4. 프로덕션 모드로 실행
pnpm start:prod

# 5. 플랫폼별 빌드
pnpm build:mac    # macOS 빌드
pnpm build:win    # Windows 빌드
pnpm build:all    # 모든 플랫폼 빌드
```

## 🚢 Release Flow

- 기본 배포 경로는 `main` PR merge -> `.github/workflows/auto-release.yml` -> `vX.Y.Z` tag push -> `Electron Release` / `Release Notes` 순서입니다.
- 버전 증가는 PR label `release:major`, `release:minor`, `release:patch` 중 정확히 하나로만 결정됩니다.
- 자동 릴리즈 시작 전 `lint`, `typecheck`, `build` 체크가 모두 성공해야 합니다.
- `package.json` 버전과 Git tag는 같은 release prepare 커밋에서 함께 동기화됩니다.
- 수동 `workflow_dispatch` 릴리즈는 `auto_release_recovery`, `approved_hotfix`, `operator_intervention` 예외 사유가 있을 때만 사용합니다.

### 운영자 체크포인트

- Auto Release summary에서 HEAD SHA, 계산된 버전, duplicate guard 상태를 확인합니다.
- Electron Release summary에서 `mac_release`, `win_release`, `updater_metadata` 단계를 확인합니다.
- `partial_platform_release` 또는 `updater_metadata_incomplete`가 나오면 마지막 안정 태그 기준으로 rollback 여부를 판단합니다.
- 릴리즈 회귀 검증은 `pnpm run release:validate`로 수행합니다.

---

## 📌 개발 의도 & 기술적 도전

- **기술적 도전 과제**:
  1.  **실시간 영상 처리 성능**: 저사양 컴퓨터에서도 부드럽게 작동하도록 웹캠 영상 분석 과정의 성능을 최적화하는 것이 중요했습니다.
  2.  **다중 윈도우 상태 관리**: Electron의 메인 윈도우와 위젯 윈도우 간의 상태(세션, 시간 등)를 일관성 있게 동기화하는 것이 복잡했습니다. 특히 메인 창과 위젯이 각각 독립적으로 판정을 수행하면 상태가 달라질 수 있는 문제가 있었습니다.
  3.  **크로스 플랫폼 호환성**: macOS와 Windows 환경 모두에서 안정적으로 빌드되고 실행되도록 `electron-builder` 설정을 구성했습니다.

- **해결 과정**:
  1.  **성능 최적화**:
  - MediaPipe의 `detectForVideo`를 프레임별로 호출하여 중복 처리 방지
  - `ScoreProcessor`의 다단계 스무딩 파이프라인으로 노이즈 제거 (Moving Average → EMA(30) → EMA(70))
  - 히스테리시스 로직으로 채터링 방지하여 안정적인 상태 전환
  - 점수 클램핑(-10 ~ 40)으로 이상치 제거
  2.  **다중 윈도우 동기화**:
  - 메인 프로세스를 중앙 허브로 삼아 `ipcMain`과 `ipcRenderer`를 통해 위젯 창 열기/닫기 제어
  - 위젯과 메인 윈도우 간 자세 상태 동기화는 `localStorage`의 `storage` 이벤트 활용 (IPC 대신 사용하여 간단하고 안정적으로 구현)
  - `usePostureSyncWithLocalStorage` 훅으로 위젯에서 메인 창의 상태 변경 감지
  - **스마트 판정 전략**: 메인 창이 활성화되어 있으면 위젯은 판정을 하지 않고 메인 창의 결과만 동기화받음. 메인 창이 없으면 위젯이 독립적으로 판정 수행
  - 메인 창 활성화 상태는 localStorage의 타임스탬프로 추적 (2초 이내 업데이트가 없으면 비활성화로 간주)
  3.  **크로스 플랫폼 호환성**:
  - GitHub Actions를 이용해 각기 다른 OS 환경의 빌드를 자동화
  - `entitlements.mac.plist`에 카메라/마이크 권한 명시
  - `electron-builder` 설정으로 macOS (Intel/Apple Silicon) 및 Windows 빌드 지원

---

## 👥 팀 구성 & 역할

|                                            프로필                                            | 역할         | 이름   | GitHub                                           |
| :------------------------------------------------------------------------------------------: | ------------ | ------ | ------------------------------------------------ |
|    <img src="https://github.com/choihooo.png" width="80" height="80" alt="최호 프로필" />    | **Frontend** | 최호   | [@choihooo](https://github.com/choihooo)         |
| <img src="https://github.com/hwanseok1014.png" width="80" height="80" alt="이환석 프로필" /> | **Frontend** | 이환석 | [@hwanseok1014](https://github.com/hwanseok1014) |
| <img src="https://github.com/son-daehyeon.png" width="80" height="80" alt="손대현 프로필" /> | **Backend**  | 손대현 | [@son-daehyeon](https://github.com/son-daehyeon) |
