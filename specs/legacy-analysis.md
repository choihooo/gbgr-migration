# 레거시 프로젝트 전체 분석 보고서

**분석 일시**: 2026-04-13
**대상**: `src/` (Electron + React 앱)
**마이그레이션 목적지**: `migration/` (Tauri 2 + React)

---

## 1. 프로젝트 구조

```
src/
├── main/                         # Electron 메인 프로세스
│   └── src/
│       ├── index.ts              # 앱 생명주기, IPC 핸들러 등록
│       ├── mainWindow.ts         # 메인 윈도우 설정
│       ├── widgetWindow.ts       # 위젯 윈도우 관리
│       ├── widgetConfig.ts       # 위젯 크기/위치 설정
│       ├── security-restrictions.ts
│       ├── notificationHandlers.ts
│       ├── updaterHandlers.ts    # 자동 업데이트
│       ├── analytics.ts          # GA4 이벤트
│       └── vite.config.js
│
├── preload/                      # Preload 스크립트
│   └── src/
│       ├── index.ts              # 메인 프로세스 API 브릿지
│       ├── sha256sum.ts          # 해시 생성
│       └── exposedInMainWorld.d.ts  # 타입 정의
│
└── renderer/                     # React 렌더러
    ├── public/                   # 정적 에셋
    ├── src/
    │   ├── app/                  # 앱 컴포넌트 (App, ErrorBoundary)
    │   ├── assets/               # 이미지, 폰트, 아이콘
    │   ├── entities/             # 도메인 엔티티
    │   │   ├── posture/          # 자세 감지/분류/안정화
    │   │   ├── session/          # 측정 세션 관리
    │   │   ├── dashboard/        # 대시보드 데이터
    │   │   └── user/             # 사용자 정보
    │   ├── features/             # 기능 모듈
    │   │   ├── auth/             # 로그인/회원가입/이메일 인증
    │   │   ├── calibration/      # 자세 보정(캘리브레이션)
    │   │   ├── dashboard/        # 대시보드 지표/패널
    │   │   ├── notification/     # 알림 설정/표시
    │   │   └── onboarding/       # 온보딩 플로우
    │   ├── pages/                # 페이지 컴포넌트 (11개)
    │   ├── shared/               # 공통 유틸리티
    │   │   ├── api/              # Axios 인스턴스
    │   │   ├── config/           # 라우터 설정
    │   │   ├── hooks/            # 공통 훅
    │   │   ├── lib/              # 유틸 함수
    │   │   ├── styles/           # 디자인 토큰
    │   │   ├── types/            # 공통 타입
    │   │   └── ui/               # UI 컴포넌트
    │   └── widgets/              # 위젯
    │       ├── camera/           # 카메라 상태 관리
    │       └── widget/           # 위젯 윈도우
    └── vite.config.ts
```

---

## 2. 의존성

### 핵심 런타임
| 패키지 | 버전 | 용도 |
|--------|------|------|
| electron | 39.0.0 | 데스크톱 런타임 |
| react | 19.2.0 | UI 프레임워크 |
| react-dom | 19.2.0 | React DOM 렌더러 |
| react-router-dom | 7.9.5 | 라우팅 |
| zustand | 5.0.8 | 클라이언트 상태관리 |
| @tanstack/react-query | 5.90.6 | 서버 상태관리 |
| axios | 1.13.1 | HTTP 클라이언트 |

### 기능 특화
| 패키지 | 버전 | 용도 |
|--------|------|------|
| @mediapipe/tasks-vision | 0.10.22-rc | 자세 감지 (Pose Landmark) |
| react-webcam | 7.2.0 | 웹캠 접근 |
| recharts | ^3.3.0 | 차트 시각화 |
| class-variance-authority | 0.7.1 | CSS 변형 관리 |
| clsx | 2.1.1 | 클래스 유틸 |
| electron-updater | 6.6.2 | 자동 업데이트 |

---

## 3. 라우팅

**파일**: `src/renderer/src/shared/config/router.tsx`

