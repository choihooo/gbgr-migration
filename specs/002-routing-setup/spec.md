# Feature Specification: 라우팅 설정

**Feature Branch**: `002-routing-setup`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "라우팅 설정 해보자"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 인증 없이 접근 가능한 페이지 이동 (Priority: P1) 🎯 MVP

사용자가 로그인, 회원가입, 이메일 인증, 인증 메일 재발송 페이지 간에 자유롭게 이동할 수 있다. URL을 직접 입력하거나 링크를 통해 접근해도 올바른 페이지가 표시된다.

**Why this priority**: 인증 페이지는 앱의 진입점이다. 로그인 없이 다른 기능에 접근할 수 없으므로 라우팅의 가장 기본적인 검증이 된다.

**Independent Test**: `/auth/login`, `/auth/signup`, `/auth/verify`, `/auth/resend` URL로 직접 접근 시 각 페이지 컴포넌트가 렌더링된다.

**Acceptance Scenarios**:

1. **Given** 앱이 실행 중, **When** 사용자가 `/auth/login`에 접근, **Then** 로그인 페이지가 표시된다
2. **Given** 로그인 페이지, **When** 회원가입 링크 클릭, **Then** `/auth/signup`으로 이동한다
3. **Given** 회원가입 완료, **When** 이메일 인증 필요, **Then** `/auth/verify`로 이동한다
4. **Given** 이메일 인증 페이지, **When** 재발송 링크 클릭, **Then** `/auth/resend`로 이동한다
5. **Given** 앱이 실행 중, **When** 루트 경로(`/`) 접근, **Then** 로그인 페이지로 리다이렉트된다

---

### User Story 2 - 인증 보호 라우트 (Priority: P2)

인증되지 않은 사용자는 보호된 페이지(메인, 온보딩)에 접근할 수 없고, 로그인 페이지로 리다이렉트된다. 인증된 사용자는 정상적으로 보호된 페이지에 접근할 수 있다.

**Why this priority**: 인증 가드는 보안의 기본이다. 하지만 인증 API 연동이 아직 완료되지 않았으므로, 토큰 존재 여부만으로 가드를 구현한다.

**Independent Test**: localStorage에 accessToken이 없으면 `/main` 접근 시 `/auth/login`으로 리다이렉트, accessToken이 있으면 `/main` 페이지가 정상 표시된다.

**Acceptance Scenarios**:

1. **Given** 인증 토큰 없음, **When** `/main` 접근 시도, **Then** `/auth/login`으로 리다이렉트된다
2. **Given** 인증 토큰 있음, **When** `/main` 접근, **Then** 메인 페이지가 정상 표시된다
3. **Given** 인증 토큰 있음, **When** `/auth/login` 접근, **Then** `/main`으로 리다이렉트된다 (이미 로그인됨)
4. **Given** 인증 토큰 없음, **When** `/onboarding` 접근 시도, **Then** `/auth/login`으로 리다이렉트된다

---

### User Story 3 - 온보딩 플로우 라우팅 (Priority: P3)

보정(캘리브레이션)이 필요한 사용자가 온보딩 플로우를 순차적으로 진행한다. 보정이 완료된 사용자는 메인 페이지로 바로 이동한다.

**Why this priority**: 온보딩은 첫 사용자 경험이지만, 캘리브레이션 상태 확인 로직이 필요하므로 P3로 설정. 현재는 라우트 구조만 구성하고, 상태 판별은 후속 스펙에서 구현한다.

**Independent Test**: `/onboarding/init`, `/onboarding/calibration`, `/onboarding/completion` URL로 접근 시 각 페이지가 표시된다.

**Acceptance Scenarios**:

1. **Given** 보정 필요 상태, **When** 온보딩 플로우 시작, **Then** `/onboarding/init`에서 시작한다
2. **Given** 온보딩 시작 페이지, **When** 다음 단계 이동, **Then** `/onboarding/calibration`으로 이동한다
3. **Given** 보정 완료, **When** 다음 단계 이동, **Then** `/onboarding/completion`으로 이동한다
4. **Given** 보정 완료 상태, **When** `/main` 접근, **Then** 메인 페이지가 정상 표시된다

---

### User Story 4 - 위젯 라우트 (Priority: P4)

별도 위젯 윈도우에서 `/widget` 경로로 접근 시 위젯 전용 페이지가 표시된다.

**Why this priority**: 위젯은 독립적인 윈도우에서 동작하지만, 라우팅 관점에서는 단일 경로이므로 복잡도가 낮다.

**Independent Test**: `/widget` URL로 접근 시 위젯 페이지 컴포넌트가 렌더링된다.

**Acceptance Scenarios**:

1. **Given** 위젯 윈도우, **When** `/widget` 접근, **Then** 위젯 전용 페이지가 표시된다
2. **Given** 위젯 페이지, **When** 페이지 로드, **Then** 인증 가드 없이 표시된다 (위젯은 독립 동작)

