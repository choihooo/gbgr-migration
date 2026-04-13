# Tasks: Migration 폴더 기본 구조 구성

**Input**: Design documents from `/specs/001-migration-scaffold/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: 이 스펙은 빌드/실행 검증만 수행하므로 테스트 태스크를 포함하지 않는다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Tauri app**: `migration/src/` (frontend), `migration/src-tauri/` (backend)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Tauri 2 + React + TypeScript 프로젝트 생성 및 기본 설정

- [x] T001 `bunx create-tauri-app` 실행하여 프로젝트 생성 (React + TypeScript + Bun, name: gbgr-app, identifier: com.gbgr.app) → 생성된 `gbgr-app/` 하위 내용물을 `migration/`으로 이동
- [x] T002 [P] Tailwind CSS v4 설치 및 Vite 설정 — `migration/vite.config.ts`에 `@tailwindcss/vite` 플러그인 추가, `migration/src/style.css`에 `@import 'tailwindcss'` 작성
- [x] T003 [P] Biome 설치 및 초기화 — `bun add -D -E @biomejs/biome`, `bunx --bun @biomejs/biome init`, `migration/biome.json`에 레거시와 동일한 규칙 적용 (참조: 루트 biome.json, indentStyle: space, lineWidth: 100, ignore: node_modules, dist, src-tauri/target, src-tauri/gen)
- [x] T004 [P] Zustand 및 TanStack Query 설치 — `bun add zustand @tanstack/react-query`
- [x] T005 `migration/package.json` scripts 업데이트 — lint, lint:check, format, tauri 스크립트 추가

**Checkpoint**: `bun run tauri dev`로 앱 창이 표시되는지 확인, `bun run lint:check` 통과, `bunx tsc --noEmit` 통과

---

## Phase 2: Foundational (FSD Structure + Design Tokens)

**Purpose**: 레거시 FSD 구조와 디자인 토큰을 반영하는 기반 구축. 모든 이후 기능 포팅의 전제.

**⚠️ CRITICAL**: 이 Phase가 완료되어야 이후 기능 포팅 작업 시작 가능

- [x] T006 `migration/src/` 하위에 FSD 레이어 디렉토리 생성 — app/layouts, app/providers, shared/api, shared/config, shared/hooks, shared/lib, shared/styles, shared/types, shared/ui (각 폴더에 `.gitkeep` 추가)
- [x] T007 [P] FSD entities 폴더 생성 — migration/src/entities/ 하위에 posture, session, dashboard, user 디렉토리 생성 (각 폴더에 `.gitkeep` 추가)
- [x] T008 [P] FSD features 폴더 생성 — migration/src/features/ 하위에 auth, calibration, dashboard, notification, onboarding 디렉토리 생성 (각 폴더에 `.gitkeep` 추가)
- [x] T009 [P] FSD pages 폴더 생성 — migration/src/pages/ 하위에 login-page, signup-page, email-verification-page, email-verification-callback-page, resend-verification-page, main-page, calibration-page, onboarding-page, onboarding-init-page, onboarding-completion-page, widget-page 디렉토리 생성 (각 폴더에 `.gitkeep` 추가)
- [x] T010 [P] FSD widgets 폴더 생성 — migration/src/widgets/ 하위에 camera, widget 디렉토리 생성 (각 폴더에 `.gitkeep` 추가)
- [x] T011 레거시 디자인 토큰 이관 — `src/renderer/src/shared/styles/colors.css`를 `migration/src/shared/styles/colors.css`로 복사, `src/renderer/src/shared/styles/typography.css`를 `migration/src/shared/styles/typography.css`로 복사, `src/renderer/src/shared/styles/breakpoint.css`를 `migration/src/shared/styles/breakpoint.css`로 복사
- [x] T012 `migration/src/style.css`에 디자인 토큰 import 추가 — `@import './shared/styles/colors.css'`, `@import './shared/styles/typography.css'`, `@import './shared/styles/breakpoint.css'`를 Tailwind import 이후에 추가
- [x] T013 create-tauri-app이 생성한 기본 파일 정리 — `migration/src/App.tsx`를 빈 렌더링 컴포넌트로 변경, 불필요한 기본 CSS 제거

**Checkpoint**: FSD 폴더 구조가 레거시와 1:1 대응, 디자인 토큰 파일이 존재

---

## Phase 3: User Story 1 - Tauri 프로젝트 초기화 (Priority: P1) 🎯 MVP

**Goal**: `bun run tauri dev`로 앱 창이 표시되고, lint/typecheck/build가 모두 성공

**Independent Test**: `migration/`에서 `bun run tauri dev` 실행 시 앱 창 표시, `bun run lint:check` 통과, `bunx tsc --noEmit` 통과

### Implementation for User Story 1

- [x] T014 [US1] `migration/vite.config.ts` 완성 — Tauri 개발 서버 포트(1420), TAURI_DEV_HOST 처리, build target(Windows: chrome105, macOS: safari14), src-tauri watch ignore 설정
- [x] T015 [US1] `migration/tsconfig.json` 검증 및 수정 — FSD 경로 alias가 필요한 경우 paths 설정 추가
- [x] T016 [US1] `migration/src-tauri/tauri.conf.json` 기본 설정 확인 — identifier(com.gbgr.app), window 크기, title 등
- [x] T017 [US1] 초기 품질 게이트 검증 — `bun run lint:check`, `bunx tsc --noEmit`, `bun run tauri build` 성공 확인 (이후 T025에서 최종 재검증)

**Checkpoint**: 앱이 실행되고 모든 품질 게이트 통과

---

## Phase 4: User Story 2 - 레거시 FSD 구조 반영 (Priority: P2)

**Goal**: 레거시의 모든 FSD 레이어와 도메인 폴더가 새 프로젝트에 1:1로 대응

**Independent Test**: 레거시 `src/renderer/src/`의 각 FSD 레이어 디렉토리가 `migration/src/`에 동일하게 존재하는지 확인

### Implementation for User Story 2

- [x] T018 [US2] FSD 레이어 검증 스크립트 작성 또는 수동 확인 — 레거시 entities(4), features(5), pages(11), widgets(2), shared(7)가 migration/에 동일하게 존재하는지 비교
- [x] T019 [US2] 누락된 FSD 폴더가 있으면 생성 — 비교 후 차이가 있으면 즉시 보완

**Checkpoint**: 레거시 FSD 구조와 100% 일치

---

## Phase 5: User Story 3 - 레거시 디자인 토큰 이관 (Priority: P3)

**Goal**: 레거시의 색상, 타이포그래피, 간격 토큰이 100% 이관됨

**Independent Test**: 레거시 colors.css의 모든 CSS 변수가 새 프로젝트에서 동일한 값으로 조회되는지 확인

### Implementation for User Story 3

- [x] T020 [US3] 디자인 토큰 정합성 검증 — 레거시 `src/renderer/src/shared/styles/colors.css`의 모든 변수를 `migration/src/shared/styles/colors.css`와 1:1 비교하여 값이 동일한지 확인
- [x] T021 [US3] typography.css 정합성 검증 — 레거시 typography.css의 모든 @utility가 동일하게 존재하는지 확인
- [x] T022 [US3] breakpoint.css 정합성 검증 — 레거시 breakpoint.css의 모든 값이 동일한지 확인

**Checkpoint**: 모든 디자인 토큰이 레거시와 100% 일치

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 최종 검증 및 정리

- [x] T023 [P] `.gitignore`에 `src-tauri/target/`, `src-tauri/gen/`, `dist/` 추가 — `migration/.gitignore`
- [x] T024 [P] `migration/.vscode/settings.json`에 Biome을 기본 포매터로 설정
- [x] T025 전체 빌드 및 실행 최종 검증 — `bun run lint:check && bunx tsc --noEmit && bun run tauri build` 성공, `bun run tauri dev` 실행 후 10초 이내 창 표시 확인 (SC-001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion — can run in parallel with Phase 3
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion — can run in parallel with Phase 3, 4
- **Polish (Phase 6)**: Depends on all user stories being complete

### Within Each Phase

- Phase 1: T002, T003, T004 are parallel (different files)
- Phase 2: T007, T008, T009, T010 are parallel (different directories)
- Phase 3: Sequential (T014 → T015 → T016 → T017)
- Phase 4: T018 → T019 (verify then fix)
- Phase 5: T020, T021, T022 are parallel (different files)
- Phase 6: T023, T024 are parallel

---

## Parallel Example: Phase 2

```bash
# Launch all FSD folder creation tasks together:
Task: "FSD entities 폴더 생성 (T007)"
Task: "FSD features 폴더 생성 (T008)"
Task: "FSD pages 폴더 생성 (T009)"
Task: "FSD widgets 폴더 생성 (T010)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (앱 실행 + 품질 게이트 통과)
4. **STOP and VALIDATE**: `bun run tauri dev`로 창 표시, lint/typecheck/build 통과

### Incremental Delivery

1. Setup + Foundational → 기반 준비 완료
2. User Story 1 → 앱 실행 확인 (MVP)
3. User Story 2 → FSD 구조 검증
4. User Story 3 → 디자인 토큰 정합성 검증
5. Polish → 최종 정리

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 각 Phase checkpoint에서 독립적으로 검증 가능
- 빈 폴더는 `.gitkeep`으로 Git 추적
- 레거시 코드(`src/`)는 수정하지 않음 (헌법 원칙 1)
- tsconfig.node.json, index.html, public/ 등은 create-tauri-app이 자동 생성하므로 별도 태스크 불필요