### 라우트 구조
```
/                           → 로그인으로 리다이렉트
/auth/login                 → 로그인 페이지
/auth/signup                → 회원가입
/auth/verify                → 이메일 인증
/auth/verify-callback       → 이메일 인증 콜백
/auth/resend                → 인증 메일 재발송
/main                       → 메인 대시보드 (인증 필요)
/onboarding                 → 온보딩 루트 (보정 필요)
/onboarding/init            → 온보딩 시작
/onboarding/calibration     → 자세 보정
/onboarding/completion      → 온보딩 완료
/widget                     → 위젯 페이지
```

### 라우트 가드
- **`requireAuthLoader`**: localStorage에서 accessToken 확인, 없으면 `/auth/login`으로 리다이렉트
- **`calibrationFlowLoader`**: 사용자 보정 상태 확인, 미보정 시 온보딩으로 리다이렉트
- 모든 페이지 lazy loading 적용

### 마이그레이션 포인트
- React Router 그대로 사용 가능
- Lazy loading 패턴 동일하게 적용

### 이메일 인증 콜백 → 딥링크 처리

**문제**: 이메일 인증 링크는 브라우저에서 열린다. Tauri 앱의 `/auth/verify-callback` route로 바로 연결하려면 커스텀 URI 스킴(딥링크)이 필요하다.

**방식**: `@tauri-apps/plugin-deep-link` 사용

**구현 계획**:

#### 1. Tauri 설정 (`tauri.conf.json`)
```json
{
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["gbgr"]
      }
    }
  }
}
```
- 등록된 스킴: `gbgr://`
- 예: `gbgr://auth/verify-callback?token=xxx`

#### 2. Rust 쪽 설정 (`src-tauri/src/main.rs`)
```rust
use tauri_plugin_deep_link::DeepLinkExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                let dl = app.deep_link();
                dl.register("gbgr", |urls| {
                    // urls[0] = "gbgr://auth/verify-callback?token=xxx"
                    // 이벤트를 프론트엔드로 전달
                })?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 3. 프론트엔드 리스너 (`app/providers/` 또는 `App.tsx`)
```typescript
import { listen } from '@tauri-apps/api/event'

// 앱 시작 시 딥링크 이벤트 수신
listen('deep-link', (event) => {
  const url = new URL(event.payload as string)
  // url.pathname = "/auth/verify-callback"
  // url.searchParams.get("token") = "xxx"
  navigate(url.pathname + url.search)
})
```

#### 4. 서버 메일 템플릿 변경 (필요 시)
- 기존: `https://app.bugi.co.kr/auth/verify-callback?token=xxx`
- 변경: `gbgr://auth/verify-callback?token=xxx`
- 서버 수정 권한이 없으면 웹 중간 페이지에서 `gbgr://` 스킴으로 리다이렉트하는 방식도 가능

#### 5. 플랫폼별 추가 설정
- **Windows**: 설치 시 레지스트리에 스킴 등록 (Tauri가 자동 처리)
- **macOS**: `Info.plist`에 `CFBundleURLSchemes` 추가 (Tauri가 자동 처리)
- 개발 중에는 수동 등록 필요

#### 6. Capabilities 권한 (`src-tauri/capabilities/default.json`)
```json
{
  "permissions": [
    "deep-link:default"
  ]
}
```

**주의사항**:
- 앱이 설치되어 있지 않은 상태에서 링크 클릭 → 동작 안 함
- 개발 환경에서는 수동으로 스킴을 등록해야 테스트 가능
- macOS에서는 앱 서명 후 정상 동작

---

## 4. API 레이어

### 인스턴스 설정 (`shared/api/instance.ts`)
```typescript
baseURL: import.meta.env.VITE_BASE_URL
withCredentials: true
headers: { 'Content-Type': 'application/json' }
```

### 토큰 관리
- **저장소**: localStorage
- **accessToken**: 요청 시 `Authorization: Bearer {token}` 헤더
- **refreshToken**: 401/403 발생 시 갱신

### 토큰 갱신 플로우
1. API 요청 → 401/403 응답
2. 에러 코드 `AUTH-101` → refreshToken으로 갱신 시도
3. 갱신 성공 → 원래 요청 재시도
4. 에러 코드 `AUTH-102` (갱신 토큰 만료) → 로그아웃
5. 갱신 실패 2회 → 강제 로그아웃

### 전체 API 엔드포인트

