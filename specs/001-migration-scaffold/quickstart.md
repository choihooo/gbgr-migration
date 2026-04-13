# Quickstart: Migration 폴더 기본 구조 구성

**Feature**: 001-migration-scaffold
**Date**: 2026-04-13

---

## 사전 요구

- Bun >= 1.2 설치
- Node.js >= 20 설치
- Rust >= 1.77 설치 (`rustup` 권장)
- macOS: Xcode Command Line Tools
- Windows: Visual Studio C++ Build Tools

## 1단계: Tauri 프로젝트 생성

```bash
cd /home/choiho/coding/FE-migration

# create-tauri-app 실행
bunx create-tauri-app

# 프롬프트 선택:
# Project name: gbgr-app
# Identifier: com.gbgr.app
# Frontend language: TypeScript / JavaScript
# Package manager: Bun
# UI template: React
# UI flavor: TypeScript
```

> 생성된 폴더 `gbgr-app/`의 내용물을 `migration/`으로 이동

## 2단계: Tailwind CSS v4 설정

```bash
cd migration
bun add -D tailwindcss @tailwindcss/vite
```

`vite.config.ts`에 Tailwind 플러그인 추가.

## 3단계: Biome 설정

```bash
bun add -D -E @biomejs/biome
bunx --bun @biomejs/biome init
```

레거시 `biome.json` 참고하여 규칙 동일하게 적용.

## 4단계: FSD 폴더 구조 생성

```bash
# src/ 하위에 FSD 레이어 생성
cd src
mkdir -p app/{layouts,providers}
mkdir -p pages/{login-page,signup-page,email-verification-page,email-verification-callback-page,resend-verification-page,main-page,calibration-page,onboarding-page,onboarding-init-page,onboarding-completion-page,widget-page}
mkdir -p widgets/{camera,widget}
mkdir -p features/{auth,calibration,dashboard,notification,onboarding}
mkdir -p entities/{posture,session,dashboard,user}
mkdir -p shared/{api,config,hooks,lib,styles,types,ui}
```

각 빈 폴더에 `.gitkeep` 추가.

## 5단계: 디자인 토큰 이관

레거시 `src/renderer/src/shared/styles/`에서 추출:
- `colors.css` → `src/shared/styles/colors.css`
- `typography.css` → `src/shared/styles/typography.css`
- `breakpoint.css` → `src/shared/styles/breakpoint.css`

## 6단계: 상태 관리 의존성 설치

```bash
bun add zustand @tanstack/react-query
```

## 7단계: 검증

```bash
# 린트
bun run lint:check

# 타입체크
bunx tsc --noEmit

# 빌드
bun run tauri build

# 개발 서버 실행
bun run tauri dev
```

## 실행 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `bun run tauri dev` | 개발 서버 실행 |
| `bun run lint` | 린트 + 자동 수정 |
| `bun run lint:check` | 린트 검사만 |
| `bunx tsc --noEmit` | 타입체크 |
| `bun run tauri build` | 프로덕션 빌드 |
