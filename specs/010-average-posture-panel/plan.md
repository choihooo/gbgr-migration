# Implementation Plan: AveragePosturePanel 이관

**Branch**: `010-average-posture-panel` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-average-posture-panel/spec.md`

## Summary

레거시 Electron 대시보드의 `AveragePosturePanel`을 `migration` Tauri + React 앱으로 동일하게 포팅한다.
이번 범위는 조회 기반 점수 패널의 시각 구조를 레거시와 같게 유지하는 것이며,
특히 점수 표시, 단계 판정, 단계별 이름/설명 문구, 캐릭터 이미지, 배경 그라데이션,
하단 `Step` 표기를 레거시 기준으로 맞추는 데 초점을 둔다.
현재 마이그레이션 구현에 있는 임시 도형 기반 표현은 제거하고,
레거시 원본의 시각 결과를 재현하는 방향으로 설계한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임)  
**Primary Dependencies**: React Router DOM 7.14, TanStack Query 5, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0  
**Storage**: N/A (조회형 UI 패널, 신규 저장 없음)  
**Testing**: Vitest 4.1.4, React Testing Library 16.3.2, 수동 시각 비교 검증  
**Target Platform**: Windows/macOS/Linux 데스크톱 (Tauri 2)  
**Project Type**: 데스크톱 앱 프론트엔드 UI 패널 이관  
**Performance Goals**: 메인 대시보드 초기 렌더와 스크롤 동작에 추가적인 체감 지연을 만들지 않을 것  
**Constraints**: UI 스타일 변경 금지, 레거시 단계 규칙 유지, 레거시 이미지 자산과 문구 유지, `src/` 직접 수정 금지  
**Scale/Scope**: 단일 패널 1개, 레거시 단계 정보 세트 1개, 대시보드 연결 경로 1개, 시각 비교 산출물 1건

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 1. 레거시 존중 ✅ PASS

- 기준 구현은 `src/renderer/src/features/dashboard/ui/AveragePosture/AveragePosturePanel.tsx`와 `src/renderer/src/features/dashboard/ui/AveragePosture/levelConfig.ts`로 고정한다.
- 점수 구간, 단계 이름, 기울기/하중 문구, 이미지 자산 선택 로직은 레거시와 동일하게 유지한다.
- `src/`는 읽기 전용으로 취급하고 이번 계획에서 수정하지 않는다.

### 2. UI 충실도 보존 ✅ PASS

- 카드 배경, 타이포그래피 위계, 좌우 배치, 캐릭터 이미지 비율, 하단 `Step` 배치를 그대로 유지한다.
- 현재 마이그레이션의 임시 도형 시각 요소는 제거 대상이며, 새로운 장식 요소는 추가하지 않는다.
- 구현 완료 후 레거시 대비 시각 비교 산출물을 남긴다.

### 3. Tauri 아키텍처 준수 ✅ PASS

- 이번 기능은 프론트엔드 조회 패널 이관으로, 신규 Tauri 명령어와 시스템 권한이 필요 없다.
- Electron IPC를 모방하지 않고 기존 프론트엔드 조회 패턴 안에서 처리한다.
- Python 자세 분석 브리지와 무관한 범위로 유지한다.

### 4. 점진적 마이그레이션 ✅ PASS

- `docs/dashboard-panel-migration-analysis.md` 기준 실제 메인 대시보드 패널 중 하나를 개별 이관하는 작업이다.
- 공통 조회 훅은 이미 `migration`에 존재하는 `useAverageScoreQuery`를 재사용한다.
- 패널 단위 검증 후 다음 대시보드 패널로 확장하는 방식에 부합한다.

### 5. 품질 게이트 강제 ✅ PASS

- 단일 UI 패널 이관이므로 자동 테스트는 경량 구조 검증 수준으로 제한할 수 있다.
- 핵심 검증은 레거시 대비 시각 비교다.
- 구현 후 lint, typecheck, build 영향 여부를 확인한다.

**초기 게이트 결과**: ✅ ALL PASS — Phase 0 진행 가능

## Project Structure

### Documentation (this feature)

```text
specs/010-average-posture-panel/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── average-posture-panel-ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
migration/src/
├── features/
│   ├── main-panels/
│   │   ├── model/
│   │   │   └── types.ts
│   │   └── ui/
│   │       └── AveragePosturePanel.tsx
│   └── dashboard/
│       └── ui/
│           └── LeftPanelArea.tsx
├── entities/
│   └── dashboard/
│       └── model/
│           └── use-dashboard-queries.ts
└── shared/
    └── styles/
        ├── colors.css
        └── typography.css

src/renderer/src/
└── features/
    └── dashboard/
        └── ui/
            └── AveragePosture/
                ├── AveragePosturePanel.tsx
                └── levelConfig.ts
```

**Structure Decision**: 기존 마이그레이션 앱의 FSD 구조를 유지한다. `AveragePosturePanel`은 `migration/src/features/main-panels/ui/`에 존재하는 단일 패널 컴포넌트로 유지하되, 레거시 기준 단계 정보와 시각 구조를 맞추는 방향으로 수정한다. 대시보드 배치는 이미 `LeftPanelArea.tsx`에 연결되어 있으므로, 별도 신규 진입점 없이 기존 메인 레이아웃에서 검증한다.

## Complexity Tracking

이번 기능은 헌장 위반 없이 단일 조회 패널을 정확히 이관하는 범위이므로 별도 복잡도 예외는 없다.