#### 인증 (`/auth`)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/auth/login` | 로그인 (accessToken + refreshToken 반환) |
| POST | `/auth/check-email` | 이메일 중복 확인 |
| POST | `/auth/sign-up` | 회원가입 |
| POST | `/auth/verify-email` | 이메일 인증 |
| POST | `/auth/resend-verification-email` | 인증 메일 재발송 |

#### 사용자 (`/users`)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| DELETE | `/users/me` | 회원 탈퇴 |

#### 세션 (`/sessions`)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/sessions` | 세션 생성 |
| PATCH | `/sessions/{id}/pause` | 세션 일시정지 |
| PATCH | `/sessions/{id}/resume` | 세션 재개 |
| PATCH | `/sessions/{id}/stop` | 세션 종료 |
| POST | `/sessions/{id}/metrics` | 자세 점수 전송 (배열) |
| GET | `/sessions/{id}/report` | 세션 리포트 |

#### 대시보드 (`/dashboard`)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/dashboard/average-score` | 평균 자세 점수 |
| GET | `/dashboard/attendance` | 출석 데이터 |
| GET | `/dashboard/highlight` | 주간/월간 하이라이트 |
| GET | `/dashboard/level` | 사용자 레벨 |
| GET | `/dashboard/posture-graph` | 최근 31일 자세 그래프 |
| GET | `/dashboard/posture-pattern` | 자세 패턴 분석 |

---

## 5. 상태관리 (Zustand)

### 1. Posture Store (`entities/posture/model/use-posture-store.ts`)
```typescript
interface PostureState {
  postureClass: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0=무효, 1-6=자세 등급
  score: number                                  // 자세 점수
  setStatus: (postureClass, score?) => void
}
```
- **미들웨어**: persist (localStorage)

### 2. Email Store (`features/auth/model/use-email-store.ts`)
```typescript
interface EmailState {
  email: string
  setEmail: (email: string) => void
}
```
- **미들웨어**: persist (localStorage)

### 3. Camera Store (`widgets/camera/model/use-camera-store.ts`)
```typescript
interface CameraState {
  cameraState: 'show' | 'hide' | 'exit'
  setShow: () => void
  setHide: () => void
  setExit: () => void
}
```
- **미들웨어**: persist (localStorage)

### 4. Notification Store (`features/notification/model/use-notification-store.ts`)
```typescript
interface NotificationState {
  isAllow: boolean
  stretching: { isEnabled: boolean; interval: number }  // 스트레칭 알림
  turtleNeck: { isEnabled: boolean; interval: number }   # 거북목 알림
}
```
- **미들웨어**: persist (sessionStorage)

### 마이그레이션 포인트
- Zustand 그대로 사용 가능
- persist 미들웨어 localStorage/sessionStorage 모두 Tauri에서 동일하게 동작

---

## 6. Electron IPC (Tauri 마이그레이션 대상)

### IPC 핸들러 목록
| 채널 | 방향 | 설명 | Tauri 대체 |
|------|------|------|------------|
| `api:writeLog` | Renderer→Main | 로그 파일 기록 | `@tauri-apps/plugin-fs` |
| `widget:open` | Renderer→Main | 위젯 윈도우 열기 | `@tauri-apps/api/window` |
| `widget:close` | Renderer→Main | 위젯 윈도우 닫기 | `@tauri-apps/api/window` |
| `widget:isOpen` | Renderer→Main | 위젯 상태 확인 | `@tauri-apps/api/window` |
| `theme:getSystemTheme` | Main→Renderer | 시스템 테마 조회 | `@tauri-apps/plugin-os` |
| `startup:get` | Main→Renderer | 자동실행 설정 조회 | `@tauri-apps/plugin-autostart` |
| `startup:set` | Renderer→Main | 자동실행 설정 변경 | `@tauri-apps/plugin-autostart` |
| `notification:show` | Renderer→Main | 시스템 알림 표시 | `@tauri-apps/plugin-notification` |
| `notification:requestPermission` | Renderer→Main | 알림 권한 요청 | `@tauri-apps/plugin-notification` |
| `analytics:logEvent` | Renderer→Main | GA4 이벤트 전송 | Tauri 커맨드 또는 HTTP 직접 |
| `analytics:setUserId` | Renderer→Main | GA4 사용자 ID 설정 | Tauri 커맨드 또는 HTTP 직접 |

