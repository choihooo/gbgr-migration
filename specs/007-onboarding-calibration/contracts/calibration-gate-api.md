# Shared Library Contract: calibration-gate.ts

**Date**: 2026-04-14

## Public API

```typescript
// 타입
type CalibrationGateState = 'initial_required' | 'reset_requested' | 'locked'

// 읽기
function getCalibrationGateState(userId: string | null | undefined): CalibrationGateState
function canAccessCalibrationFlow(userId: string | null | undefined): boolean

// 쓰기
function setCalibrationGateState(userId: string | null | undefined, state: CalibrationGateState): void
function markCalibrationInitialRequired(userId: string | null | undefined): void
function requestCalibrationReset(userId: string | null | undefined): void
function lockCalibrationGate(userId: string | null | undefined): void
function clearCalibrationGate(userId: string | null | undefined): void
```

## Storage

- 키: `calibration_gate_v1:{userId}` (사용자별) + `calibration_gate_v1` (글로벌 폴백)
- 값: `'initial_required'` | `'reset_requested'` | `'locked'`
- 기본값: 키가 없으면 `'initial_required'` (초기 보정 필요 상태)

## 사용처

| 함수 | 호출 시점 | 호출 위치 |
|------|----------|----------|
| `getCalibrationGateState` | 로그인 후 라우팅 분기 | `use-auth-redirect.ts` |
| `canAccessCalibrationFlow` | 보정 라우트 접근 체크 | `CalibrationRouteGuard` |
| `lockCalibrationGate` | 보정 완료 시 | `calibration-page` (008에서 연결) |
| `markCalibrationInitialRequired` | 회원가입 직후 | (필요 시 연결) |
| `requestCalibrationReset` | 설정에서 재보정 요청 | (후속 스펙) |
| `clearCalibrationGate` | 로그아웃 시 | (필요 시 연결) |
