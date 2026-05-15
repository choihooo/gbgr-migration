# 2026-05-08 기능 점검 보고서

## 2026-05-10 수정 반영 메모

- 아래 항목은 현재 코드 기준으로 수정 또는 완화되었다.
  - 보정 첫 진입 카메라 오픈
  - 보정 완료 후 `/onboarding/completion` 진입
  - 인증 메일 Tauri 딥링크 콜백 스킴
  - 딥링크 cold start 실패 시 런타임 리스너 누락
  - 로그인 직후 `/users/me` 실패 시 토큰 잔존
  - 세션 생성 실패 후 측정 UI 오전이
  - 세션 종료 후 위젯 잔존
  - background 전환 시 브라우저 webcam 미해제
  - sidecar 장애의 일부 UI 미전파 경로
  - 캘리브레이션 중 `no_detection` 상태 stale 타이머
  - Windows 카메라 선택 실패 시 fallback 부재
  - 로그아웃/회원 전환 시 analytics 1회성 플래그 잔존
  - updater 미설정 상태에서의 설정 모달 액션 노출
  - Tauri build hook의 `bun`/`npm` 혼용

- 아직 남은 항목은 주로 실기기 검증과 배포 운영 쪽이다.
  - updater 실제 채널 구성
  - sidecar Python/MediaPipe 툴체인의 CI/플랫폼별 검증
  - 종료 시 세션 종료/flush의 best-effort 특성
  - background/foreground 반복 전환, 잔여 프로세스, deep link 패키징 실기기 검증

## 개요

- 대상: `migration` Tauri + React 앱 전체 기능 흐름
- 목적: 테스트 통과 여부와 별개로 실제 사용자 플로우, Tauri 연동, 운영/배포 경계에서 막히는 지점을 확인
- 방식: 메인 검토 + 영역별 서브 에이전트 병렬 점검
  - 인증/세션/딥링크/라우팅
  - 온보딩/메인/위젯/패널 UI 플로우
  - 자세 엔진 프런트엔드/Rust/Tauri 브리지
  - 테스트/빌드/운영 설정

## 실행 검증 결과

- `npm test` 통과
  - `19`개 테스트 파일, `81`개 테스트 통과
- `npm run build` 통과
- `cargo test` 통과
  - Rust 테스트 `16`개 통과

테스트와 빌드는 통과했지만, 아래 항목처럼 실제 기능 흐름을 막는 결함과 운영 리스크가 별도로 확인되었습니다.

## 핵심 결론

- 현재 상태는 "기본 테스트는 통과하지만, 실제 사용자 플로우는 일부 핵심 경로가 막혀 있는 상태"로 보는 것이 맞습니다.
- 특히 보정 시작, 보정 완료 후 완료 페이지 진입, 이메일 인증 딥링크, background 전환 시 카메라 소유권 같은 경로는 우선 수정 대상입니다.
- 운영 측면에서는 updater 비활성 상태 노출, 패키지 매니저 혼용, sidecar 빌드 전제조건 누락이 배포 리스크입니다.

## 우선순위별 이슈

### P0

#### 1. 신규 사용자가 보정 화면에서 카메라를 열지 못할 가능성

- `cameraState` 기본값은 `exit`입니다.
- 보정 화면의 `WebcamView`는 `cameraState === 'show'`일 때만 `<Webcam>`를 마운트합니다.
- 그런데 `setShow()`는 `onUserMedia` 성공 뒤에만 호출됩니다.
- 결과적으로 첫 진입에서는 웹캠이 마운트될 수 없는 자기모순 상태가 됩니다.

근거:
- [use-camera-store.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/main-panels/model/use-camera-store.ts:20)
- [WebcamView.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/calibration-page/components/WebcamView.tsx:74)
- [WebcamView.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/calibration-page/components/WebcamView.tsx:162)
- [CameraPermissionButton.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/onboarding-page/components/CameraPermissionButton.tsx:58)

영향:
- 온보딩에서 보정 플로우 시작 자체가 막힐 수 있습니다.

#### 2. 보정 성공 후 완료 페이지로 이동하지 못함

