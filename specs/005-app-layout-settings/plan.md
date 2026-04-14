# Implementation Plan: 앱 레이아웃 및 설정 시스템

**Branch**: `005-app-layout-settings` | **Date**: 2026-04-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-app-layout-settings/spec.md`

## Summary

레거시 앱의 레이아웃 셸(Header + Outlet), 대시보드 헤더(알약 탭 네비게이션), 설정 모달, 알림 설정 모달, 테마 전환 시스템을 마이그레이션. 004에서 구현한 Modal, ToggleSwitch, NotificationToggleSwitch 컴포넌트를 재사용하고, Tauri 네이티브 API로 Electron IPC를 대체한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임)
**Primary Dependencies**: React Router DOM 7, Zustand 5, TanStack Query 5, Tailwind CSS 4.2.2, clsx + tailwind-merge
**Storage**: Zustand persist (sessionStorage for notification settings, localStorage for theme)
**Testing**: Vitest 4.1.4 + @testing-library/react (ThemeToggleSwitch, TimeControlSection 단위 테스트)
**Target Platform**: Tauri 2.0 데스크톱 (Chrome 105 / Safari 15)
**Project Type**: Desktop app (Tauri + React webview)
**Performance Goals**: 테마 전환 100ms 이내, 탭 전환 즉시 렌더링
**Constraints**: UI 스타일 변경 금지, 레거시와 픽셀 퍼펙트
**Scale/Scope**: 단일 사용자 데스크톱 앱, 5개 주요 컴포넌트 포팅

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 사전 체크

| 원칙 | 상태 | 근거 |
|------|------|------|
| 1. 레거시 존중 | ✅ PASS | 레거시 Layout, Header, MainHeader, SettingsModal, NotificationModal을 읽기 전용으로 참조. 포팅 시 원본 파일 경로 주석 포함 |
| 2. UI 충실도 보존 | ✅ PASS | 레거시 CSS 클래스, 레이아웃 구조, 애니메이션 그대로 이관. Tailwind breakpoint(hbp:) 유지 |
| 3. Tauri 아키텍처 준수 | ✅ PASS | electronAPI.startup → tauri-plugin-autostart, electronAPI.notification → Tauri 권한 시스템 활용 |
| 4. 점진적 마이그레이션 | ✅ PASS | 003(auth), 004(shared UI) 완료 후 진행. 의존성 그래프 준수 |
| 5. 품질 게이트 강제 | ✅ PASS | typecheck + lint 통과 필수. ThemeToggleSwitch(복잡 인터랙션)은 단위 테스트 포함 |

### 사후 체크 (Phase 1 완료 후)

| 원칙 | 상태 | 근거 |
|------|------|------|
| 1. 레거시 존중 | ✅ PASS | 각 컴포넌트에 레거시 원본 경로 주석 포함 |
| 2. UI 충실도 보존 | ✅ PASS | 레거시 Tailwind 클래스 1:1 매핑 |
| 3. Tauri 아키텍처 준수 | ✅ PASS | OS 부작용(autostart, notification)은 Tauri Rust 플러그인으로 처리 |
| 4. 점진적 마이그레이션 | ✅ PASS | 독립 스토리별 구현, 각 스토리 독립 테스트 가능 |
| 5. 품질 게이트 강제 | ✅ PASS | 복잡 인터랙션 컴포넌트(ThemeToggleSwitch, TimeControlSection) 단위 테스트 포함 |

## Project Structure

### Documentation (this feature)

```text
specs/005-app-layout-settings/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
migration/src/
├── app/
│   ├── providers/
│   │   └── theme-provider.tsx           # NEW: 테마 Provider (CSS 클래스 토글)
│   └── layouts/
│       └── RootLayout.tsx               # EDIT: 인증 후 헤더 추가
├── entities/
│   └── theme/                           # NEW: 테마 상태 스토어
│       ├── index.ts
│       └── model/
│           └── use-theme-store.ts
├── features/
│   ├── layout/                          # NEW: 레이아웃 기능
│   │   ├── ui/
│   │   │   ├── Header.tsx               # 인증 전/후 공통 헤더
│   │   │   └── DashboardHeader.tsx      # 대시보드 전용 헤더 (탭 네비게이션)
│   │   └── model/
│   │       └── use-navigation-tabs.ts   # 탭 상태 관리
│   ├── settings/                        # NEW: 설정 모달
│   │   └── ui/
│   │       └── SettingsModal.tsx
│   └── notification-settings/           # NEW: 알림 설정 모달
│       ├── ui/
│       │   ├── NotificationModal.tsx
│       │   └── components/
│       │       └── TimeControlSection.tsx
│       └── model/
│           └── use-notification-store.ts
├── shared/
│   ├── ui/
│   │   ├── theme-toggle-switch/         # NEW: 테마 전용 토글 (sun/moon 아이콘)
│   │   │   └── index.tsx
│   │   ├── icons/
│   │   │   └── brand-icons.tsx          # EDIT: 이미 BrandLogo, BrandSymbol 존재
│   │   ├── modal/                       # EXISTING: 004에서 구현
│   │   └── toggle-switch/              # EXISTING: 004에서 구현
│   └── hooks/
│       └── use-modal.ts                # NEW: 모달 열기/닫기 훅
├── pages/
│   └── dashboard-page/                 # NEW: 대시보드 페이지 뼈대
│       └── index.tsx
└── assets/
    └── common/
        └── icons/                       # 로고 에셋 (이미 brand-icons에 SVG 인라인)

tests/
└── unit/
    ├── features/
    │   └── notification-settings/
    │       └── components/
    │           └── time-control-section.test.tsx
    └── shared/
        └── ui/
            └── theme-toggle-switch.test.tsx
```

**Structure Decision**: FSD 아키텍처 기존 구조를 따름. 레이아웃 관련 컴포넌트는 `features/layout/`에, 설정 모달은 `features/settings/`에, 알림 설정은 `features/notification-settings/`에 배치. 테마 상태는 `entities/theme/`에 독립 엔티티로 관리.

## Complexity Tracking

> 위반 사항 없음 — 모든 원칙 통과
