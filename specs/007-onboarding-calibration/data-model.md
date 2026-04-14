# Data Model: 온보딩/보정 도메인 이관

**Date**: 2026-04-14
**Branch**: `007-onboarding-calibration`

## Entities

### CalibrationGateState (localStorage)

보정 필요 여부를 판별하는 상태 값.

| Field | Type | Description |
|-------|------|-------------|
| value | `'initial_required' \| 'reset_requested' \| 'locked'` | 보정 게이트 상태 |

**Storage key**: `calibration_gate_v1:{userId}`, `calibration_gate_v1` (글로벌 폴백)
**기본값**: `'initial_required'` (키가 없으면)
**전이**:

```
[없음] → initial_required  (최초 로그인 시)
initial_required → locked  (보정 완료 시)
reset_requested → locked   (재보정 완료 시)
locked → reset_requested   (설정에서 재보정 요청 시)
```

### CalibrationResult (localStorage)

보정 측정 완료 후 저장되는 결과 데이터.

| Field | Type | Description |
|-------|------|-------------|
| mu_PI | `number` | 평균 PI값 |
| sigma_PI | `number` | 표준편차 |
| passRate | `number` | 통과율 (0~1) |
| quality | `'poor' \| 'medium' \| 'good' \| 'unknown'` | 품질 등급 |
| nPass | `number` | 통과 프레임 수 |
| nTotal | `number` | 전체 프레임 수 |
| timestamp | `number` | Unix 타임스탬프 (ms) |

**Storage key**: `calibration_result_v1`
**이번 스펙에서**: 측정 엔진 미연결이므로 저장 발생하지 않음. 타입 정의만 제공.

### CalibrationFrame (런타임 전용)

보정 측정 중 수집되는 단일 프레임 데이터. localStorage에 저장되지 않음.

| Field | Type | Description |
|-------|------|-------------|
| lms | `PoseLandmark[]` | 2D 포즈 랜드마크 |
| pi | `PIResult` | PI 계산 결과 |
| worldLms | `WorldLandmark[]` | 3D 랜드마크 |
| pi_ema | `number` | EMA 평활값 |
| brightness | `number \| undefined` | 프레임 밝기 |

**이번 스펙에서**: 타입 정의만 제공. 실제 프레임 수집은 008에서.

### OnboardingStep (런타임 전용)

온보딩 소개 슬라이드 단계 정의.

| Field | Type | Description |
|-------|------|-------------|
| id | `number` | 단계 번호 (1~5) |
| image | `string` (light) | 라이트모드 이미지 경로 |
| darkImage | `string` (dark) | 다크모드 이미지 경로 |
| title | `string` (i18n key) | 단계 제목 |
| description | `string` (i18n key) | 단계 설명 |
| progressIcon | `ReactComponent` | 진행 표시자 아이콘 |

### CalibrationQuality (열거형)

```typescript
type CalibrationQuality = 'poor' | 'medium' | 'good' | 'unknown'
```

### PoseLandmark (런타임 전용)

```typescript
interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}
```

**이번 스펙에서**: 타입 정의만 제공. 실제 랜드마크 수집은 008에서.

## Relationships

```
User (entities/user)
  ├── 1:1 → CalibrationGateState (localStorage, userId 기준)
  ├── 1:1 → CalibrationResult (localStorage, 이번엔 저장 안함)
  └── 1:N → Session (entities/session, 보정 완료 후 생성)

CalibrationGateState
  └── determines → PostLoginRoute (/main | /onboarding/init | /onboarding/calibration)
```

## Validation Rules

- CalibrationGateState: `initial_required` | `reset_requested` | `locked` 외 값은 `locked`로 간주
- CalibrationResult.quality: `poor` | `medium` | `good` | `unknown` 외 값은 `unknown`으로 처리
- localStorage 손상 시(JSON 파싱 실패): `initial_required`로 폴백
- userId가 null/undefined인 경우: 글로벌 키(`calibration_gate_v1`) 사용
