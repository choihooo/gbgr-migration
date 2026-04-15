# Implementation Plan: TrendPanel 이관

**Branch**: `009-trend-panel-migration` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-trend-panel-migration/spec.md`

## Summary

레거시 Electron 대시보드의 `TrendPanel`을 `migration` Tauri + React 앱으로 동일하게 포팅한다.
이번 범위는 데이터 연결이나 동작 추가 없이, 패널 카드 외형과 내부 요소(제목, 필터 버튼, 차트 영역)를 레거시와 같은 형태로 재현하는 것이다.
구현은 기존 `features/main-panels/ui` 구조를 따르며, 레거시 실제 사용처 확인 결과를 바탕으로 컴포넌트 단독 포팅과 시각 검증 산출물 확보를 우선한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임)
**Primary Dependencies**: React Router DOM 7.14, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0
**Storage**: N/A (정적 UI 패널, 신규 저장 없음)
**Testing**: Vitest 4.1.4, React Testing Library 16.3.2, 수동 시각 비교 검증
**Target Platform**: Windows/macOS/Linux 데스크톱 (Tauri 2)
**Project Type**: 데스크톱 앱 프론트엔드 UI 패널 이관
**Performance Goals**: 정적 패널이므로 별도 성능 기준을 두지 않는다. 메인 레이아웃의 스크롤/리플로우에 추가 부담을 주지 않는 것을 기본 전제로 한다.
**Constraints**: UI 스타일 변경 금지, 레거시 클래스 의미 유지, 별도 데이터 연결 금지, 레거시 `src/` 직접 수정 금지
**Scale/Scope**: 단일 패널 1개, 신규 UI 컴포넌트 1개, 필요 시 대시보드 배치 연결 1개, 시각 비교 산출물 1건

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 1. 레거시 존중 ✅ PASS
- 레거시 기준 소스는 `src/renderer/src/features/dashboard/ui/TrendPanel.tsx`로 고정한다.
- `src/`는 읽기 전용으로 분석만 수행하고, 수정은 계획 범위에 포함하지 않는다.
- 구현 및 검증 문서에서 원본 파일 경로를 명시해 정합성을 추적한다.

### 2. UI 충실도 보존 ✅ PASS
- 카드 외곽선, 흰 배경, 둥근 모서리, 내부 여백, 제목, 필터 버튼, 차트 영역을 동일하게 유지한다.
- 새로운 장식, 문구, 애니메이션, 인터랙션을 추가하지 않는다.
- before/after 캡처 또는 동일 화면 비교를 산출물로 남긴다.

### 3. Tauri 아키텍처 준수 ✅ PASS
- 이번 기능은 정적 UI 패널 이관이므로 Tauri 명령어, 시스템 API, OS 부작용이 없다.
- 프론트엔드에서만 처리 가능한 범위로 유지하며 Electron IPC를 모방하지 않는다.
- Python 자세 분석 전환과 무관한 단독 UI 패널로 유지한다.

### 4. 점진적 마이그레이션 ✅ PASS
- 대시보드 패널 분석 문서 기준 Tier 1 무의존성 패널부터 개별 이관한다.
- 기존 `migration/src/features/main-panels/ui` 패턴 안에서 최소 범위로 추가한다.
- 후속 패널이 참조할 수 있는 "레거시 동일 복제" 기준 사례를 확장한다.

### 5. 품질 게이트 강제 ✅ PASS
- 정적 마크업 이관이므로 자동 테스트는 최소 수준으로 제한하고, 핵심 검증은 시각 비교로 수행한다.
- lint, typecheck, build에 영향이 없는 구조로 설계한다.
- 필요 시 패널 존재와 구조만 검증하는 경량 테스트를 추가할 수 있다.

**초기 게이트 결과**: ✅ ALL PASS — Phase 0 진행 가능

## Project Structure

### Documentation (this feature)

```text
specs/009-trend-panel-migration/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── trend-panel-ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
migration/src/
├── features/
│   ├── main-panels/
│   │   ├── ui/
│   │   │   ├── CharacterPanel.tsx          # 기존 (008)
│   │   │   └── TrendPanel.tsx              # 신규 정적 패널 컴포넌트
│   │   └── model/
│   │       └── types.ts                    # 기존 PanelBaseProps 재사용
│   └── dashboard/
│       └── ui/
│           ├── LeftPanelArea.tsx           # 필요 시 패널 배치 연결 검토
│           └── MainContent.tsx             # 레이아웃 기준 비교용 참고
├── shared/
│   └── styles/
│       ├── colors.css                      # 기존 색상 토큰 재사용
│       └── typography.css                  # 기존 타이포그래피 재사용
└── pages/
    └── dashboard-page/
        └── index.tsx                       # 수동 검증 진입점 참고

src/renderer/src/
└── features/
    └── dashboard/
        └── ui/
            └── TrendPanel.tsx              # 레거시 기준 구현
```

**Structure Decision**: 기존 마이그레이션 앱의 FSD 구조를 유지한다. TrendPanel은 데이터 의존성이 없는 정적 패널이므로 `migration/src/features/main-panels/ui/`에 단일 컴포넌트로 추가하고, 공통 타입과 스타일 토큰은 기존 모듈을 재사용한다. 대시보드 실제 배치 연결은 레거시 사용처 확인 결과를 기준으로 최소 범위에서만 수행한다.

## Complexity Tracking

이번 기능은 헌장 위반 없이 단일 정적 패널을 이관하는 범위이므로 별도 복잡도 예외는 없다.