---

### User Story 5 - 딥링크 이메일 인증 콜백 (Priority: P5)

이메일 인증 링크를 클릭하면 앱이 열리고 `/auth/verify-callback` 페이지로 이동하여 인증이 처리된다.

**Why this priority**: 딥링크는 Tauri 플러그인 설정이 필요하므로 라우팅 기본 설정 이후에 처리한다. 라우트 자체는 P1에 포함되지만, 딥링크 연동은 별도 작업이다.

**Independent Test**: `gbgr://auth/verify-callback?token=xxx` 형식의 URL이 처리되어 인증 콜백 페이지가 표시된다.

**Acceptance Scenarios**:

1. **Given** 앱이 실행 중이지 않음, **When** 이메일 인증 링크 클릭, **Then** 앱이 실행되고 `/auth/verify-callback` 페이지가 표시된다
2. **Given** 앱이 실행 중, **When** 이메일 인증 링크 클릭, **Then** 기존 앱 창에서 `/auth/verify-callback` 페이지로 이동한다
3. **Given** 인증 콜백 페이지, **When** 토큰 파라미터가 유효, **Then** 인증이 처리된다

---

### Edge Cases

- 존재하지 않는 URL 접근 시 404 페이지 또는 기본 페이지로 리다이렉트
- 브라우저 뒤로가기/앞으로가기 버튼이 정상 동작
- 페이지 새로고침 시 현재 라우트가 유지됨
- 딥링크로 앱이 열릴 때 이미 다른 라우트에 있던 경우 처리
- 보호된 라우트 접근 후 로그인 완료 시 원래 이동하려던 페이지로 리다이렉트

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 앱은 11개 페이지에 대한 고유 URL 경로를 제공해야 한다 (로그인, 회원가입, 이메일 인증, 이메일 인증 콜백, 인증 메일 재발송, 메인, 보정, 온보딩, 온보딩 시작, 온보딩 완료, 위젯)
- **FR-002**: 루트 경로(`/`) 접근 시 로그인 페이지로 리다이렉트해야 한다
- **FR-003**: 인증이 필요한 경로(`/main`, `/onboarding/*`)에 인증 토큰 없이 접근하면 로그인 페이지로 리다이렉트해야 한다
- **FR-004**: 이미 인증된 상태에서 로그인 페이지 접근 시 메인 페이지로 리다이렉트해야 한다
- **FR-005**: 모든 페이지는 lazy loading으로 로드되어야 한다 (초기 로딩 시간 최소화)
- **FR-006**: 존재하지 않는 경로 접근 시 정의된 폴백 페이지로 이동해야 한다
- **FR-007**: 딥링크(`gbgr://`) 스킴을 통해 외부 링크에서 앱 내 특정 페이지로 바로 이동할 수 있어야 한다
- **FR-008**: 이메일 인증 콜백 경로(`/auth/verify-callback`)는 딥링크와 URL 직접 접근 모두 지원해야 한다
- **FR-009**: 페이지 전환 시 브라우저 히스토리(뒤로가기/앞으로가기)가 정상 동작해야 한다
- **FR-010**: 페이지 새로고침 시 현재 URL 경로가 유지되어야 한다

### Key Entities

- **Route**: 경로(path), 페이지 컴포넌트 매핑, 인증 필요 여부, 보정 상태 필요 여부
- **Auth Guard**: 인증 토큰 존재 여부를 확인하는 라우트 보호 메커니즘
- **Deep Link**: 외부 URI 스킴(`gbgr://`)에서 앱 내 라우트로의 매핑

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 모든 11개 경로가 올바른 페이지를 렌더링한다 (URL 직접 접근으로 검증)
- **SC-002**: 인증되지 않은 상태에서 보호된 경로 접근 시 100% 로그인 페이지로 리다이렉트된다
- **SC-003**: 딥링크 클릭 후 앱이 실행되고 올바른 페이지가 표시될 때까지 3초 이내
- **SC-004**: lazy loading 페이지가 로딩 중일 때 로딩 스피너가 표시된다 (빈 화면 없음)
- **SC-005**: 새로고침 후에도 동일한 페이지가 유지된다

## Assumptions

- 각 페이지 컴포넌트는 빈 placeholder 상태로 먼저 생성하고, 실제 UI는 후속 스펙에서 채운다
- 인증 가드는 localStorage의 accessToken 존재 여부로만 판별한다 (실제 토큰 유효성 검증은 Auth 스펙에서 처리)
- 딥링크 플러그인(`@tauri-apps/plugin-deep-link`)이 Tauri 설정에 추가되어 있다고 가정
- 보정 상태 확인은 후속 스펙에서 구현하며, 현재는 라우트 구조만 구성
- 위젯 라우트는 인증 가드에서 제외한다 (독립 윈도우에서 동작)
