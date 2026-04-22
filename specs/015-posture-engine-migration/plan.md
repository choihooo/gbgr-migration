# Implementation Plan: 자세 측정 엔진 분리 이관

**Branch**: `015-posture-engine-migration` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-posture-engine-migration/spec.md`

## Summary

레거시 Electron 렌더러 중심 자세 측정 흐름을 migration Tauri 앱의 분리된 자세 측정 엔진 구조로 전환한다. 핵심은 메인 화면과 보정 화면의 기존 UI 스타일은 그대로 유지하면서, 화면 표시 중에는 React가 카메라 미리보기·오버레이·foreground 프레임 공급을 담당하고 백그라운드에서는 Rust가 Python sidecar를 통해 측정을 유지하도록 경계를 재설계하는 것이다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1, Rust 2021(Tauri 런타임), Python 3.11 sidecar  
**Primary Dependencies**: React Router DOM 7.14, Zustand 5, TanStack Query 5, `@tauri-apps/api` 2.x, `react-webcam` 7.2.0, Tauri 2 플러그인, Python MediaPipe 기반 자세 추론 런타임  
**Storage**: 브라우저 `localStorage` 기반 클라이언트 저장소, 기존 세션/인증 API, Rust 측 최신 자세 상태 캐시  
**Testing**: `bun x tsc --noEmit`, `bun x biome check`, `cargo check`, 필요 시 수동 모드 전환/카메라 점유/레거시 비교 검증  
**Target Platform**: Tauri 2 기반 데스크톱 앱 (macOS/Windows 우선, 개발 환경은 Linux 포함)  
**Project Type**: Tauri + React + Rust + Python sidecar 데스크톱 앱 기능 설계  
**Performance Goals**: 화면 진입 후 2초 이내 첫 자세 피드백 표시, 최소화/복귀 후 2초 이내 최신 상태 복원, 포그라운드 샘플링 시 사용자 체감 기준 10~15fps 수준 유지  
**Constraints**: 레거시 UI 스타일 절대 변경 금지, `src/` 레거시 직접 수정 금지, 카메라 동시 점유 금지, Tauri 명령 입력 검증 필수, Python 전환은 별도 기능 범위 안에서만 수행, 구현 시작 전 auth/common UI/dashboard/onboarding 안정화 여부를 먼저 확인  
**Scale/Scope**: `migration`의 메인 화면/보정 화면/위젯 연계, `src-tauri` 브리지 계층, Python sidecar 계약, 문서 산출물 4종 + 계약 문서 1종

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 사전 체크 (Phase 0 이전)

| 원칙 | 상태 | 근거 |
|------|------|------|
| #1 레거시 존중 | ✅ PASS | `src/renderer/src/features/dashboard/ui/WebcamPanel.tsx`, `src/renderer/src/pages/calibration-page/index.tsx`, `src/renderer/src/entities/posture/lib/*`를 읽기 전용 기준으로 삼고 로직 의미만 이관한다. |
| #2 UI 충실도 보존 | ✅ PASS | 메인 화면 우측 `WebcamPanel`, 보정 화면 `WebcamView`와 가이드 오버레이의 기존 스타일을 유지하는 것이 명시 요구사항이다. |
| #3 Tauri 아키텍처 준수 | ✅ PASS | Python 전환을 별도 기능 스펙으로 분리한 상태에서 진행하며, 프론트엔드는 Tauri 명령/이벤트만 사용하고 시스템 부작용과 sidecar 수명 관리는 Rust에 둔다. 구현 시작 전 auth/common UI/dashboard/onboarding 안정화 확인 게이트를 통과해야 한다. |
| #4 점진적 마이그레이션 | ✅ PASS | 인증/대시보드/온보딩을 건드리지 않고 자세 측정 엔진 경계만 별도 기능 단위로 설계한다. |
| #5 품질 게이트 강제 | ✅ PASS | 타입체크, 정적 검사, Rust 체크, 모드 전환 수동 검증, 레거시 비교 검증을 계획에 포함한다. |

### 사후 체크 (Phase 1 이후)

| 원칙 | 상태 | 근거 |
|------|------|------|
| #1 레거시 존중 | ✅ PASS | 데이터 모델과 계약 문서에 레거시 자세 판정 의미, 보정 규칙, 상태 키를 유지해야 할 대상을 명시했다. |
| #2 UI 충실도 보존 | ✅ PASS | 계약 문서에서 UI는 오버레이 데이터 소비자 역할만 하며 스타일 변경을 허용하지 않는다고 고정했다. |
| #3 Tauri 아키텍처 준수 | ✅ PASS | Tauri command/event 계약, Rust 상태 캐시, Python sidecar 책임을 분리해 Electron IPC 복제 없이 설계했다. |
| #4 점진적 마이그레이션 | ✅ PASS | 기존 `migration` 디렉터리 구조 안에서 `entities/posture`, `features/posture-engine`, `src-tauri` 브리지 추가로 한정했다. |
| #5 품질 게이트 강제 | ✅ PASS | Quickstart에 정적 검사와 수동 검증 절차를 모두 명시했다. |

## Project Structure

### Documentation (this feature)

```text
specs/015-posture-engine-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── posture-engine-bridge-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
└── renderer/src/
    ├── entities/posture/
    │   ├── lib/
    │   │   ├── PoseDetection.tsx
    │   │   ├── PoseVisualizer.tsx
    │   │   ├── calculations.ts
    │   │   ├── PostureClassifier.ts
    │   │   └── ScoreProcessor.ts
    │   └── model/use-posture-store.ts
    ├── features/dashboard/ui/WebcamPanel.tsx
    └── pages/calibration-page/
        ├── index.tsx
        └── components/WebcamView.tsx

migration/
└── src/
    ├── entities/
    │   ├── posture/
    │   │   ├── model/
    │   │   ├── lib/
    │   │   └── ui/
    │   ├── session/
    │   └── dashboard/
    ├── features/
    │   ├── posture-engine/
    │   │   ├── lib/
    │   │   └── model/
    │   ├── dashboard/ui/RightPanelArea.tsx
    │   └── main-panels/ui/WebcamPanel.tsx
    ├── pages/
    │   ├── calibration-page/
    │   │   ├── index.tsx
    │   │   └── components/WebcamView.tsx
    │   └── widget-page/index.tsx
    └── shared/
        ├── config/router.tsx
        └── lib/calibration-gate.ts

migration/src-tauri/
├── src/
│   ├── lib.rs
│   ├── posture_engine/
│   ├── commands/
│   └── state/
└── capabilities/

sidecar/
└── posture-engine/
    ├── main.py
    ├── engine/
    └── models/
```

**Structure Decision**: 기존 `migration` 모듈 경계를 유지하면서, 프론트엔드는 `entities/posture`와 `features/posture-engine`에 자세 측정 상태와 브리지 코드를 추가하고, Rust는 `src-tauri` 내부에 sidecar 관리와 상태 캐시를 둔다. Python 런타임은 앱 외부 일반 스크립트가 아니라 sidecar 번들 경계로 분리해 메인 화면/보정 화면/UI 위젯은 동일한 결과 계약만 소비하도록 설계한다.

## Phase 0: Research Plan

- Python sidecar와 Tauri 사이의 프로세스 경계, 생명주기, 오류 복구 전략 결정
- auth/common UI/dashboard/onboarding 안정화 확인 게이트를 구현 착수 전제 조건으로 고정
- 화면 표시 모드와 백그라운드 측정 모드 사이의 카메라 소유권 전환 규칙 확정
- React가 소비할 자세 결과, 엔진 상태, 경고 이벤트 계약 확정
- 기존 `localStorage` 세션/보정 상태와 새 엔진 상태를 어떤 책임 경계로 유지할지 결정
- 수동 검증에서 반드시 확인해야 할 레거시 동일성 포인트와 전환 시나리오 정의

## Phase 1: Design & Contracts

- 측정 세션, 측정 결과, 엔진 상태, 카메라 점유 상태의 데이터 모델을 정의
- Tauri command/event 기반 브리지 계약을 문서화하고 입력/출력/오류 규칙을 고정
- 메인 화면, 보정 화면, 위젯이 같은 결과 계약을 소비하도록 UI 연계 포인트를 정리
- 백그라운드 측정 결과를 알림 판단과 세션 기록에 연결하는 경로를 설계에 포함
- Quickstart에 타입체크, Rust 체크, sidecar 연결 검증, 최소화/복귀 검증 절차를 남김

## Post-Design Constitution Check

- `레거시 존중`: 유지. 포팅 대상 원본 파일과 재사용해야 할 알고리즘 의미를 문서에 연결했다.
- `UI 충실도 보존`: 유지. UI는 새 엔진 데이터를 소비해도 기존 레이아웃과 스타일을 바꾸지 않는다고 명시했다.
- `Tauri 아키텍처 준수`: 유지. 시스템 접근과 sidecar 제어는 Rust, 화면 렌더링은 React, 추론은 Python으로 책임을 분리했다.
- `점진적 마이그레이션`: 유지. 기존 인증/대시보드 흐름을 깨지 않는 범위의 기능 단위 설계다.
- `품질 게이트 강제`: 유지. 정적 검사와 수동 회귀 검증 절차가 설계 산출물에 포함되었다.

## Complexity Tracking

해당 없음. 헌법 위반이나 예외 승인이 필요한 항목이 없다.
