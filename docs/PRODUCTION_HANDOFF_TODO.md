# 프로덕션 핸드오프 TODO

작성일: 2026-04-25
대상: `migration/` Tauri + React 앱
목적: 현재 마이그레이션 앱을 프로덕션 배포 가능 상태로 만들기 위해 남은 작업을 인수인계한다.

## 0. 2026-05-08 갭 감시 기반 일괄 수정 이력

커밋: `9b82552` — 마이그레이션 갭 감사 기반 릴리즈 차단/parity 이슈 일괄 수정
감사 문서: `docs/MIGRATION_GAP_AUDIT_2026-05-08.md`

### 완료된 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| `/main` 보정 게이트 | ✅ | `ProtectedRoute`에서 미보정 사용자 → `/onboarding/init` 리다이렉트 |
| 측정 메트릭 저장/flush | ✅ | 1초 축적, 5분 자동 flush, 세션 종료/창닫기 flush |
| 회원탈퇴 API 연동 | ✅ | `DELETE /users/me` + 성공 시에만 로컬 정리 |
| 하이라이트 실데이터 | ✅ | 하드코딩 → `useHighlightQuery` 연결 |
| 평균 그래프 랜덤 fallback | ✅ | `Math.random()` 제거 → 실데이터 또는 0 |
| ThemeProvider 연결 | ✅ | provider 계층에 추가 + `isDark` 초기값 버그 수정 |
| 분석 이벤트 시스템 | ✅ | Provider 추상화 + GA4 Measurement Protocol (Rust) |
| Vitest 실패 1건 | ✅ | `axios.post` mock으로 수정 |

### 남은 갭 감시 항목 (C/D 단계) — 2026-05-08 완료

| 항목 | 상태 | 비고 |
|------|------|------|
| Capability main/widget 분리 | ✅ | main.json + widget.json 최소 권한 분리 |
| Devtools release 제거 | ✅ | debug 전용 `[features] dev = ["tauri/devtools"]`로 분리 |
| Frame payload 크기 제한 | ✅ | 10MB(base64 14M 자) 제한 추가 |
| Migration CI 추가 | ✅ | ci.yml에 migration-lint/typecheck/test/build/rust-check 추가 |
| pnpm 통일 | ✅ | 로컬/CI pnpm 통일, lockfile 정리 |
| 문서 불일치 정리 | ✅ | quickstart 명령어, 절대경로, pnpm 반영 |
| Tailwind dark mode 수정 | ✅ | `@custom-variant dark` 클래스 기반 활성화 |

## 1. 현재 상태 요약

- [x] `bun run typecheck` 통과
- [x] `bun run test` 통과
  - 2026-04-26 기준 19개 테스트 파일, 80개 테스트 통과
  - 테스트 중 `--localstorage-file` 경고가 출력되지만 테스트 실패로 이어지지는 않음
- [x] `cargo check` 통과
- [x] `bun run build` 통과
- [x] `bun run tauri:build` 최신 재검증 필요
  - 이전 실행은 DMG 내부 `GBGR.app` 프로세스가 떠 있어 detach 실패
  - 잔여 프로세스 종료 및 `/dev/disk4` detach 후 재실행하여 성공한 이력이 있음
  - 2026-04-25 재실행 결과: Rust release 빌드와 `.app` 번들 생성까지 완료됐으나 DMG 번들링 단계의 `bundle_dmg.sh`에서 실패
  - 2026-04-26 재실행 결과: Rust release 빌드, `.app` 번들, DMG 번들링 모두 성공
  - 실패 후 `/Volumes`에는 잔여 `dmg.*` 마운트가 보이지 않음
  - 실패 후 `migration/src-tauri/target/release/bundle/macos/rw.22321.GBGR_0.1.0_aarch64.dmg` 임시 이미지가 남아 있음
  - 산출물:
    - `migration/src-tauri/target/release/bundle/macos/GBGR.app`
    - `migration/src-tauri/target/release/bundle/dmg/GBGR_0.1.0_aarch64.dmg`
- [x] `bun run lint:check` 통과
  - Biome import 정렬 및 format 오류는 `bun run lint`로 정리 완료
  - `src/shared/ui/toggle-switch/index.tsx`, `src/style.css`에 경고 6건은 남아 있으나 실패로 이어지지 않음
