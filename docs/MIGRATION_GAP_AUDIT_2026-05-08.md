# 마이그레이션 갭 감사 보고서

- 작성일: 2026-05-08
- 범위: 레거시 Electron `src/`, Tauri/React `migration/`, Rust `migration/src-tauri`, `specs/`, `docs/`, `.github/workflows`
- 방식: 메인 에이전트 직접 점검 + 서브 에이전트 3개 병렬 감사
- 주의: 본 문서는 코드 수정 없이 현재 상태를 기록한 감사 산출물이다.

## 요약

현재 `migration` 앱은 라우팅, 인증 기본 골격, 주요 대시보드 패널 UI, 자세 엔진 브리지의 큰 틀은 이관되어 있다. 다만 릴리즈 후보로 보기에는 아직 부족하다. 가장 큰 갭은 네 가지다.

1. 보안/배포: 업데이터 설정을 렌더러가 주입할 수 있고, API URL 검증이 문자열 prefix 기반이며, 위젯 권한이 과다하다.
2. 핵심 기능 parity: 보정 게이트, 측정 메트릭 저장, 분석 이벤트, 하이라이트 실데이터 연동, 회원탈퇴 API가 레거시와 동등하지 않다.
3. 자세 엔진 운영 안정성: sidecar timeout, release fallback, 바이너리 번들 보장, 큰 frame payload 제한이 부족하다.
4. 검증/CI: `migration` 품질 게이트가 기본 PR CI에 없고, Vitest 1건이 실패하며, UI 동일성/자세 parity 수동 검증 산출물이 부족하다.

## 현재 검증 결과

| 명령 | 위치 | 결과 | 비고 |
| --- | --- | --- | --- |
| `bun run typecheck` | `migration/` | 통과 | TypeScript 정적 검증 통과 |
| `bun run test` | `migration/` | 실패 | 19개 파일 중 1개 실패, 81개 테스트 중 1개 실패 |
| `cargo test` | `migration/src-tauri/` | 통과 | Rust 테스트 4개 통과, macOS private API 관련 경고 3개 |

Vitest 실패 내용:

- 실패 파일: `migration/tests/unit/shared/api/instance.test.ts`
- 실패 테스트: `shared/api/instance > 리프레시 성공 시 새 토큰을 저장한다`
- 원인: `refreshAccessToken()`이 `api.post('/auth/refresh')`를 호출하는데 테스트 모킹이 실제 요청을 막지 못해 jsdom `Network Error`가 발생한다.
- 근거: `migration/src/shared/api/instance.ts:162`, `migration/tests/unit/shared/api/instance.test.ts:33`

## 릴리즈 차단 이슈

### 1. 업데이터가 렌더러 입력을 신뢰함

- 심각도: 차단
- 영향: 렌더러가 손상되면 임의 endpoint/pubkey 조합으로 업데이트 확인/설치를 유도할 수 있다.
- 근거:
  - `migration/src-tauri/src/app_updates.rs:12`에서 `UpdateConfigPayload`가 `endpoints`, `pubkey`를 받는다.
  - `migration/src-tauri/src/app_updates.rs:75`와 `migration/src-tauri/src/app_updates.rs:126`에서 payload 값으로 updater builder를 구성한다.
  - `migration/src-tauri/tauri.conf.json:69`의 기본 updater `pubkey`, `endpoints`는 비어 있다.
- 권장 조치:
  - updater endpoint/pubkey는 `tauri.conf.json`, 빌드 시 생성되는 release config, 또는 Rust 상수로 고정한다.
  - 렌더러 명령은 “업데이트 확인”과 “설치” 의도만 전달하게 축소한다.
  - 렌더러가 넘긴 updater config를 받는 command 계약을 제거하거나 debug 전용으로 제한한다.

### 2. Rust API 프록시 URL 검증 우회 가능

- 심각도: 차단
- 영향: `https://api.bugi.co.kr.evil.example` 같은 URL이 prefix 검사를 통과할 수 있다.
- 근거:
  - `migration/src-tauri/src/commands/api.rs:25`의 `resolve_api_url()`이 `url.starts_with(API_BASE_URL)`만 검사한다.
  - `migration/src-tauri/src/commands/api.rs:61` 이후 임의 HTTP method와 body를 허용한다.
