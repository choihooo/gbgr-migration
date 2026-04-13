# Implementation Plan: Migration 폴더 기본 구조 구성

**Branch**: `001-migration-scaffold` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-migration-scaffold/spec.md`

## Summary

`migration/` 폴더에 Tauri 2 + React + TypeScript 프로젝트를 초기화하고,
레거시 Electron 앱의 FSD 레이어 구조와 디자인 토큰을 반영하여
이후 기능 마이그레이션의 기반을 구축한다.

## Technical Context

**Language/Version**: TypeScript 5.x, Rust (latest stable via rustup)
**Primary Dependencies**: Tauri 2, React 19, Vite 6, Tailwind CSS v4, Biome
**Storage**: N/A (이 스펙은 구조 설정만 다룸)
**Testing**: N/A (이 스펙은 빌드/실행 검증만 수행)
**Target Platform**: macOS 10.15+, Windows 10+
**Project Type**: Desktop app (Tauri 2)
**Performance Goals**: `bun run tauri dev` 10초 이내 창 표시
**Constraints**: Bun(패키지 매니저) + Node.js(런타임), UI 스타일 변경 금지
**Scale/Scope**: 단일 개발자, 마이그레이션 기반 구조

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 비고 |
|------|------|------|
| 1. 레거시 존중 | PASS | `src/` 수정 없음, FSD 구조만 참조 |
| 2. UI 충실도 보존 | PASS | 디자인 토큰을 레거시에서 추출하여 동일 값 이관 |
| 3. Tauri 아키텍처 준수 | PASS | Tauri 2 표준 구조 사용, Electron IPC 모방 없음 |
| 4. 점진적 마이그레이션 | PASS | 이 스펙은 구조만 구성, 기능 포팅은 이후 |
| 5. 품질 게이트 강제 | PASS | lint, typecheck, build 필수 검증 |

## Project Structure

### Documentation (this feature)

```text
specs/001-migration-scaffold/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (migration directory)

```text
migration/
├── src/                              # React 프론트엔드 (FSD 구조)
│   ├── main.tsx                      # 엔트리 포인트
│   ├── App.tsx                       # 루트 컴포넌트
│   ├── app/                          # FSD: app 레이어
│   │   ├── layouts/
│   │   └── providers/
│   ├── pages/                        # FSD: pages 레이어
│   │   ├── login-page/
│   │   ├── signup-page/
│   │   ├── email-verification-page/
│   │   ├── email-verification-callback-page/
│   │   ├── resend-verification-page/
│   │   ├── main-page/
│   │   ├── calibration-page/
│   │   ├── onboarding-page/
│   │   ├── onboarding-init-page/
│   │   ├── onboarding-completion-page/
│   │   └── widget-page/
│   ├── widgets/                      # FSD: widgets 레이어
│   │   ├── camera/
│   │   └── widget/
│   ├── features/                     # FSD: features 레이어
│   │   ├── auth/
│   │   ├── calibration/
│   │   ├── dashboard/
│   │   ├── notification/
│   │   └── onboarding/
│   ├── entities/                     # FSD: entities 레이어
│   │   ├── posture/
│   │   ├── session/
│   │   ├── dashboard/
│   │   └── user/
│   ├── shared/                       # FSD: shared 레이어
│   │   ├── api/
│   │   ├── config/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── styles/
│   │   │   ├── colors.css            # 레거시 디자인 토큰
│   │   │   ├── typography.css        # 레거시 타이포그래피
│   │   │   └── breakpoint.css        # 레거시 브레이크포인트
│   │   ├── types/
│   │   └── ui/
│   └── style.css                     # Tailwind CSS 진입점
├── src-tauri/                        # Tauri 백엔드 (Rust)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── capabilities/
│   │   └── default.json
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   └── icons/
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── biome.json
```

**Structure Decision**: Tauri 2 표준 구조를 기반으로
프론트엔드 `src/`를 FSD 레이어로 재구성.
레거시 `src/renderer/src/`의 FSD 구조를 1:1로 반영.

## Complexity Tracking

> 위반 없음. 모든 헌법 원칙 통과.