- 보정 성공 시 캘리브레이션 게이트를 `locked`로 변경한 뒤 `/onboarding/completion`으로 이동합니다.
- 하지만 `/onboarding/completion`은 `CalibrationRouteGuard` 아래에 있고, 해당 가드는 `locked` 상태면 즉시 `/main`으로 리다이렉트합니다.

근거:
- [calibration-page/index.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/calibration-page/index.tsx:171)
- [calibration-page/index.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/calibration-page/index.tsx:185)
- [router.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/config/router.tsx:55)
- [calibration-route-guard.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/calibration-route-guard.tsx:13)

영향:
- "보정 성공 → 완료 페이지" 해피패스가 끊어집니다.

### P1

#### 3. 이메일 인증 콜백이 Tauri 딥링크 스킴으로 연결되지 않음

- 회원가입/재전송에서 `callbackUrl`을 `${window.location.origin}/auth/verify-callback`로 보냅니다.
- 반면 딥링크 파서는 `gbgr:` 스킴만 허용합니다.

근거:
- [use-signup-form.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/auth/model/use-signup-form.ts:121)
- [use-resend-verification.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/auth/model/use-resend-verification.ts:21)
- [deep-link.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/deep-link.ts:7)

영향:
- 데스크톱 앱 인증 메일 링크 복귀 플로우가 스펙과 어긋납니다.

#### 4. background 전환 시 브라우저 카메라 트랙이 해제되지 않음

- 가시성 전환은 `document.hidden`만 보고 모드를 바꿉니다.
- `usePostureEngine`은 background에서 프레임 푸시만 멈추고 브라우저 카메라 스트림은 유지합니다.
- Rust는 background 전환 직후 Python이 카메라를 소유한다고 기록합니다.

근거:
- [use-window-visibility-sync.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/posture-engine/model/use-window-visibility-sync.ts:17)
- [use-posture-engine.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/posture-engine/model/use-posture-engine.ts:269)
- [WebcamView.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/calibration-page/components/WebcamView.tsx:111)
- [posture_engine.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/posture_engine.rs:581)

영향:
- 카메라 충돌, `NotReadableError`, background 측정 불안정 가능성이 큽니다.

#### 5. sidecar 장애가 UI 상태로 전파되지 않는 경로 존재

- foreground/background worker 일부 실패 경로에서 엔진 상태를 error로 바꾸지 않고 종료합니다.
- 사용자는 계속 측정 중처럼 보지만 실제 sidecar는 중단된 상태가 될 수 있습니다.

근거:
- [posture_engine.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/posture_engine.rs:128)
- [posture_engine.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/posture_engine.rs:525)
- [posture_engine.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/posture_engine.rs:618)

#### 6. 로그인 직후 `/users/me` 실패 시 토큰이 남는 불일치 상태

- 로그인 성공 직후 토큰을 먼저 저장하고 `/users/me`를 호출합니다.
- 이후 실패 경로에서 저장 토큰과 기본 Authorization 정리가 없습니다.

근거:
- [use-login-form.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/auth/model/use-login-form.ts:91)
- [use-login-form.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/auth/model/use-login-form.ts:125)
- [instance.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/api/instance.ts:188)

영향:
- UI는 로그인 실패인데 다음 부트스트랩은 저장 토큰으로 복구를 재시도합니다.

#### 7. 세션 생성 실패 후에도 메인 화면이 측정 중 UI로 전이됨

- 세션 생성 mutation 실패 후에도 카메라 상태를 `show`로 바꿉니다.
- 실제 `sessionId`는 없기 때문에 UI와 세션 상태가 어긋납니다.

근거:
- [WebcamPanel.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/main-panels/ui/WebcamPanel.tsx:42)
- [WebcamPanel.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/main-panels/ui/WebcamPanel.tsx:52)
- [use-session-mutations.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/entities/session/model/use-session-mutations.ts:15)

#### 8. 측정 종료 후 열린 위젯을 메인 화면에서 닫기 어려움

- 세션 종료 시 위젯을 닫지 않습니다.
- 동시에 메인 화면 위젯 버튼은 비활성화됩니다.