- 권장 조치:
  - `url::Url`로 파싱하고 scheme은 `https`, host는 정확히 `api.bugi.co.kr` 또는 허용된 서브도메인만 허용한다.
  - method allowlist를 둔다.
  - reqwest client에 timeout을 설정한다.
  - URL 검증 단위 테스트를 추가한다.

### 3. release sidecar 실행 경로가 재현 가능하지 않음

- 심각도: 차단
- 영향: 패키징 앱에서 sidecar 바이너리가 누락되어도 시스템 Python/script fallback으로 동작하려 하며, 사용자 환경에서는 실패 가능성이 높다.
- 근거:
  - `migration/src-tauri/src/posture_engine/sidecar.rs:115`는 release에서 바이너리를 우선 탐색한다.
  - `migration/src-tauri/src/posture_engine/sidecar.rs:122`에서 바이너리가 없으면 `main.py`와 `python3/python` 실행으로 fallback한다.
  - `migration/package.json:21`의 `tauri:build`는 `build:posture-sidecar`를 선행하지 않는다.
  - `migration/src-tauri/tauri.conf.json:49`는 `../../sidecar/posture-engine` 리소스를 묶지만 바이너리 생성 여부를 보장하지 않는다.
- 권장 조치:
  - release에서는 번들 내부 sidecar 바이너리가 없으면 즉시 실패하게 한다.
  - `tauri:build` 또는 CI release job에서 `build:posture-sidecar`를 선행한다.
  - 빌드 전 sidecar 바이너리 존재 검증 스크립트를 추가한다.

### 4. sidecar IPC timeout 부재

- 심각도: 차단
- 영향: Python sidecar가 응답하지 않으면 Rust command가 무기한 대기하고, sidecar mutex를 잡은 상태에서 다른 자세 엔진 명령도 막힐 수 있다.
- 근거:
  - `migration/src-tauri/src/posture_engine/sidecar.rs:61`의 `read_line()`이 timeout 없이 응답을 기다린다.
- 권장 조치:
  - 요청별 timeout을 도입한다.
  - timeout 발생 시 sidecar health check 후 재시작하거나 명시적 오류를 반환한다.
  - hang sidecar를 흉내 내는 Rust 테스트를 추가한다.

### 5. `/main` 보정 게이트 누락

- 심각도: 차단
- 영향: 보정이 필요한 사용자가 메인 화면에 접근할 수 있어 자세 측정 기준이 없는 상태로 앱을 사용할 수 있다.
- 근거:
  - migration은 `/main`에 `ProtectedRoute`만 적용한다: `migration/src/shared/config/router.tsx:50`
  - 레거시는 `/main` loader에서 보정 가능 상태를 확인해 `/onboarding/init`으로 보낸다: `src/renderer/src/shared/config/router.tsx:41`
- 권장 조치:
  - `/main`에도 calibration gate를 적용한다.
  - 직접 URL 접근, 새로고침, deep-link 진입 테스트를 추가한다.

### 6. 측정 메트릭 저장 흐름 누락

- 심각도: 차단
- 영향: 세션 리포트, 그래프, 출석, 평균 점수 데이터 품질에 직접 영향을 준다.
- 근거:
  - migration `WebcamPanel`은 stop session만 호출한다: `migration/src/features/main-panels/ui/WebcamPanel.tsx:57`
  - 레거시는 `metricsRef`에 점수를 쌓고 종료/주기 전송/창 닫기 정리를 수행한다: `src/renderer/src/pages/main-page/index.tsx:63`, `src/renderer/src/pages/main-page/index.tsx:93`, `src/renderer/src/pages/main-page/index.tsx:212`
- 권장 조치:
  - 자세 결과를 1초 단위 metric으로 축적한다.
  - 5분 자동 저장, 세션 종료 전 flush, 앱 종료/창 닫기 flush를 복원한다.
  - 실패 시 재시도/최소한의 사용자 상태 정리 규칙을 문서화한다.

## 높은 우선순위 이슈

### 7. 세션 시작/종료 분석 이벤트 누락

