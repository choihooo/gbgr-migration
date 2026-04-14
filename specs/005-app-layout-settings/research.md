# Research: 005-app-layout-settings

**Created**: 2026-04-14
**Status**: Complete

## R-001: 테마 시스템 아키텍처

**Decision**: Zustand persist + CSS 클래스 토글 방식. `entities/theme/`에 독립 엔티티로 관리하고, `ThemeProvider`에서 `<html>` 요소의 `dark` 클래스를 토글.

**Rationale**:
- 레거시는 `useThemePreference` 커스텀 훅 + localStorage로 테마 상태 관리
- 레거시는 `<html>` 요소의 `dark` 클래스 토글로 다크 모드 전환 (Tailwind dark: 접두사 활용)
- Zustand persist를 사용하면 스토어와 영속화가 통합되어 관리 용이
- 시스템 테마 감지는 `window.matchMedia('(prefers-color-scheme: dark)')`로 처리 (Electron API 불필요)

**Alternatives considered**:
- React Context: 상태 변경 시 불필요한 리렌더링 발생 가능
- Tailwind CSS v4 내장 dark mode: 커스텀 토글 UI와 연동하려면 별도 상태 관리 필요

## R-002: ThemeToggleSwitch 컴포넌트 포팅 전략

**Decision**: 레거시의 ThemeToggleSwitch(태양/달 아이콘 포함)를 `shared/ui/theme-toggle-switch/`에 새로 구현. 004의 ToggleSwitch를 직접 사용하지 않고 독립 컴포넌트로 작성.

**Rationale**:
- 레거시 ThemeToggleSwitch는 일반 ToggleSwitch와 완전히 다른 UI (태양/달 아이콘, 고정 크기, 별도 애니메이션)
- 004의 ToggleSwitch는 슬라이딩 인디케이터 + 레이블 구조로 ThemeToggleSwitch와 UX가 다름
- 레거시의 sun/moon SVG 아이콘을 그대로 포팅해야 함
- 독립 컴포넌트로 작성하면 레거시와의 UI 충실도 보장

**Alternatives considered**:
- 004 ToggleSwitch 재사용: UI가 다르므로 강제 재사용은 레거시 충실도 위반
- NotificationToggleSwitch 재사용: 크기와 스타일이 다름

## R-003: 레이아웃 전환 전략 (인증 전/후)

**Decision**: RootLayout에서 인증 상태에 따라 조건부로 Header를 렌더링. 인증 전에는 헤더 없이, 인증 후에는 고정 헤더 + 상단 패딩.

**Rationale**:
- 레거시 Layout은 항상 Header를 렌더링하지만, 실제로는 인증 완료 후에만 의미 있음
- 레거시의 인증 페이지(login, signup)는 별도 라우트 구조에서 헤더 없이 렌더링됨
- 현재 migration의 라우팅 구조: `/auth/*`(공개) vs `/main`(보호)
- ProtectedRoute 내에서만 Header가 있는 레이아웃 적용이 자연스러움

**Alternatives considered**:
- 항상 Header 렌더링: 인증 페이지에서 불필요한 헤더 표시
- 별도 AuthLayout 생성: 현재 RootLayout 구조와 충돌

## R-004: 대시보드 탭 네비게이션 구현 방식

**Decision**: React Router의 URL 기반 라우팅이 아닌, 상태 기반 탭 전환. 탭 클릭 시 상태만 변경하고 실제 라우팅은 하지 않음. 단, '오류 제보'와 '후기 등록'은 외부 링크로 처리.

**Rationale**:
- 레거시 MainHeader의 탭은 실제로 URL 변경 없이 상태만 관리
- '대시보드'와 '설정' 탭은 동일 `/main` 경로 내에서 다른 패널을 보여줌
- '오류 제보'와 '후기 등록'은 외부 링크(구글 폼)로 연결
- 현재 리포트/리뷰 탭은 빈 페이지이므로 placeholder로 처리