근거:
- [WebcamPanel.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/main-panels/ui/WebcamPanel.tsx:64)
- [WebcamPanel.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/main-panels/ui/WebcamPanel.tsx:128)
- [use-session-mutations.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/entities/session/model/use-session-mutations.ts:70)

#### 9. 캘리브레이션 중 포즈 감지 상태가 실제 보정 프레임과 분리됨

- 보정 시작 후 foreground 프레임 푸시는 중단되는데, 포즈 존재 여부는 기존 `latestResult`로 계속 판단합니다.
- 이후 사용자가 화면 밖으로 나가도 카운트다운이 계속될 수 있습니다.

근거:
- [calibration-page/index.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/calibration-page/index.tsx:62)
- [calibration-page/index.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/calibration-page/index.tsx:103)
- [calibration-page/index.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/calibration-page/index.tsx:246)
- [use-posture-engine.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/posture-engine/model/use-posture-engine.ts:271)

### P2

#### 10. `start_posture_engine` 응답이 실제 sidecar 준비 상태를 반영하지 않음

- Rust 내부 상태는 sidecar 응답의 `engine_status`를 반영하지만, 프런트로 보내는 응답은 하드코딩된 `ready`입니다.

근거:
- [posture_engine.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/posture_engine.rs:353)
- [posture_engine.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/posture_engine.rs:368)
- [use-posture-engine.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/posture-engine/model/use-posture-engine.ts:183)

#### 11. background 측정 시작 후에도 프런트 상태가 `switching`에 머물 가능성

- Rust는 내부 상태를 `measuring`으로 갱신하지만, 해당 경로에서 `posture://engine-status` 이벤트를 내보내지 않습니다.

근거:
- [posture_engine.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/posture_engine.rs:221)
- [posture_engine.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/posture_engine.rs:624)
- [use-posture-engine.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/posture-engine/model/use-posture-engine.ts:115)

#### 12. Windows 온보딩 카메라 권한 플로우가 특정 장치 구성에서 막힐 수 있음

- Windows에서 비디오 장치 목록의 두 번째 카메라를 강제 선택합니다.
- 실패 시 기본 카메라 fallback 없이 종료합니다.

근거:
- [CameraPermissionButton.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/onboarding-page/components/CameraPermissionButton.tsx:15)
- [CameraPermissionButton.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/onboarding-page/components/CameraPermissionButton.tsx:22)
- [CameraPermissionButton.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/onboarding-page/components/CameraPermissionButton.tsx:63)

#### 13. 딥링크 초기 URL 조회 실패 시 런타임 리스너도 등록되지 않음

- `getCurrent()`와 `onOpenUrl()`가 하나의 `try`에 묶여 있습니다.
- cold-start 조회 실패가 already-running 딥링크 수신 실패로 이어질 수 있습니다.

근거:
- [deep-link.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/deep-link.ts:34)
- [deep-link.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/deep-link.ts:42)

#### 14. refresh 제외 경로가 실제 회원가입 endpoint와 불일치

- 실제 endpoint는 `/auth/sign-up`인데, 인터셉터 제외 목록은 `/auth/signup`입니다.

근거:
- [auth-api.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/auth/api/auth-api.ts:31)
- [instance.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/api/instance.ts:120)
- [instance.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/api/instance.ts:285)

### 운영/배포 리스크

#### 15. 패키지 매니저 혼용으로 `tauri dev/build` 환경이 쉽게 깨질 수 있음

- 선언은 `pnpm`인데 실제 스크립트와 Tauri 훅은 `bun`, `npm`을 혼용합니다.

근거:
- [package.json](/Users/choiho/coding/gbgr/gbgr-migration/migration/package.json:6)
- [package.json](/Users/choiho/coding/gbgr/gbgr-migration/migration/package.json:12)
- [tauri.conf.json](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/tauri.conf.json:6)
- [tauri.conf.json](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/tauri.conf.json:9)

#### 16. updater는 비활성인데 UI에서는 업데이트 기능을 노출

- updater 설정은 빈 `pubkey`, 빈 `endpoints` 상태입니다.
- Rust도 이를 `configured: false`로 처리합니다.

