# Implementation Plan: 공통 UI 컴포넌트 시스템

**Branch**: `004-shared-ui-components` | **Date**: 2026-04-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-shared-ui-components/spec.md`

## Summary

레거시 Electron 앱(`src/`)의 7개 공통 UI 컴포넌트(Typography, LoadingSpinner, Modal, ToggleSwitch × 2, Timer, PanelHeader, NotificateMessage)를 Tauri 마이그레이션 프로젝트(`migration/`)의 `shared/ui` 레이어에 포팅. 기존 Button, TextField의 `joinClasses`를 표준 `cn` 유틸리티로 통합.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1
**Primary Dependencies**: Tailwind CSS 4.2.2, clsx + tailwind-merge (신규 추가), Vitest 4.1.4
**Storage**: N/A
**Testing**: Vitest + Testing Library (Modal, ToggleSwitch 등 복잡 컴포넌트만)
**Target Platform**: Tauri 2.0 데스크톱 앱 (Chrome 105 / Safari 15)
**Project Type**: 데스크톱 앱 UI 컴포넌트 라이브러리
**Performance Goals**: N/A (정적 UI 컴포넌트)
**Constraints**: UI 스타일 변경 금지 (레거시와 픽셀 퍼펙트)
**Scale/Scope**: 7개 신규 컴포넌트 + 2개 기존 컴포넌트 리팩터링

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 근거 |
|------|------|------|
| 1. 레거시 존중 | ✅ PASS | 레거시 컴포넌트를 읽기 전용으로 참조, 1:1 포팅 |
| 2. UI 충실도 보존 | ✅ PASS | 동일 CSS 클래스, 동일 에셋, 동일 Props API 유지 |
| 3. Tauri 아키텍처 준수 | ✅ PASS | 순수 프론트엔드 UI 컴포넌트, Tauri 명령 불필요 |
| 4. 점진적 마이그레이션 | ✅ PASS | shared/ui는 인증, 대시보드 등 도메인의 기반 레이어 |
| 5. 품질 게이트 강제 | ✅ PASS | 복잡 컴포넌트에만 단위 테스트, 시각 검증은 스크린샷 비교 |

**Re-check (Phase 1 이후)**: 모든 게이트 유지 ✅

## Project Structure

### Documentation (this feature)

```text
specs/004-shared-ui-components/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── README.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
migration/src/
├── assets/
│   └── video/
│       └── Loading.mov                  # NEW: 복사 from legacy
├── shared/
│   ├── lib/
│   │   └── cn.ts                        # NEW: clsx + tailwind-merge 유틸
│   ├── styles/
│   │   ├── colors.css                   # EXISTING: 001에서 이미 이관
│   │   ├── typography.css               # EXISTING: 001에서 이미 이관
│   │   └── breakpoint.css               # EXISTING: 001에서 이미 이관
│   └── ui/
│       ├── button/
│       │   └── index.tsx                 # MODIFY: joinClasses → cn 교체
│       ├── input-field/
│       │   └── index.tsx                 # MODIFY: joinClasses → cn 교체
│       ├── typography/
│       │   └── index.tsx                 # NEW
│       ├── loading-spinner/
│       │   └── index.tsx                 # NEW
│       ├── modal/
│       │   └── index.tsx                 # NEW (ModalPortal + 오버레이/ESC/스크롤락 통합)
│       ├── toggle-switch/
│       │   └── index.tsx                 # NEW (ToggleSwitch + NotificationToggleSwitch)
│       ├── timer/
│       │   └── index.tsx                 # NEW (SVG 카운트다운 표시)
│       ├── panel-header/
│       │   └── index.tsx                 # NEW
│       ├── notification-message/
│       │   └── index.tsx                 # NEW (CVA → Record 매핑 변환)
│       └── icons/
│           ├── status-icons.tsx          # EXISTING: SuccessIcon, ErrorIcon 유지
│           ├── brand-icons.tsx           # EXISTING
│           └── ui-icons.tsx              # NEW: InfoIcon 추가

migration/tests/
└── unit/
    └── shared/
        └── ui/
            ├── modal.test.tsx            # NEW
            └── toggle-switch.test.tsx    # NEW
```

**Structure Decision**: 기존 FSD 아키텍처의 `shared/ui/` 레이어에 컴포넌트별 디렉터리를 생성. 각 컴포넌트는 `index.tsx` 단일 파일로 구성 (레거시와 동일 패턴).

## Complexity Tracking

위반 사항 없음. 모든 헌법 원칙 통과.