**Alternatives considered**:
- URL 기반 라우팅 (/main/dashboard, /main/settings): 레거시와 불일치
- 중첩 라우팅: 오버엔지니어링, 현재 요구사항에 과함

## R-005: Tauri Autostart 플러그인 도입

**Decision**: `tauri-plugin-autostart` (Cargo: `tauri-plugin-autostart`, npm: `@tauri-apps/plugin-autostart`)를 도입하여 OS 시작 시 자동 실행 기능 구현.

**Rationale**:
- 레거시는 `window.electronAPI.startup.set(bool)`로 OS 자동 시작 관리
- Tauri 동등 기능: `tauri-plugin-autostart`가 Windows(레지스트리), macOS(LaunchAgent), Linux(.desktop) 모두 지원
- 설정 모달의 NotificationToggleSwitch UI를 그대로 재사용하여 on/off 토글 제공

**Alternatives considered**:
- 직접 Rust 명령어 구현: 플랫폼별 복잡도 높음, 유지보수 부담
- 자동 시작 기능 제외: 레거시 기능 누락, 헌법 위반

## R-006: 알림 설정 상태 관리

**Decision**: Zustand persist + sessionStorage 조합으로 알림 설정 관리. 레거시와 동일하게 sessionStorage 사용.

**Rationale**:
- 레거시 `useNotificationStore`는 `sessionStorage`에 `notification-settings-storage` 키로 저장
- 세션 단위 저장이므로 앱 종료 시 초기화되는 것이 의도된 동작
- Zustand persist의 `createJSONStorage(() => sessionStorage)`로 동일 패턴 구현

**Alternatives considered**:
- localStorage 사용: 레거시와 다른 영속화 동작
- TanStack Query 사용: 서버 상태가 아닌 클라이언트 설정이므로 부적합

## R-007: 시간 편집 컴포넌트(TimeControlSection) 포팅

**Decision**: 레거시의 TimeControlSection을 그대로 포팅. +/- 버튼, 인라인 편집, 1-300분 범위 검증 유지.

**Rationale**:
- 레거시 TimeControlSection은 복잡한 인터랙션(클릭 편집 모드 전환, 범위 클램핑)을 포함
- UI 충실도 보존을 위해 동일 로직 포팅
- 복잡한 인터랙션이므로 단위 테스트 포함 (헌법 5원칙)

**Alternatives considered**:
- 단순 input으로 대체: 레거시 UX와 불일치
- 외부 라이브러리 사용: 의존성 추가, 레거시와 불일치

## R-008: Header vs DashboardHeader 분리

**Decision**: 두 개의 헤더 컴포넌트로 분리. `Header`(공통: 로고 + 테마 토글)와 `DashboardHeader`(대시보드 전용: 로고 + 탭 네비게이션 + 테마 토글 + 알림 버튼).

**Rationale**:
- 레거시도 Header(공통)와 MainHeader(대시보드) 두 컴포넌트로 분리되어 있음
- Header는 인증 후 모든 페이지에서, DashboardHeader는 `/main` 라우트에서만 사용
- 역할 분리로 각 컴포넌트의 복잡도 관리

**Alternatives considered**:
- 단일 Header에 조건부 렌더링: 컴포넌트 복잡도 증가, 레거시 구조와 불일치

## R-009: 로고 에셋 처리

**Decision**: 004에서 이미 구현된 `brand-icons.tsx`의 `BrandLogo`, `BrandSymbol` SVG 인라인 컴포넌트를 그대로 사용. 추가 에셋 복사 불필요.

**Rationale**:
- `migration/src/shared/ui/icons/brand-icons.tsx`에 이미 BrandLogo(184x44 viewBox), BrandSymbol(30x30 viewBox)이 존재
- 레거시의 logo.svg, symbol.svg와 동일한 SVG 경로를 인라인으로 포함
- SVGR 플러그인 없이 인라인 SVG 패턴은 이미 프로젝트 표준

**Alternatives considered**:
- 별도 SVG 파일 복사: 기존 인라인 패턴과 불일치
- SVGR 플러그인 추가: 빌드 설정 변경, 기존 패턴과 불일치
