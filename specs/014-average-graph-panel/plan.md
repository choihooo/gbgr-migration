# Implementation Plan: AverageGraphPannel UI 이관

**Branch**: `[014-average-graph-panel]` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-average-graph-panel/spec.md`

## Summary

레거시 Electron 대시보드의 `AverageGraphPannel`을 migration Tauri 앱의 `AverageGraphPanel`로 동일 이관한다. 핵심은 임시 SVG 그래프를 제거하고 레거시와 같은 차트 구조, 기간 전환 규칙, 축/그리드/툴팁/스크롤 동작을 유지하면서 기존 migration 대시보드 레이아웃에 무리 없이 결합하는 것이다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1, Rust 2021(Tauri 런타임)  
**Primary Dependencies**: React Router DOM 7.14, TanStack Query 5, Recharts 3.8.1, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0  
**Storage**: N/A (조회형 UI 패널, 신규 저장 없음)  
**Testing**: `bun x tsc --noEmit`, `bun x biome check`, 필요 시 수동 UI 비교 검증  
**Target Platform**: Tauri 2 기반 데스크톱 앱 (macOS/Windows 개발 환경 대응)  
**Project Type**: 데스크톱 앱 프론트엔드 기능 이관  
**Performance Goals**: 주간/월간 전환 시 사용자가 1초 이내에 그래프 변경을 인지할 수 있어야 함  
**Constraints**: 레거시 UI 스타일 절대 변경 금지, `src/` 레거시 직접 수정 금지, 기존 dashboard 레이아웃 회귀 금지  
**Scale/Scope**: migration 대시보드 좌측 영역의 단일 패널 1개, 관련 훅 1개, 문서 산출물 4종

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- `원칙 1. 레거시 존중`: 통과. 레거시 `src/renderer/src/features/dashboard/ui/AverageGraph/AverageGraphPannel.tsx`와 훅 구현을 기준으로 읽기 전용 참조만 수행한다.
- `원칙 2. UI 충실도 보존`: 통과. 제목, 토글, 범례, 차트 종류, 축, 툴팁, 스크롤 규칙을 그대로 유지하는 것이 이번 기능의 핵심 목표다.
- `원칙 3. Tauri 아키텍처 준수`: 통과. 프론트엔드 UI 이관 범위이며 신규 Tauri 명령어나 시스템 API 직접 호출은 없다.
- `원칙 4. 점진적 마이그레이션`: 통과. 대시보드 패널 단위의 점진적 포팅이며, 기존 좌측 영역 구성 안에서 단일 패널만 변경한다.
- `원칙 5. 품질 게이트 강제`: 통과. 타입체크와 정적 검사, 레거시 대비 수동 UI 검증을 계획에 포함한다.

## Project Structure

### Documentation (this feature)

```text
specs/014-average-graph-panel/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── average-graph-panel-ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
└── renderer/src/features/dashboard/ui/
    └── AverageGraph/
        ├── AverageGraphPannel.tsx
        └── hooks/
            └── useAverageGraphChart.ts

migration/
└── src/
    ├── entities/dashboard/
    │   ├── api/dashboard-api.ts
    │   ├── model/use-dashboard-queries.ts
    │   └── types/index.ts
    ├── features/
    │   ├── dashboard/ui/LeftPanelArea.tsx
    │   └── main-panels/ui/
    │       ├── AverageGraphPanel.tsx
    │       └── AverageGraphPanel/
    │           └── hooks/
    │               └── useAverageGraphChart.ts
    └── shared/
        ├── hooks/use-theme-applied.ts
        ├── lib/get-color.ts
        └── ui/
            ├── panel-header/index.tsx
            └── toggle-switch/index.tsx
```

**Structure Decision**: 기존 migration 프론트엔드 구조를 유지한다. 화면 조립은 `features/dashboard/ui`, 패널 구현은 `features/main-panels/ui`, 조회는 `entities/dashboard`, 공용 UI/유틸은 `shared`에 둔다. 레거시 구조를 1:1 복제하지 않고, migration의 현재 모듈 경계를 유지하면서 내부 UI만 레거시 기준으로 맞춘다.

## Phase 0: Research Plan

- 레거시 `AverageGraphPannel`의 실제 시각 구조와 동작 규칙 확인
- migration의 공용 패널 헤더, 토글, 테마 색상 유틸 재사용 가능 여부 확인
- `recharts`를 이미 사용하는 기존 패널(`HighlightsPanel`)과 일관된 적용 패턴 확인
- API 응답이 비어 있거나 `0` 값을 포함할 때 레거시가 사용하는 대체 데이터 규칙 확인

## Phase 1: Design & Contracts

- `AverageGraphPanel`을 레거시와 동일한 `AreaChart` 구조로 전환
- 차트 데이터 가공 로직을 별도 훅으로 분리하여 기간 전환, 색상 계산, 축 설정, 대체 데이터 규칙을 캡슐화
- UI 계약 문서로 필수 시각 요소와 상호작용 규칙을 명시
- 빠른 검증용 quickstart 문서에 레거시 비교 절차를 남김

## Post-Design Constitution Check

- `레거시 존중`: 유지. 모든 설계 근거가 레거시 파일 경로에 연결되어 있다.
- `UI 충실도 보존`: 유지. 신규 스타일 제안 없이 레거시 구조 재현만 허용한다.
- `Tauri 아키텍처 준수`: 유지. UI 계층 내부 변경만 포함된다.
- `점진적 마이그레이션`: 유지. 단일 패널 범위 내에서 완료 가능하다.
- `품질 게이트 강제`: 유지. `bun` 기반 타입체크/정적 검사와 수동 비교 절차를 명시했다.

## Complexity Tracking

해당 없음. 헌법 위반이나 예외 승인이 필요한 항목이 없다.