- 영향: 레거시에서 수집하던 사용량 분석 이벤트가 Tauri 앱에서 빠진다.
- 근거:
  - migration 세션 mutation은 `sessionId` 저장 중심이다: `migration/src/entities/session/model/use-session-mutations.ts:12`
  - 레거시는 `measureStart`, `firstMeasureStart`, `meaningfulUse`, `measureEnd`를 기록한다: `src/renderer/src/entities/session/api/use-create-session-mutation.ts:37`, `src/renderer/src/entities/session/api/use-stop-session-mutation.ts:40`
- 권장 조치:
  - 레거시와 동일한 이벤트 명세를 migration에 이관한다.
  - 이벤트 중복 방지 localStorage key의 lifecycle도 함께 이관한다.

### 8. capability가 `main`과 `widget`에 동일하게 과다 부여됨

- 영향: 위젯 창이 updater, autostart, window create, event emit/listen 등 필요 이상의 권한을 가진다.
- 근거:
  - `migration/src-tauri/capabilities/default.json:5`에서 `main`, `widget`에 같은 권한을 부여한다.
  - `migration/src-tauri/capabilities/default.json:20` 이후 updater/autostart/window 생성 권한이 포함된다.
- 권장 조치:
  - `main`과 `widget` capability를 분리한다.
  - widget은 drag, close, size/position 등 실제 필요한 권한만 유지한다.
  - capability 최소 권한 검증 체크리스트를 추가한다.

### 9. 하이라이트 패널이 정적 목 데이터를 사용

- 영향: 레거시 `/dashboard/highlight` 데이터와 달라 실제 사용자 대시보드가 부정확해진다.
- 근거:
  - `migration/src/features/main-panels/ui/HighlightsPanel/hooks/useHighlightsChart.ts:49`에서 주간 `257/321`, 월간 `210/225`를 하드코딩한다.
  - 레거시는 highlight query를 사용한다.
- 권장 조치:
  - `entities/dashboard`의 highlight query와 연결한다.
  - 로딩/에러/빈 데이터 상태를 레거시와 동일하게 맞춘다.

### 10. 회원탈퇴가 실제 API와 연결되지 않음

- 영향: 사용자는 탈퇴했다고 보지만 서버 계정은 유지될 수 있다.
- 근거:
  - `migration/src/features/settings/ui/SettingsModal.tsx:139`의 `handleWithdraw`가 `TODO` 후 로컬 인증만 삭제한다.
- 권장 조치:
  - 레거시 `useWithdrawMutation()` 흐름을 이관한다.
  - 성공 시에만 로컬 상태를 정리한다.
  - 실패 메시지와 재시도 동작을 고정한다.

### 11. 로그아웃/탈퇴 정리 범위가 레거시보다 좁음

- 영향: `sessionId`, `sessionStartDistance`, `lastSessionId`, 분석 이벤트 플래그, 보정 결과 등이 사용자 간에 섞일 수 있다.
- 근거:
  - migration `clearAuthState()`는 토큰/세션 중심이다: `migration/src/features/settings/ui/SettingsModal.tsx:125`
  - 레거시는 더 넓은 localStorage 정리를 수행한다.
- 권장 조치:
  - 인증 사용자 전환 시 지워야 할 storage key 목록을 명시한다.
  - 보정 결과는 사용자별 key로 유지할지, 로그아웃 시 제거할지 정책을 확정한다.

### 12. 평균 그래프의 랜덤 fallback

- 영향: 데이터가 없거나 점수가 0이면 렌더마다 다른 값을 보여줄 수 있다.
- 근거:
  - `migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts:51`
  - `migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts:56`
- 권장 조치:
  - 레거시 동일성 요구 때문에 임시 fallback을 유지한다면 deterministic seed를 둔다.
  - 프로덕션에서는 실제 빈 상태 UI 또는 명시적 fallback 정책으로 전환한다.

### 13. ThemeProvider가 앱에 연결되지 않음

- 영향: 저장된 테마/system 테마 hydrate가 초기 앱 진입에서 보장되지 않는다.
- 근거:
  - `migration/src/app/providers/router-provider.tsx:22`는 `AppI18nProvider`와 `AuthProvider`만 감싼다.
  - `migration/src/app/providers/theme-provider.tsx`는 존재하지만 사용되지 않는다.
- 권장 조치:
  - provider 계층에 `ThemeProvider`를 추가한다.
  - 앱 재시작 후 라이트/다크 테마 유지 테스트를 추가한다.