- [ ] 프로덕션 실사용 검증은 아직 완료되지 않음
  - 자세 엔진 배포 방식은 macOS arm64 기준 확정/검증됐으나 Windows/Linux CI 산출 검증 필요
  - 보정 게이트
  - 업데이트 설정
  - 보안 설정
  - 레거시 대비 시각 검증
  - 카메라/알림/위젯 수동 회귀 검증 필요

## 2. 즉시 처리해야 할 차단 항목

### 2.1 Biome 정적 검사 실패 해결

- [x] `migration/`에서 `bun run lint:check`를 실행해 최신 오류 목록을 확인한다.
- [x] import 정렬 오류를 정리한다.
  - 대상 예시:
    - `migration/scripts/install-with-manager.mjs`
    - `migration/src/features/dashboard/ui/MainContent.tsx`
    - `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
    - `migration/src/features/main-panels/ui/WebcamPanel.tsx`
    - `migration/src/features/settings/ui/SettingsModal.tsx`
    - `migration/src/pages/calibration-page/index.tsx`
    - `migration/src/pages/widget-page/index.tsx`
    - `migration/src/shared/hooks/use-widget.ts`
    - `migration/vite.config.ts`
- [x] format 오류를 정리한다.
  - 대상 예시:
    - `migration/src/app/layouts/RootLayout.tsx`
    - `migration/src/app/providers/i18n-provider.tsx`
    - `migration/src/features/main-panels/ui/AttendancePanel.tsx`
    - `migration/src/features/posture-engine/lib/tauri-posture-engine.ts`
    - `migration/src/pages/widget-page/MediumWidgetContent.tsx`
    - `migration/src/pages/widget-page/MiniWidgetContent.tsx`
    - `migration/src/pages/widget-page/WidgetTitleBar.tsx`
- [x] 정리 후 아래 명령을 모두 재실행한다.
  - [x] `bun run lint:check`
  - [x] `bun run typecheck`
  - [x] `bun run test`
  - [x] `cargo check` in `migration/src-tauri`
  - [x] `bun run build`
  - [x] `bun run tauri:build`
    - 2026-04-26 재실행에서 DMG 번들링까지 성공
- [x] 자동 수정이 가능한 항목은 `bun run lint`로 처리하되, 변경 범위가 커지면 diff를 확인한다.
- [x] 현재 워크트리에 이미 있던 변경을 되돌리지 않는다.

### 2.2 현재 워크트리 변경 정리

- [x] 현재 미커밋 변경이 의도된 작업인지 확인한다.
  - `migration/package.json`
  - `migration/bun.lock`
  - `migration/package-lock.json`
  - `migration/src-tauri/Cargo.toml`
  - `migration/src-tauri/Cargo.lock`
  - `migration/src-tauri/capabilities/default.json`
  - `migration/src-tauri/src/lib.rs`
  - `migration/src/features/notification-settings/ui/NotificationModal.tsx`
  - `migration/src/pages/main-page/index.tsx`
  - `migration/src/features/notification-settings/model/use-notification-scheduler.ts`
  - `migration/src/shared/lib/notification-api.ts`
- [x] 알림 플러그인 추가가 최종 범위에 포함되는지 결정한다.
  - 포함한다.
  - JS/Rust 의존성, Tauri plugin init, capability, 권한 요청, 프론트 알림 스케줄러가 한 기능 범위로 연결되어 있다.
  - 실제 권한/알림 동작 검증은 5.1 알림 기능 항목에서 계속 추적한다.
- [x] npm lockfile과 bun lockfile을 둘 다 유지할지 결정한다.
  - 둘 다 유지한다.
  - 현재 `packageManager`는 `bun@1.3.12`
  - `install:release`는 `npm-ci` 경로를 사용하므로 `package-lock.json`도 의도된 산출물일 수 있음
- [x] 변경 정리 후 `git diff --stat`으로 실제 릴리즈 포함 범위를 확인한다.
  - 2026-04-25 기준 28개 추적 파일 변경, 2개 신규 알림 관련 파일 추가 확인

## 3. 자세 엔진 프로덕션 배포 작업

### 3.1 Python sidecar 배포 방식 확정

- [x] 현재 `migration/src-tauri/src/posture_engine/sidecar.rs` 동작을 기준으로 배포 리스크를 문서화한다.
  - 시스템의 `python3` 또는 `python` 실행 파일을 찾음
  - `sidecar/posture-engine/main.py`를 스크립트로 실행함
  - 사용자의 PC에 Python 및 MediaPipe 의존성이 없으면 실패할 수 있음
- [x] 프로덕션 배포 전략을 하나로 결정한다.
  - [ ] Python 런타임과 의존성을 앱에 함께 번들
    - 미선택 대안
  - [x] PyInstaller/Nuitka 등으로 자세 엔진을 실행 파일로 패키징
  - [x] 플랫폼별 sidecar 바이너리 산출
  - [ ] 설치 단계에서 Python 의존성을 준비
    - 미선택 대안
  - 결정 문서: `docs/POSTURE_SIDECAR_PRODUCTION.md`
  - `bun run build:posture-sidecar` 산출 자동화 추가
  - macOS arm64 `posture-engine` 산출 및 smoke 검증 완료
  - Windows/Linux 산출은 동일 스크립트를 각 플랫폼 CI에서 실행해 검증해야 한다.
- [x] 선택한 방식에 맞춰 `resolve_sidecar_path()`와 `find_python()` 책임을 재정의한다.
  - 배포용 실행 파일을 우선 찾고, 없을 때만 개발용 Python 스크립트 fallback을 사용한다.
- [x] macOS 앱 번들 내부 경로에서 sidecar가 정상 실행되는지 검증한다.
  - `Contents/Resources/sidecar/posture-engine/posture-engine` 경로 확인
  - 실행 파일 `latest_result` JSON smoke 응답 확인
  - 2026-04-26: cold start 기준 약 48초 후 `latest_result` JSON 응답 확인
- [x] DMG로 설치한 앱에서 sidecar가 정상 실행되는지 검증한다.
  - DMG 마운트 후 `GBGR.app/Contents/Resources/sidecar/posture-engine/posture-engine` 경로 확인
  - 실행 파일 `latest_result` JSON smoke 응답 확인
  - 2026-04-26: `/Volumes/GBGR` 마운트 상태에서 약 34초 후 `latest_result` JSON 응답 확인
- [x] 개발 모드와 배포 모드의 sidecar 경로 차이를 문서화한다.
- [x] sidecar 실행 실패 시 사용자에게 표시할 오류 메시지와 복구 경로를 정한다.

### 3.2 자세 엔진 기능 검증

- [ ] `/main`에서 카메라 프리뷰와 자세 피드백이 정상 표시되는지 확인한다.
- [ ] `/onboarding/calibration`에서 보정 측정이 시작, 진행, 완료되는지 확인한다.
- [ ] `/widget`에서 최신 자세 상태가 정상 반영되는지 확인한다.
- [ ] `specs/015-posture-engine-migration/quickstart.md` 기준으로 레거시 parity 검증을 수행한다.
- [ ] 같은 입력 자세 기준으로 레거시와 마이그레이션의 자세 분류 결과가 95% 이상 일치하는지 표본을 남긴다.
- [ ] 최소화/복귀 10회 반복 테스트를 수행한다.
- [ ] 카메라 충돌 0건을 확인한다.
- [ ] 복귀 후 최신 자세 상태가 2초 이내 표시되는지 확인한다.
- [ ] 백그라운드 측정 중 알림이 의도한 조건에서만 발생하는지 확인한다.
- [ ] 세션 기록 반영이 실제 API/저장 흐름과 맞는지 확인한다.

### 3.3 Rust/Tauri 자세 엔진 코드 마감

- [x] `migration/src-tauri/src/posture_engine/events.rs` TODO를 정리한다.
- [x] `migration/src-tauri/src/posture_engine/notification_bridge.rs` TODO를 정리한다.
- [x] `migration/src-tauri/src/posture_engine/session_metrics.rs` TODO를 정리한다.
  - 2026-04-26: 실제 사용 중인 이벤트/알림/세션 메트릭 코드의 잔여 TODO와 불필요한 dead_code 허용을 제거했다.
- [ ] background/foreground 전환 중 sidecar가 중복 실행되지 않는지 확인한다.
- [ ] sidecar 종료 시 자식 프로세스가 남지 않는지 확인한다.
- [ ] 앱 종료 시 카메라/sidecar 리소스가 정상 해제되는지 확인한다.
- [ ] 실패 케이스별 Tauri command 응답 형식을 고정한다.
- [ ] Rust command 입력 검증 누락 여부를 확인한다.

## 4. 라우팅 및 보정 플로우 마감

### 4.1 보정 게이트 복원

- [x] `migration/src/shared/config/router.tsx`의 TODO를 처리한다.
  - `ProtectedRoute` 하위 `/onboarding/*` 라우트를 `CalibrationRouteGuard`로 래핑했다.
- [x] `migration/src/shared/lib/calibration-route-guard.tsx`의 TODO를 처리한다.
- [x] 보정 완료 사용자가 `/onboarding/*`에 접근할 때 `/main`으로 이동하는지 확인한다.
  - `migration/src/shared/lib/__tests__/calibration-route-guard.test.tsx`
- [x] 보정 미완료 사용자가 로그인 후 올바른 온보딩/보정 경로로 이동하는지 확인한다.
  - `migration/tests/unit/shared/config/router-auth.test.tsx`
- [x] 보정 완료 후 `lockCalibrationGate()` 저장 값이 사용자별로 적용되는지 확인한다.
  - `migration/src/shared/lib/__tests__/calibration-gate.test.ts`
- [ ] 로그아웃/회원 변경 시 이전 사용자의 보정 상태가 새 사용자에게 섞이지 않는지 확인한다.
- [ ] 직접 URL 접근, 새로고침, 딥링크 진입에서 보정 게이트가 동일하게 동작하는지 확인한다.

### 4.2 인증/온보딩 회귀 검증

- [ ] 로그인 성공 후 사용자 상태 복구가 3초 이내 완료되는지 재측정한다.
- [ ] 토큰 만료 후 refresh 성공/실패 분기를 확인한다.
- [ ] 이메일 미인증 계정 로그인 시 인증 화면으로 이동하는지 확인한다.
- [ ] 회원가입 후 인증 안내 화면으로 이동하는지 확인한다.
- [ ] 인증 콜백 딥링크가 앱에서 정상 처리되는지 확인한다.
- [ ] 온보딩 시작, 안내, 보정, 완료 화면의 레거시 대비 UI 차이를 확인한다.

## 5. 데스크톱 기능 마감

### 5.1 알림 기능

- [ ] 현재 추가된 `@tauri-apps/plugin-notification` 변경을 기준으로 실제 권한 요청이 동작하는지 확인한다.
- [ ] macOS에서 알림 권한 허용/거부/이미 허용 상태를 각각 검증한다.
- [ ] `NotificationModal`에서 저장 시 권한 요청이 한 번만 자연스럽게 발생하는지 확인한다.
- [ ] 스트레칭 알림 주기가 설정값과 일치하는지 확인한다.
- [ ] 거북목 알림이 나쁜 자세 지속 시간 기준으로 발생하는지 확인한다.
- [ ] 알림 비활성화 시 모든 interval이 해제되는지 확인한다.
- [ ] 앱 재시작 후 알림 설정이 유지되는지 확인한다.
- [ ] 백그라운드 자세 엔진 알림과 프론트 스케줄러 알림이 중복 발생하지 않는지 확인한다.

### 5.2 자동 실행

- [ ] 설정 모달의 OS 자동 시작 토글이 macOS에서 실제 Login Item/Launch Agent로 반영되는지 확인한다.
- [ ] 토글 ON 후 앱 재시작/OS 로그인 시 자동 실행되는지 확인한다.
- [ ] 토글 OFF 후 자동 실행이 해제되는지 확인한다.
- [ ] 개발 모드와 패키징 앱에서 동작 차이를 문서화한다.
- [ ] Windows 배포 예정이면 Windows 자동 실행도 별도 검증한다.

### 5.3 위젯/멀티 윈도우

- [ ] `/widget` 라우트가 보호 라우트 안에서 정상 동작하는지 확인한다.
- [ ] 메인 화면에서 위젯 열기/닫기가 정상 동작하는지 확인한다.
- [ ] 위젯 창 크기 전환이 정상 동작하는지 확인한다.
- [ ] 위젯 드래그가 macOS 패키징 앱에서 정상 동작하는지 확인한다.
- [ ] 위젯이 항상 위에 표시되는지 확인한다.
- [ ] 위젯 닫기 후 메인 창 상태가 꼬이지 않는지 확인한다.
- [ ] 메인 창 최소화/복귀 중 위젯 상태와 자세 상태가 동기화되는지 확인한다.

### 5.4 업데이트

- [ ] `migration/src-tauri/tauri.conf.json`의 updater 설정을 완료한다.
  - 현재 `pubkey`가 빈 문자열
  - 현재 `endpoints`가 빈 배열
- [ ] 업데이트 서명 키를 생성/보관/주입하는 방식을 결정한다.
- [ ] 릴리즈 메타데이터 업로드 위치를 결정한다.
- [ ] `fetchUpdate()`가 업데이트 없음/있음/네트워크 실패를 올바르게 처리하는지 확인한다.
- [ ] `installUpdate()` 후 앱 재시작 흐름을 확인한다.
- [ ] 개발/스테이징/프로덕션 업데이트 endpoint를 분리할지 결정한다.

### 5.5 딥링크

- [ ] `gbgr://` scheme이 패키징 앱에서 등록되는지 확인한다.
- [ ] 앱이 꺼져 있을 때 딥링크로 실행되는지 확인한다.
- [ ] 앱이 이미 켜져 있을 때 single-instance + deep-link 이벤트가 정상 전달되는지 확인한다.
- [ ] 이메일 인증 콜백 URL이 실제 백엔드/메일 템플릿과 일치하는지 확인한다.

## 6. 보안 및 배포 설정

### 6.1 CSP 설정

- [x] `migration/src-tauri/tauri.conf.json`의 `app.security.csp`가 `null`인 상태를 해소한다.
- [x] 앱에서 필요한 리소스 로딩 범위를 확인한다.
  - 자체 번들 JS/CSS
  - API endpoint
  - 이미지/비디오 asset
  - Tauri IPC
- [x] 최소 권한 CSP를 작성한다.
  - 2026-04-26: 운영 CSP와 개발 CSP를 분리했다. 운영 CSP는 자체 번들, Tauri IPC, `api.bugi.co.kr`, asset/data/blob 미디어 로딩 범위만 허용한다.
- [ ] CSP 적용 후 인증, 대시보드, 위젯, 보정 화면이 깨지지 않는지 확인한다.

### 6.2 Tauri capability 점검

- [ ] `migration/src-tauri/capabilities/default.json` 권한이 필요한 범위만 포함하는지 확인한다.
- [x] window, event, autostart, opener, deep-link, notification, updater 권한을 기능별로 검토한다.
  - 2026-04-26: updater 기능을 설정 모달에서 노출하므로 `updater:default` 권한을 추가했다.
- [ ] 사용하지 않는 권한이 있으면 제거한다.
- [ ] 신규 command가 capability에 누락되어 런타임에서 실패하지 않는지 확인한다.

### 6.3 서명/노타라이즈

- [ ] macOS Developer ID 서명 적용 여부를 결정한다.
- [x] DMG와 `.app` 모두 서명 상태를 확인한다.
  - 2026-04-26: `.app`은 ad-hoc 서명 상태이며 `TeamIdentifier`가 없다.
  - 2026-04-26: `.app` 기준 `codesign --verify --deep --strict` 실패
  - `.app` 실패 메시지: `code has no resources but signature indicates they must be present`
  - 2026-04-26: DMG 기준 `spctl --assess --type open --context context:primary-signature` 실패
  - DMG 실패 메시지: `rejected`, `source=no usable signature`
- [ ] macOS notarization 절차를 구성한다.
- [ ] Gatekeeper에서 차단되지 않는지 신규 사용자 환경에서 확인한다.
- [ ] CI/CD에서 인증서와 notary credential을 안전하게 주입하는 방식을 결정한다.

## 7. 시각 동일성 검증

### 7.1 메인 화면

- [ ] `specs/006-main-page-migration/tasks.md`의 T032를 완료한다.
  - 레거시와 마이그레이션 메인 페이지 시각 비교
- [ ] `specs/006-main-page-migration/tasks.md`의 T034를 완료한다.
  - quickstart 검증 시나리오 실행
- [ ] 좌측/우측 패널 배치가 레거시와 동일한지 확인한다.
- [ ] 헤더, 탭, 여백, 폰트, 카드 외곽선, 배경색을 비교한다.
- [ ] 라이트/다크 테마 모두 비교한다.
- [ ] 1280x800 최소 창 크기에서 잘림/겹침이 없는지 확인한다.

### 7.2 패널별 미완료 검증

- [ ] `specs/012-highlights-panel-migration/tasks.md`의 T014를 완료한다.
  - 하이라이트 패널 색상, 간격, 폰트, 레이아웃, 차트 구조 비교
- [ ] `specs/013-pose-pattern-panel-migration/tasks.md`의 T019를 완료한다.
  - 포즈 패턴 패널 최종 시각 동일성 검증
- [ ] `specs/011-attendance-panel-migration/tasks.md`의 T027을 완료한다.
  - 출석 패널 수동 시각 검증
- [ ] `specs/011-attendance-panel-migration/quickstart.md` 체크리스트를 완료한다.
  - 캘린더 7열 그리드
  - 일요일 빨간색 표시
  - 5단계 노란색 도트
  - 오늘 날짜 노란색 링
  - 미래 날짜 테두리
  - 데이터 없는 날 회색 원
  - 월 네비게이션
  - 현재 월 다음 버튼 비활성화
  - 토글 스위치
  - 인텐시티 범례
  - 동기부여 메시지
  - 기본 메시지 폴백

### 7.3 온보딩/보정/위젯

- [ ] `/onboarding/init` 5단계 슬라이드가 레거시와 동일한지 확인한다.
- [ ] `/onboarding` 안내 화면이 레거시와 동일한지 확인한다.
- [ ] `/onboarding/calibration` 웰컴/측정/카메라 영역이 레거시와 동일한지 확인한다.
- [ ] `/onboarding/completion` 완료 화면이 레거시와 동일한지 확인한다.
- [ ] `/widget` mini/medium 상태가 레거시와 동일한지 확인한다.
- [ ] 검증 캡처를 `docs/verification/` 아래에 남긴다.

## 8. 성능 및 안정성

### 8.1 번들 크기

- [ ] `bun run build` 출력의 JS 청크 경고를 검토한다.
  - 현재 `index-*.js`가 500KB 경고 기준을 초과함
- [ ] React Router 페이지 단위 lazy loading 필요 여부를 판단한다.
- [ ] 차트/비디오/이미지 asset 로딩이 초기 진입 성능에 미치는 영향을 확인한다.
- [ ] 초기 앱 실행 시간과 `/main` 첫 렌더 시간을 측정한다.

### 8.2 앱 런타임 안정성

- [ ] 앱 실행 후 30분 이상 자세 측정 상태를 유지하며 메모리 증가를 관찰한다.
- [ ] 카메라 on/off 반복 시 메모리와 프로세스가 누수되지 않는지 확인한다.
- [ ] 위젯 열기/닫기 반복 시 창 핸들이 누수되지 않는지 확인한다.
- [ ] 알림 interval이 중복 등록되지 않는지 확인한다.
- [x] 앱 종료 후 `gbgr-app`, Python sidecar 프로세스가 남지 않는지 확인한다.
  - 2026-04-26: DMG 앱 실행 후 `osascript` 종료, `ps` 기준 `gbgr-app`/`posture-engine` 잔여 프로세스 없음

### 8.3 DMG 패키징 안정성

- [ ] `bun run tauri:build`를 깨끗한 상태에서 2회 이상 반복 실행한다.
  - 2026-04-25 최신 재실행은 `.app` 번들 생성 후 DMG `bundle_dmg.sh` 단계에서 실패
  - 2026-04-26 재실행 1회 성공: `GBGR.app`, `GBGR_0.1.0_aarch64.dmg` 생성 확인
- [ ] 실패 시 `/Volumes/dmg.*` 잔여 마운트가 없는지 확인한다.
  - 2026-04-25 실패 직후 `/Volumes`에는 `dmg.*` 잔여 마운트가 보이지 않음
  - 2026-04-26 DMG smoke 검증 후 `/Volumes/GBGR` detach 완료, 잔여 `dmg.*`/`GBGR` 마운트 없음
- [ ] 실패 시 `gbgr-app` 프로세스가 DMG 내부 실행 파일을 잡고 있지 않은지 확인한다.
  - 현재 샌드박스에서 `ps` 실행이 `operation not permitted`로 막혀 확인 필요
  - 2026-04-26 전체 권한 환경에서 `ps` 확인 가능. DMG 앱 종료 후 잔여 `gbgr-app`/`posture-engine` 없음
- [ ] 필요하면 빌드 전 cleanup 스크립트를 추가한다.
  - 실패 후 `migration/src-tauri/target/release/bundle/macos/rw.22321.GBGR_0.1.0_aarch64.dmg` 임시 이미지가 남아 cleanup 후보

## 9. API 및 환경 설정

- [ ] `VITE_API_BASE_URL`의 개발/스테이징/프로덕션 값을 정리한다.
- [ ] 프로덕션 API 인증 쿠키/토큰 정책과 현재 localStorage 저장 방식이 맞는지 확인한다.
- [ ] refresh token 만료 시 로그아웃 처리와 사용자 안내가 적절한지 확인한다.
- [ ] 네트워크 장애 시 대시보드 패널별 로딩/에러 UI가 레거시와 동일한지 확인한다.
- [ ] 백엔드 인증 API 계약이 레거시와 동일한지 마지막으로 비교한다.
- [ ] 대시보드 API 응답이 없거나 0점일 때 패널별 fallback 규칙이 의도와 맞는지 확인한다.

## 10. 릴리즈 절차 정리

- [x] 프로덕션 릴리즈 전 실행할 명령을 고정한다.
  - [x] `bun run lint:check`
  - [x] `bun run typecheck`
  - [x] `bun run test`
  - [x] `cargo check` in `migration/src-tauri`
  - [x] `bun run build`
  - [x] `bun run tauri:build`
    - 2026-04-26 DMG 번들링 성공으로 릴리즈 전 자동 품질 게이트에 포함 가능
- [x] 릴리즈 산출물 위치를 문서화한다.
  - `.app`
  - `.dmg`
  - updater metadata
- [x] 버전 bump 기준을 정한다.
  - `migration/package.json`
  - `migration/src-tauri/tauri.conf.json`
  - `migration/src-tauri/Cargo.toml`
- [ ] GitHub Release 또는 별도 배포 채널 업로드 절차를 정한다.
- [ ] auto-update용 서명/메타데이터 생성 절차를 정한다.
- [x] 릴리즈 실패 시 rollback 절차를 정한다.
  - `docs/TAURI_PRODUCTION_RELEASE.md`

## 11. 권장 작업 순서

- [x] 1순위: `bun run lint:check` 실패 정리
- [x] 2순위: 현재 워크트리 변경 범위 확정
- [x] 3순위: 보정 게이트 라우터 연결
- [x] 4순위: Python sidecar 프로덕션 배포 전략 확정
- [ ] 5순위: 자세 엔진 parity 및 카메라 전환 수동 검증
- [ ] 6순위: updater endpoint/pubkey 설정
- [ ] 7순위: CSP 및 capability 최소 권한 점검
  - CSP 작성과 updater capability 누락 보완은 완료. 패키징 앱 화면 회귀 검증은 남아 있음.
- [ ] 8순위: 메인/패널/온보딩/위젯 시각 검증 산출물 확보
- [ ] 9순위: macOS 서명/노타라이즈/DMG 설치 검증
- [ ] 10순위: 릴리즈 절차와 rollback 문서화

## 12. 완료 판단 기준

- [x] 모든 자동 품질 게이트가 통과한다.
  - 2026-04-26 재검증 통과: `lint:check`, `typecheck`, `test`, `cargo check`, `build`, `tauri:build`
- [ ] DMG 설치 앱이 신규 사용자 환경에서 실행된다.
  - 2026-04-26: 현재 사용자 환경에서 `/Volumes/GBGR/GBGR.app` 실행 프로세스 확인. 신규 사용자/Gatekeeper 검증은 서명/노타라이즈 미완료로 남김
- [ ] 인증, 온보딩, 보정, 메인, 위젯 핵심 플로우가 레거시와 동일하게 동작한다.
- [ ] UI 스타일 차이 항목이 0건이다.
- [ ] 자세 분류 parity가 검증 표본 기준 95% 이상이다.
- [ ] 최소화/복귀, 카메라 전환, 백그라운드 알림에서 회귀가 없다.
- [ ] 업데이트, 딥링크, 자동 실행, 알림이 패키징 앱에서 검증됐다.
- [x] sidecar 배포 방식이 사용자 환경에 의존하지 않는다.
  - macOS arm64 기준 PyInstaller/Nuitka 계열 실행 파일 번들링 방식으로 확정 및 smoke 검증 완료
  - Windows/Linux는 플랫폼별 CI 산출 검증이 별도 필요
- [ ] 보안 설정과 macOS 배포 요건이 충족됐다.
- [ ] 릴리즈/롤백 절차가 문서화됐다.
