# Implementation Plan: HighlightsPanel 마이그레이션

**Branch**: `012-highlights-panel-migration` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-highlights-panel-migration/spec.md`

## Summary

레거시 HighlightsPanel(Recharts BarChart + 주간/월간 토글)을 마이그레이션 프로젝트로 이관한다. 기존 플레이스홀더(div 기반 가짜 차트)를 Recharts 기반 실제 구현으로 교체한다. API 훅, 타입, 공유 컴포넌트는 이미 마이그레이션 프로젝트에 존재하므로 재사용한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1
**Primary Dependencies**: Recharts (신규 추가), TanStack Query 5, Zustand 5
**Storage**: N/A
**Testing**: 레거시와 시각적 비교 (수동 검증)
**Target Platform**: Tauri 2 데스크톱 앱 (Windows)
**Project Type**: Desktop app (Tauri + React)
**Performance Goals**: 패널 렌더링 1초 이내, 테마 전환 1초 이내
**Constraints**: UI 스타일 레거시와 완전 동일
**Scale/Scope**: 단일 패널 컴포넌트 + 2개 유틸리티 + 1개 훅

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 사전 체크 (Phase 0 이전)

| 원칙 | 상태 | 근거 |
|------|------|------|
| #1 레거시 존중 | ✅ PASS | src/ 코드 읽기 전용, 로직 그대로 포팅 |
| #2 UI 충실도 보존 | ✅ PASS | 동일 Recharts 컴포넌트, 동일 CSS 변수, 동일 레이아웃 |
| #3 Tauri 아키텍처 준수 | ✅ PASS | 프론트엔드 전용 변경, Tauri 명령어 불필요 |
| #4 점진적 마이그레이션 | ✅ PASS | 단일 패널 단위 포팅, 기존 API 훅 재사용 |
| #5 품질 게이트 강제 | ✅ PASS | typecheck/lint 통과 필수, 정적 UI 패널이므로 단위 테스트 불필요 |

### 사후 체크 (Phase 1 이후)

| 원칙 | 상태 | 근거 |
|------|------|------|
| #1 레거시 존중 | ✅ PASS | 레거시 코드 구조(컴포넌트 + data.ts + hooks/) 그대로 반영 |
| #2 UI 충실도 보존 | ✅ PASS | 동일 BarChart 구조, 동일 색상 변수, 동일 레이블 스타일 |
| #3 Tauri 아키텍처 준수 | ✅ PASS | 시스템 접근 없음, 프론트엔드만 변경 |
| #4 점진적 마이그레이션 | ✅ PASS | 기존 entities/dashboard 훅/타입 재사용 |
| #5 품질 게이트 강제 | ✅ PASS | 정적 UI 패널, 수동 검증으로 충분 |

## Project Structure

### Documentation (this feature)

```text
specs/012-highlights-panel-migration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Data model
├── quickstart.md        # Phase 1: Quickstart guide
├── contracts/
│   └── api-contract.md  # Phase 1: API & internal contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
migration/src/
├── shared/
│   ├── lib/
│   │   ├── cn.ts                    # 기존
│   │   └── get-color.ts             # 🆕 CSS 변수 읽기 유틸리티
│   ├── hooks/
│   │   └── use-theme-applied.ts     # 🆕 테마 변경 감지 훅
│   └── ui/
│       ├── panel-header/            # 기존
│       └── toggle-switch/           # 기존
├── entities/
│   ├── dashboard/
│   │   ├── api/dashboard-api.ts     # 기존 (getHighlight)
│   │   ├── model/use-dashboard-queries.ts  # 기존 (useHighlightQuery)
│   │   └── types/index.ts           # 기존 (HighlightQueryParams 등)
│   └── theme/
│       └── model/use-theme-store.ts # 기존 (useThemeStore)
└── features/
    └── main-panels/
        ├── model/types.ts           # 기존 (Period, PanelBaseProps)
        └── ui/
            ├── HighlightsPanel.tsx   # 🔄 교체 (플레이스홀더 → Recharts)
            ├── HighlightsPanel/      # 🆕 서브디렉토리
            │   ├── data.ts           # 🆕 HighlightDatum 타입
            │   └── hooks/
            │       └── useHighlightsChart.ts  # 🆕 차트 설정 훅
            └── index.ts             # 기존 (HighlightsPanel export 유지)
```

**Structure Decision**: 기존 마이그레이션 프로젝트의 Feature-Sliced Design 구조를 따른다. 레거시의 HighlightsPanel/index.tsx → HighlightsPanel.tsx, HighlightsPanel/data.ts → HighlightsPanel/data.ts, HighlightsPanel/hooks/ → HighlightsPanel/hooks/ 패턴을 그대로 유지하되 마이그레이션 프로젝트의 파일 명명 규칙(컴포넌트는 루트에 .tsx, 서브모듈은 디렉토리)을 따른다.

## Complexity Tracking

> 위반 사항 없음 — Constitution Check 전체 PASS