### 14. devtools가 release feature에 포함됨

- 영향: 배포 앱에 개발자 도구 기능이 포함될 수 있다.
- 근거:
  - `migration/src-tauri/Cargo.toml:21`에 `features = ["macos-private-api", "devtools"]`가 고정되어 있다.
- 권장 조치:
  - devtools는 debug 전용 feature로 분리한다.
  - release 빌드 설정에서 제거한다.

### 15. frame payload 크기 제한 없음

- 영향: 렌더러 버그 또는 공격으로 큰 base64 문자열이 들어오면 메모리/CPU DoS가 가능하다.
- 근거:
  - frame payload가 Rust command를 거쳐 Python sidecar로 그대로 전달된다.
  - 관련 경로: `migration/src-tauri/src/state/posture_engine_state.rs`, `migration/src-tauri/src/commands/posture_engine.rs`, `sidecar/posture-engine/engine/pose_detector.py`
- 권장 조치:
  - Rust command에서 frame payload 최대 길이와 이미지 크기를 제한한다.
  - 초과 시 고정된 오류 코드를 반환한다.

## 중간 우선순위 이슈

### 16. `migration` 품질 게이트가 기본 CI에 없음

- 영향: PR에서 Tauri/React migration 회귀가 main에 들어갈 수 있다.
- 근거:
  - `.github/workflows/ci.yml:19` 이후 루트 Electron lint/typecheck/build 중심이다.
  - `migration` 전용 검증은 release workflow에 치우쳐 있다.
- 권장 조치:
  - `migration-ci` job을 추가한다.
  - 최소 명령: `bun run lint:check`, `bun run typecheck`, `bun run test`, `bun run build`, `cargo check` 또는 `cargo test`.

### 17. `migration` 패키지 매니저 사용이 혼재됨

- 영향: 로컬은 Bun 기준인데 release workflow는 `npm ci`를 사용한다. lockfile과 설치 결과가 달라질 수 있다.
- 근거:
  - `migration/package.json`은 `packageManager: bun@1.3.12`를 선언한다.
  - `.github/workflows/tauri-release.yml`은 `npm ci`, `npm run tauri`를 사용한다.
- 권장 조치:
  - release에서 npm을 유지할지 Bun으로 통일할지 결정한다.
  - 유지한다면 `package-lock.json` 생성/관리 정책을 문서화한다.

### 18. 문서의 검증 명령과 실제 script 불일치

- 영향: quickstart를 그대로 실행하면 실패하거나 담당자마다 다른 명령을 쓴다.
- 근거:
  - `specs/011-attendance-panel-migration/quickstart.md`는 `bun run check`를 요구한다.
  - `migration/package.json`에는 `check` script가 없다.
- 권장 조치:
  - 문서를 `bun run lint:check && bun run typecheck`로 수정하거나 `check` script를 추가한다.

### 19. 이전 절대 경로가 스펙에 남아 있음

- 영향: 다른 개발자/CI에서 재현성이 떨어진다.
- 근거:
  - `specs/015-posture-engine-migration/tasks.md`에 `/home/choiho/coding/FE-migration/...` 경로가 남아 있다.
- 권장 조치:
  - 모든 스펙 경로를 repo-relative 경로로 정규화한다.

### 20. 문서 한글 원칙 미준수 항목

- 영향: 프로젝트 규칙 “모든 문서는 한글로 작성”과 불일치한다.
- 근거:
  - 일부 spec-kit boilerplate와 workflow/release notes 문구에 영어가 남아 있다.
- 권장 조치:
  - 자동 생성 문구 예외 기준을 두거나 템플릿을 한글화한다.

### 21. macOS 배포 설정 검증 부족

- 영향: 카메라, sidecar 실행, 자동 시작, 업데이트, Gatekeeper/노타라이즈에서 실제 사용자 환경 실패 가능성이 있다.
- 근거:
  - `migration/src-tauri/Info.plist`는 카메라/마이크 설명 중심이다.
  - `migration/src-tauri/tauri.conf.json:13`의 `macOSPrivateApi: true`는 배포 정책 리스크를 만든다.
  - `docs/PRODUCTION_HANDOFF_TODO.md`에 서명/노타라이즈/Gatekeeper 항목이 열린 상태다.
