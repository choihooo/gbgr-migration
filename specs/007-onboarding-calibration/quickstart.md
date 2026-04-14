# Quickstart: 온보딩/보정 도메인 이관

**Branch**: `007-onboarding-calibration`

## 사전 준비

1. 의존성 설치: `bun add react-webcam` (WebcamView용)
2. 레거시 에셋 복사: `src/renderer/src/assets/onboarding/` → `migration/src/assets/onboarding/`
3. 레거시 에셋 확인: `src/renderer/src/assets/common/images/calibration_guide.svg` → `migration/src/assets/common/images/`

## 구현 순서 (권장)

### 1단계: 공유 인프라
```
shared/lib/calibration-gate.ts         ← 레거시에서 직접 포팅
```

### 2단계: 라우팅 가드
```
shared/lib/calibration-route-guard.tsx  ← 보정 라우트 접근 제어 컴포넌트
features/auth/model/use-auth-redirect.ts ← 보정 상태 분기 로직 추가
shared/config/router.tsx               ← CalibrationRouteGuard 래핑
```

### 3단계: 온보딩 소개 페이지 (US1)
```
pages/onboarding-page/components/
  ├── ImageDescriptionPanel.tsx  ← 레거시 포팅
  ├── InfoPanel.tsx              ← 레거시 포팅
  └── FirstImageDescription.tsx  ← 레거시 포팅
pages/onboarding-init-page/index.tsx ← 슬라이드 네비게이션 로직
```

### 4단계: 카메라 권한 안내 페이지 (US2)
```
pages/onboarding-page/components/
  └── CameraPermissionButton.tsx ← 레거시 포팅
pages/onboarding-page/index.tsx  ← 전체 구현
```

### 5단계: 보정 화면 (US3)
```
pages/calibration-page/components/
  ├── WebcamView.tsx      ← UI 레이아웃만 포팅 (엔진 미연결)
  ├── WelcomePanel.tsx    ← 레거시 포팅 + 비활성화 로직
  └── MeasuringPanel.tsx  ← 레거시 포팅
pages/calibration-page/index.tsx ← 상태 관리 프레임만 구현
```

### 6단계: 완료 페이지 (US4)
```
pages/onboarding-completion-page/index.tsx ← 세션 생성 + 메인 이동
```

### 7단계: i18n + 마무리
```
shared/lib/i18n/resources.ts ← 온보딩 번역 키 추가 (ko/en)
```

## 검증 방법

1. **US1**: `/onboarding/init` 진입 → 5단계 슬라이드 전환 → `/onboarding` 이동 확인
2. **US2**: `/onboarding` → 카메라 안내 문구 → 버튼 클릭 → `/onboarding/calibration` 이동
3. **US3**: `/onboarding/calibration` → 웰컴 패널 + 비활성화 버튼 + 안내 메시지 확인
4. **US4**: `/onboarding/completion` → 완료 안내 → 버튼 → `/main` 이동
5. **US5**: localStorage 조작(보정 상태 변경) → 로그인 후 이동 경로 검증

## 측정 엔진 연결 (008에서)

`calibration-page/index.tsx`의 `isEngineAvailable` 플래그를 `true`로 변경하고:
- WebcamView에 PoseDetection 연결
- 측정 타이머/데이터 수집 로직 활성화
- processCalibrationData → localStorage 저장 → lockCalibrationGate