근거:
- [tauri.conf.json](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/tauri.conf.json:69)
- [app_updates.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/app_updates.rs:32)
- [app_updates.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/app_updates.rs:85)

#### 17. 릴리스 빌드가 Python sidecar 툴체인에 강하게 의존하지만 자동 검증이 없음

- Tauri 빌드는 sidecar 빌드를 선행합니다.
- Python, MediaPipe, PyInstaller, 동적 라이브러리, 산출물 smoke test가 모두 필요합니다.

근거:
- [tauri.conf.json](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/tauri.conf.json:9)
- [build-posture-sidecar.mjs](/Users/choiho/coding/gbgr/gbgr-migration/migration/scripts/build-posture-sidecar.mjs:16)
- [build-posture-sidecar.mjs](/Users/choiho/coding/gbgr/gbgr-migration/migration/scripts/build-posture-sidecar.mjs:120)

#### 18. 종료 시 세션 종료와 메트릭 flush가 best-effort 수준

- `beforeunload`에서 비동기 정리 작업을 기다리지 않습니다.

근거:
- [use-session-cleanup.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/posture-engine/model/use-session-cleanup.ts:13)
- [WebcamPanel.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/main-panels/ui/WebcamPanel.tsx:38)

#### 19. Analytics 실패와 사용자 식별 누락이 조용히 묻힐 수 있음

- GA 설정이 없어도 Rust 커맨드는 성공처럼 반환합니다.
- 프런트도 실패를 경고 로그 수준에서만 처리합니다.
- 사용자 식별 설정 함수의 실제 연결 경로도 불명확합니다.

근거:
- [analytics.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/analytics.rs:42)
- [analytics.rs](/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/src/commands/analytics.rs:117)
- [ga4-provider.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/analytics/ga4-provider.ts:26)
- [analytics.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/analytics/analytics.ts:20)

#### 20. 로그아웃/계정 전환 시 analytics 1회성 플래그가 초기화되지 않음

- `localStorage` 기반 1회성 이벤트 플래그가 다음 사용자에게도 남을 수 있습니다.

근거:
- [cleanup.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/shared/lib/analytics/cleanup.ts:3)
- [SettingsModal.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/features/settings/ui/SettingsModal.tsx:130)
- [use-session-mutations.ts](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/entities/session/model/use-session-mutations.ts:25)
- [main-page/index.tsx](/Users/choiho/coding/gbgr/gbgr-migration/migration/src/pages/main-page/index.tsx:33)

## 테스트 공백

- 보정 성공 후 `/onboarding/completion` 진입
- 신규 사용자 보정 첫 진입 시 웹캠 시작
- 딥링크 cold start / already-running 수신
- background 전환 시 카메라 해제 및 소유권 일치
- sidecar 실패 시 엔진 상태/error 이벤트 전파
- 세션 생성 실패 시 메인 UI 전이
- 종료 후 위젯 제어 가능 여부
- updater 비활성 상태에서 설정 UI 노출 정책

## 권장 처리 순서

1. P0 두 건 먼저 수정
   - 보정 첫 진입 카메라 시작
   - 보정 완료 후 completion 라우트 진입
2. 인증 딥링크와 로그인 실패 정리
   - `callbackUrl` 스킴 정정
   - 로그인 실패 시 토큰/세션 정리 일관화
3. 자세 엔진 foreground/background 소유권 정합성 수정
   - 브라우저 카메라 트랙 해제 시점 명확화
   - background 상태 이벤트 전파 보완
   - sidecar 실패 시 error 상태 전환 보장
4. 운영 설정 정리
   - 패키지 매니저 표준화
   - updater 노출 정책 정리
   - sidecar 빌드 전제조건 문서화 또는 CI 검증 추가
5. 회귀 테스트 보강

## 비고

- 이번 점검은 문서/코드 기준 리뷰이며, 실제 카메라 장치와 OS별 권한 팝업을 포함한 수동 E2E 검증은 별도로 필요합니다.
- AGENTS 지침에 따라 UI 스타일 변경 제안은 포함하지 않았습니다.