- 권장 조치:
  - Developer ID 서명, hardened runtime, notarization, sidecar 실행 권한 검증 결과를 릴리즈 체크리스트에 남긴다.

## 검증 산출물 부족

다음 수동 검증은 릴리즈 전에 산출물을 남겨야 한다.

1. UI 동일성 검증
   - `specs/006-main-page-migration/tasks.md` T032
   - `specs/012-highlights-panel-migration/tasks.md` T014
   - `specs/013-pose-pattern-panel-migration/tasks.md` T019
   - `specs/011-attendance-panel-migration/tasks.md` T027
2. 자세 엔진 검증
   - `specs/015-posture-engine-migration/tasks.md` T039~T041
   - 자세 분류 결과 parity 95% 이상
   - 최소화/복귀 10회
   - 카메라 충돌 0건
   - 복귀 후 최신 상태 2초 이내 표시
3. 프로덕션 핸드오프
   - `docs/PRODUCTION_HANDOFF_TODO.md`의 프로덕션 실사용 검증, updater, deep-link, CSP, capability, 서명/노타라이즈 항목

권장 산출물 위치:

- `docs/verification/main-page/`
- `docs/verification/dashboard-panels/`
- `docs/verification/posture-engine/`
- `specs/015-posture-engine-migration/verification.md`

## 권장 처리 순서

### 1단계: 릴리즈 차단 제거

1. updater config를 Rust/빌드 설정으로 고정한다.
2. API URL 검증을 `Url` 기반으로 바꾸고 timeout을 추가한다.
3. release sidecar fallback을 제거하고 sidecar 바이너리 빌드 선행을 보장한다.
4. sidecar IPC timeout과 재시작 정책을 추가한다.
5. `/main` 보정 게이트를 복원한다.
6. 측정 메트릭 저장/flush 흐름을 이관한다.
7. Vitest 실패 1건을 수정한다.

### 2단계: 레거시 기능 parity 확보

1. 세션 분석 이벤트를 이관한다.
2. 하이라이트 패널을 실데이터 query에 연결한다.
3. 회원탈퇴 API를 연결한다.
4. 로그아웃/탈퇴 storage 정리 범위를 레거시와 맞춘다.
5. ThemeProvider를 앱 provider 계층에 연결한다.
6. 평균 그래프 fallback 정책을 확정한다.

### 3단계: 보안/권한/배포 안정화

1. `main`/`widget` capability를 분리한다.
2. devtools를 release에서 제거한다.
3. frame payload 크기 제한을 추가한다.
4. macOS 서명/노타라이즈/권한 검증 절차를 완료한다.
5. updater endpoint/pubkey 운영 절차를 문서화한다.

### 4단계: CI와 문서 정리

1. `migration-ci`를 기본 PR CI에 추가한다.
2. Bun/npm 사용 정책을 정리한다.
3. 문서의 잘못된 script와 절대 경로를 수정한다.
4. 한글 문서 원칙 미준수 문구를 정리한다.
5. UI 동일성 캡처와 자세 parity 표본을 `docs/verification/`에 남긴다.

## 테스트 추가 권장 목록

- `api_request` URL host 검증 테스트
- updater config가 렌더러 payload에서 오지 않는지 검증하는 테스트
- release sidecar 바이너리 누락 시 실패 테스트
- sidecar 응답 timeout 테스트
- 큰 frame payload 거부 테스트
- `/main` 보정 게이트 회귀 테스트
- 측정 세션 metric 축적/flush 테스트
- 하이라이트 패널 API mapping 테스트
- 회원탈퇴 성공/실패 흐름 테스트
- 로그아웃/사용자 전환 storage 정리 테스트
- widget capability 최소 권한 검증

## 결론

이 프로젝트의 부족한 부분은 단순 UI 잔여 작업보다 런타임 신뢰 경계, sidecar 운영 안정성, 측정 데이터 저장, 릴리즈 검증 체계에 집중되어 있다. 현재 상태에서 바로 배포하기보다 위 “1단계: 릴리즈 차단 제거”를 먼저 완료하고, 그 다음 레거시 parity와 수동 검증 산출물을 채우는 순서가 가장 안전하다.