### Preload 타입 정의
```typescript
interface ElectronAPI {
  writeLog: (filename: string, data: string) => Promise<void>
  widget: {
    open: () => Promise<void>
    close: () => Promise<void>
    isOpen: () => Promise<boolean>
  }
  getSystemTheme: () => Promise<string>
  startup: {
    get: () => Promise<boolean>
    set: (autoStart: boolean) => Promise<void>
  }
  notification: {
    show: (title: string, body: string) => Promise<void>
    requestPermission: () => Promise<boolean>
  }
  updater: {
    checkForUpdates: () => Promise<void>
    onUpdateAvailable: (cb) => void
    onUpdateDownloaded: (cb) => void
  }
  analytics: {
    logEvent: (name: string, params?: object) => void
    setUserId: (id: string) => void
  }
  getPlatform: () => string
}
```

---

## 7. 윈도우 관리

### 메인 윈도우 (`mainWindow.ts`)
- **크기**: 최소 1280x800
- **프레임**: 프레임리스 (커스텀 타이틀바)
- **URL**: 개발 서버 또는 `https://app.bugi.co.kr/`

### 위젯 윈도우 (`widgetWindow.ts`)
- **특성**: 항상 위, 프레임리스, 리사이즈 가능
- **상태 영속**: 위치/크기를 userData에 저장
- **URL**: 개발 서버 + `/widget` 또는 프로덕션

### 위젯 크기 설정 (`widgetConfig.ts`)
```typescript
{
  defaultWidth: 200,
  defaultHeight: 320,
  minWidth: 160,
  minHeight: 45,
  maxWidth: 260,
  maxHeight: 348,
  mini: { defaultWidth: 244, defaultHeight: 42 },
  medium: { minWidth: 192, minHeight: 268 }
}
```

### 마이그레이션 포인트
- Electron BrowserWindow → Tauri Window API
- Tauri에서도 다중 윈도우, alwaysOnTop, 상태 저장 모두 지원
- `tauri.conf.json` 또는 런타임에서 윈도우 설정

---

## 8. 자세 감지 파이프라인 (핵심 기능)

### 전체 파이프라인 흐름
```
Webcam → MediaPipe Pose Landmarker → 랜드마크 추출
  → PI(Posture Index) 계산 → 전면성 체크
  → PostureClassifier (6단계 분류) → PostureStabilizer (안정화)
  → ScoreProcessor (EMA 필터링) → 최종 점수
```

### 핵심 모듈
| 모듈 | 위치 | 역할 |
|------|------|------|
| PoseDetection | `entities/posture/lib/` | MediaPipe 랜드마크 감지 |
| PoseVisualizer | `entities/posture/lib/` | 랜드마크 시각화 |
| PostureClassifier | `entities/posture/lib/` | 자세 6단계 분류 |
| PostureStabilizer | `entities/posture/lib/` | 점수 안정화 (이동 평균) |
| ScoreProcessor | `entities/posture/lib/` | EMA 필터, 이상치 제거 |
| calculatePI | `entities/posture/lib/` | 자세 지수(PI) 계산 |
| checkFrontality | `entities/posture/lib/` | 정면 응시 여부 확인 |

### 보정(Calibration) 시스템
- 5% 트림 평균/표준편차 사용
- 품질 평가: poor / medium / good
- 최소 5프레임 필요
- 전면성 기준: |roll| ≤ 10°, centerRatio ≤ 0.15

### 점수 처리
- 버퍼 크기: 100프레임
- 다단계 스무딩:
  1. 점수 클램프 (-10 ~ 40)
  2. 이동 평균 (윈도우=15)
  3. EMA (윈도우=30)
  4. 최종 EMA (윈도우=70)

### 마이그레이션 포인트
- MediaPipe는 Tauri(WRY 웹뷰)에서도 동작
- react-webcam 그대로 사용 가능
- 성능 이슈 시 Tauri 사이드카 또는 Rust 네이티브로 대체 고려

---

## 9. 메인 페이지 레이아웃

### 구조
```
┌─────────────────────────────────────────────┐
│ MainHeader (타이틀바)                         │
├────────────────────────┬────────────────────┤
│                        │                    │
│  AveragePosturePanel   │   WebcamPanel      │
│  AttendancePanel       │   MiniRunningPanel │
│  TotalDistancePanel    │                    │
│  AverageGraphPanel     │                    │
│  HighlightsPanel       │                    │
│  PosePatternPanel      │                    │
│                        │                    │
└────────────────────────┴────────────────────┘
```

