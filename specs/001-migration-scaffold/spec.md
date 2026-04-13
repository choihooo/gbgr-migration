# Feature Specification: Migration 폴더 기본 구조 구성

**Feature Branch**: `001-migration-scaffold`
**Created**: 2026-04-13
**Status**: Draft
**Input**: User description: "기본 폴더 구조 구성해봐 migration 폴더"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tauri 프로젝트 초기화 (Priority: P1)

개발자가 `migration/` 폴더에 실행 가능한 Tauri + React 프로젝트를
초기화하여 이후 기능 마이그레이션을 시작할 수 있는 기반을 확보한다.

**Why this priority**: 이후 모든 마이그레이션 작업이 이 구조 위에서
진행되므로 가장 먼저 완료되어야 한다.

**Independent Test**: `migration/`에서 앱이 실행되어 빈 화면이
표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** `migration/` 폴더가 비어 있음, **When** 프로젝트 초기화 완료,
   **Then** `bun run tauri dev`로 앱이 실행되고 창이 표시된다.
2. **Given** 초기화된 프로젝트, **When** 빌드 실행,
   **Then** lint, typecheck, build가 모두 성공한다.

---

### User Story 2 - 레거시 FSD 구조 반영 (Priority: P2)

개발자가 마이그레이션 대상인 레거시의 FSD 레이어 구조를
새 프로젝트에서도 동일하게 찾을 수 있다.

**Why this priority**: 헌법 원칙 4(점진적 마이그레이션)에 따라
레거시와의 구조 대응이 명확해야 기능 단위 포팅이 가능하다.

**Independent Test**: 레거시의 각 FSD 레이어(entities, features, shared,
widgets, pages, app)에 대응하는 폴더가 새 프로젝트에 존재하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 레거시에 4개 entity(posture, session, dashboard, user)가 존재,
   **When** 폴더 구조 확인,
   **Then** 새 프로젝트에 동일한 4개 entity 폴더가 존재한다.
2. **Given** 레거시에 5개 feature(auth, calibration, dashboard,
   notification, onboarding)가 존재, **When** 폴더 구조 확인,
   **Then** 새 프로젝트에 동일한 5개 feature 폴더가 존재한다.

---

### User Story 3 - 레거시 디자인 토큰 이관 (Priority: P3)

개발자가 레거시의 색상, 타이포그래피, 간격 값을 새 프로젝트에서
그대로 사용할 수 있다.

**Why this priority**: 헌법 원칙 2(UI 충실도 보존)의 전제 조건이다.
포팅 시작 전 토큰이 준비되어 있어야 한다.

**Independent Test**: 레거시의 색상 값이 새 프로젝트의 스타일
설정에서 동일하게 조회되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 레거시 colors.css에 정의된 색상 값, **When** 새 프로젝트의
   스타일 파일 확인, **Then** 동일한 색상 값이 포함되어 있다.

### Edge Cases

- Electron 전용 모듈(main, preload)은 Tauri 구조에 대응하는
  `src-tauri/` 영역으로 분리된다.
- 레거시에만 존재하고 새 앱에서 불필요한 모듈(electron-vendor
  관련 유틸)은 폴더 구조에서 제외한다.

## Clarifications

### Session 2026-04-13

- Q: 레거시의 정적 에셋(이미지, SVG, 폰트, 비디오)도 이 스펙에서 함께 이관할까요? → A: 제외 — 각 기능 포팅 시 개별 이관
- Q: 레거시의 공통 UI 컴포넌트(Button, Modal 등)도 이 스펙에서 이관할까요? → A: 제외 — 각 기능 포팅 시 필요한 컴포넌트만 이관

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `migration/`에 Tauri 2 + React + TypeScript 프로젝트가
  초기화되어야 한다 (identifier: com.gbgr.app).
- **FR-002**: 패키지 매니저는 Bun을 사용하고, Tauri CLI 런타임은
  Node.js를 사용한다.
- **FR-003**: 프론트엔드 폴더 구조는 레거시의 FSD 레이어를
  동일하게 반영해야 한다: app, pages, widgets, features, entities, shared.
- **FR-004**: 각 FSD 레이어 아래에 레거시와 동일한 도메인 폴더가
  존재해야 한다: entities(posture, session, dashboard, user),
  features(auth, calibration, dashboard, notification, onboarding),
  pages(레거시의 모든 page), widgets(camera, widget).
- **FR-005**: 레거시의 디자인 토큰(색상, 타이포그래피, 간격)이
  새 프로젝트의 스타일 설정에 포함되어야 한다.
  정적 에셋(이미지, SVG, 폰트, 비디오)은 이 스펙 범위에서 제외하며
  각 기능 포팅 시 개별적으로 이관한다.
- **FR-006**: 상태 관리(Zustand)와 서버 상태 관리(TanStack Query)
  의존성이 설치되어야 한다.
- **FR-007**: lint(Biome), 포맷팅, 타입체크 설정이 완료되어야 한다.
- **FR-008**: `bun run tauri dev` 실행 시 앱 창이 표시되어야 한다.
- **FR-009**: lint, typecheck, build가 모두 성공해야 한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `migration/`에서 `bun run tauri dev` 실행 시 10초 이내에
  앱 창이 표시된다.
- **SC-002**: 레거시의 모든 FSD 레이어와 도메인 폴더가
  새 프로젝트에 1:1로 대응된다.
- **SC-003**: 레거시의 색상, 폰트, 간격 토큰이 100% 이관된다.
- **SC-004**: lint, typecheck, build가 모두 성공한다.

## Assumptions

- 프로그래밍 언어는 TypeScript를 그대로 사용한다.
- 스타일링은 Tailwind CSS를 그대로 사용한다.
- 상태 관리(Zustand, TanStack Query) 패턴을 그대로 유지한다.
- 마이그레이션은 기능 단위로 점진적으로 진행하며,
  이 스펙은 폴더 구조와 기본 설정만 다룬다.
- 빈 폴더에 `.gitkeep`을 사용하여 Git에 추적되도록 한다.
