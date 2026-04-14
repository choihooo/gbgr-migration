# Research: 온보딩/보정 도메인 이관

**Date**: 2026-04-14
**Branch**: `007-onboarding-calibration`

## R1: 보정 게이트(CalibrationGate) 이관 방식

**Decision**: 레거시 `calibration-gate.ts`를 `shared/lib/`로 직접 포팅

**Rationale**:
- 레거시는 순수 함수 6개(getState, setState, markInitialRequired, requestReset, lock, clear, canAccess)로 구성된 유틸리티
- localStorage만 사용하므로 Tauri 백엔드 개입 불필요
- 의존성 없이 복사만으로 동작

**Alternatives considered**:
- Zustand store로 래핑: 불필요한 추상화. 상태 변경이 보정 완료 시 1회뿐이고, 읽기는 라우팅 시에만 발생
- Tauri 명령어로 이관: localStorage 접근이 OS 부작용이 아님. 프론트엔드 localStorage로 충분

## R2: 인증 후 보정 상태 분기 연결 지점

**Decision**: `features/auth/model/use-auth-redirect.ts`에 CalibrationGate 판별 로직 추가

**Rationale**:
- 레거시에서 로그인 후 이동 경로는 보정 상태에 따라 결정됨
- 현재 마이그레이션 앱은 로그인 후 항상 `/main`으로 이동
- `use-auth-redirect`가 이미 인증 완료 시 리다이렉트를 담당하므로, 여기에 보정 게이트 판별을 끼워넣는 것이 자연스러움

**분기 로직**:
```
인증 완료 → getCalibrationGateState(userId)
  → 'initial_required' → /onboarding/init
  → 'reset_requested'  → /onboarding/calibration
  → 'locked'           → /main (기존 동작)
```

**Alternatives considered**:
- 라우터 loader에서 처리: React Router 7 loader는 데이터 로딩에 적합하지만, 인증 후 네비게이션은 사이드이펙트이므로 auth hook에서 처리하는 것이 적절
- 별도 미들웨어: 과도한 추상화

## R3: 보정 라우트 가드 구현

**Decision**: 라우트 element를 감싸는 `CalibrationRouteGuard` 컴포넌트 구현

**Rationale**:
- FR-012: 보정 완료 사용자가 보정 라우트 접근 시 `/main` 리다이렉트
- 기존 `auth-routes.tsx`의 `ProtectedRoute` 패턴과 동일하게 구현
- `canAccessCalibrationFlow()`로 판별, 통과 못하면 `/main`으로 리다이렉트

**적용 위치**: `shared/config/router.tsx`의 onboarding 하위 라우트에 래핑

**Alternatives considered**:
- 각 페이지 내부에서 체크: 관심사 분리 위반, 모든 페이지에 중복 코드
- React Router 7 beforeLoad: 현재 라우터 설정이 JSX 기반이므로 컴포넌트 래퍼가 일관성 있음

## R4: react-webcam 의존성

**Decision**: `react-webcam` 패키지 추가 필요

**Rationale**:
- 레거시 WebcamView가 `react-webcam`에 강하게 의존 (RefObject<Webcam>, video 엘리먼트 접근)
- 보정 화면(US3)에서 웹캠 뷰가 필수
- 이번 스펙에서는 UI 레이아웃만 이관하므로, 미연결 상태에서는 웹캠 컴포넌트 자체를 숨기거나 placeholder로 대체

**Alternatives considered**:
- navigator.mediaDevices 직접 사용: 레거시가 react-webcam의 RefObject 기반 비디오 제어를 광범위하게 사용하므로 교체 불가
- Tauri 카메라 플러그인: 과도한 아키텍처 변경, 008에서 검토

## R5: 에셋 이관 방식

**Decision**: 레거시 에셋을 `migration/src/assets/onboarding/`로 직접 복사

**Rationale**:
- 온보딩 5단계 슬라이드 이미지 8개 (light/dark), 아이콘 SVG 5개
- calibration_guide.svg는 `migration/src/assets/common/images/`에 이미 존재할 가능성 확인 필요
- Vite의 `?react` SVG 임포트 방식은 레거시와 동일하게 사용 가능