### 데이터 흐름
1. 자세 감지 → `handlePoseDetected` 콜백
2. PostureClassifier로 분류
3. 매 1초마다 메트릭 수집
4. 매 5분마다 서버로 자동 전송
5. Zustand store로 실시간 업데이트

### 세션 관리
- 하트비트: 500ms 간격
- 메트릭 저장: 1초 간격
- 자동 전송: 5분 간격
- 윈도우 종료 시 세션 정리

---

## 10. Shared UI 컴포넌트

| 컴포넌트 | 설명 | 변형 |
|----------|------|------|
| Button | 버튼 | primary, sub, grey (5 사이즈) |
| TextField | 입력 필드 | label, validation |
| IntensitySlider | 커스텀 슬라이더 | 범위 선택 |
| Timer | 카운트다운 타이머 | - |
| LoadingSpinner | 로딩 스피너 | - |
| ModalPortal | 모달 컨테이너 | - |
| ThemeToggleSwitch | 다크/라이트 토글 | - |
| ToggleSwitch | 온/오프 토글 | - |
| Typography | 텍스트 (h1-h6, body, caption) | - |
| PageMoveButton | 페이지 이동 버튼 | - |
| PanelHeader | 패널 헤더 | - |

---

## 11. 분석(GA4) 이벤트

| 이벤트 | 트리거 |
|--------|--------|
| login_complete | 로그인 성공 |
| signup_complete | 회원가입 완료 |
| measure_start | 세션 측정 시작 |
| measure_end | 세션 측정 종료 |
| calibration_complete | 자세 보정 완료 |
| widget_open/close | 위젯 윈도우 토글 |

---

## 12. 마이그레이션 매핑 요약

### 그대로 이관 (변경 최소)
- React 컴포넌트 전체
- Zustand 스토어 + persist
- TanStack Query 훅
- Axios 인스턴스 + 인터셉터
- React Router 설정
- 디자인 토큰 (colors, typography, breakpoint)
- Tailwind CSS 설정
- MediaPipe 자세 감지 파이프라인

### Tauri API로 교체 필요
| 기능 | Electron | Tauri |
|------|----------|-------|
| 윈도우 관리 | BrowserWindow | `@tauri-apps/api/window` |
| 파일 시스템 | fs (via IPC) | `@tauri-apps/plugin-fs` |
| 시스템 테마 | nativeTheme | `@tauri-apps/plugin-os` |
| 자동실행 | app.setLoginItemSettings | `@tauri-apps/plugin-autostart` |
| 알림 | Notification | `@tauri-apps/plugin-notification` |
| 자동업데이트 | electron-updater | `@tauri-apps/plugin-updater` |
| 딥링크 | N/A (웹에서 직접 처리) | `@tauri-apps/plugin-deep-link` |
| 분석 | IPC → GA4 | HTTP 직접 또는 Tauri 커맨드 |
| 해시 | Node crypto | Web Crypto API 또는 Tauri 커맨드 |

### 새로 설정 필요
- Tauri 플러그인 capabilities 권한
- 다중 윈도우 설정 (위젯)
- Tauri 빌드 파이프라인 (GitHub Actions)
- 코드 서인 / 노터라이제이션 (Tauri 방식)

---

## 13. 마이그레이션 위험도 평가

| 영역 | 위험도 | 이유 |
|------|--------|------|
| UI 컴포넌트 | 낮음 | React + Tailwind 그대로 |
| API 레이어 | 낮음 | Axios 그대로, 환경변수만 변경 |
| 상태관리 | 낮음 | Zustand 그대로 |
| 라우팅 | 낮음 | React Router 그대로 |
| 자세 감지 | 중간 | MediaPipe Tauri 호환성 확인 필요 |
| 위젯 윈도우 | 중간 | Tauri 다중 윈도우 API 학습 필요 |
| Electron IPC → Tauri | 중간 | 플러그인별 설정/권한 필요 |
| 자동업데이트 | 중간 | Tauri 업데이터 설정 필요 |
| 분석(GA4) | 낮음 | HTTP 직접 호출로 대체 가능 |
| 빌드/배포 | 높음 | 완전히 다른 빌드 파이프라인 |