**에셋 목록**:
- `first_image.png`, `first_dark_image.png`
- `second_image.png`, `second_dark_image.png`
- `third_image.png`, `third_dark_image.png`
- `fourth_image.png`, `fourth_dark_image.png`
- `fifth_image.png`, `fifth_dark_image.png` (있을 경우)
- `progress_1.svg` ~ `progress_5.svg`
- `prev_icon.svg`, `rock_icon.svg`
- `giraffe.svg`, `turtle.svg`
- `calibration_guide.svg`

## R6: 애니메이션 이관

**Decision**: 레거시의 `animate-slide-next`, `animate-slide-prev` 커스텀 애니메이션을 TailwindCSS 설정에 추가

**Rationale**:
- 온보딩 소개 슬라이드 전환에 사용되는 좌/우 슬라이드 애니메이션
- 레거시에서 TailwindCSS 커스텀 키프레임으로 정의됨
- 마이그레이션 앱의 TailwindCSS 설정에 동일한 키프레임 추가 필요

**Alternatives considered**:
- CSS transition만 사용: 레거시와 정확히 동일한 애니메이션을 위해 키프레임 복제가 필요

## R7: CameraStore 의존성

**Decision**: 기존 마이그레이션 앱의 카메라 관련 store가 없으므로, CameraPermissionButton 내에서 navigator.mediaDevices 직접 호출

**Rationale**:
- 레거시의 `useCameraStore`는 위젯/메인에서 카메라 상태(show/hide/exit)를 관리
- 온보딩에서는 카메라 권한 요청과 deviceId 저장만 필요
- 전역 카메라 store는 008(측정 엔진)에서 도입하는 것이 적절
- localStorage의 `preferredCameraDeviceId`는 CameraPermissionButton 내에서 직접 관리

**Alternatives considered**:
- CameraStore를 지금 이관: 온보딩만으로는 store 사용처가 제한적이어서 과도함

## R8: i18n 키 확장

**Decision**: 기존 `onboarding.pageTitle` 등 placeholder 키를 실제 번역으로 교체하고, 신규 키 추가

**Rationale**:
- 레거시의 한글 문자열이 컴포넌트에 하드코딩되어 있으나(사용자 이름 등), 안내 문구는 i18n 키로 관리
- 마이그레이션 앱은 ko/en 리소스가 있으므로, 레거시의 한글 문구를 ko 리소스에 추가

**필요한 주요 키**:
- `onboarding.init.step1Title` ~ `onboarding.init.step5Title`
- `onboarding.init.step1Description` ~ `onboarding.init.step5Description`
- `onboarding.camera.title`, `onboarding.camera.description`
- `onboarding.camera.button`
- `onboarding.calibration.welcome.title`
- `onboarding.calibration.measuring.countdown`
- `onboarding.calibration.measuring.step1`, `step2`
- `onboarding.completion.title`, `onboarding.completion.description`
- `onboarding.completion.button`
- `onboarding.calibration.engineUnavailable` (FR-017 신규)

## R9: 보정 화면 측정 엔진 미연결 처리

**Decision**: CalibrationPage에서 `isEngineAvailable` 상태 플래그(false 고정)를 사용해 측정 흐름 제어

**Rationale**:
- FR-016/FR-017에 따라 측정 엔진은 이번 범위에서 제외
- WebcamView 대신 placeholder(카메라 미연결 안내) 표시
- WelcomePanel의 측정 시작 버튼 비활성화 + 안내 메시지 추가
- MeasuringPanel은 UI 구조만 렌더링 (실제 측정 로직 없음)
- 008에서 `isEngineAvailable`을 true로 전환하고 실제 엔진 연결

**Alternatives considered**:
- 측정 화면 전체 생략: FR-005 위반. UI 레이아웃은 이관해야 함
- Mock 타이머로 가짜 측정: 사용자에게 혼란 가능성, clarify에서 B(비활성화) 선택함

## R10: 세션 생성 API 연동

**Decision**: 기존 `entities/session/use-session-mutations.ts`의 `useCreateSessionMutation` 재사용

**Rationale**:
- OnboardingCompletionPage에서 세션 생성 후 `/main` 이동
- useLevelQuery도 기존 `entities/dashboard/`에서 재사용
- 신규 API 없음

**Alternatives considered**: 없음. 기존 구현 재사용이 유일한 선택지.
