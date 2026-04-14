# Route Guard Contract: 보정 상태 라우팅

**Date**: 2026-04-14

## 보정 라우트 가드

### CalibrationRouteGuard

보정 관련 라우트에 대한 접근 제어 컴포넌트.

**Input**:
- 보정 라우트 하위의 모든 페이지 (`/onboarding/*`)

**동작**:
```
canAccessCalibrationFlow(userId) === true
  → 렌더 자식 컴포넌트 (정상 진입)
canAccessCalibrationFlow(userId) === false
  → <Navigate to="/main" replace />
```

**조건**: `calibration_gate_v1:{userId}` 또는 `calibration_gate_v1` 값이
`initial_required` 또는 `reset_requested`이면 접근 허용.
`locked`이면 `/main`으로 리다이렉트.

### Post-Login Routing Contract

`use-auth-redirect.ts` 확장.

**Input**: 인증 완료 후 userId

**동작**:
```
1. redirectPath가 있고 인증 관련 경로가 아니면 → redirectPath
2. getCalibrationGateState(userId) === 'initial_required' → /onboarding/init
3. getCalibrationGateState(userId) === 'reset_requested' → /onboarding/calibration
4. 그 외 (locked) → /main
```

**우선순위**: redirectPath > 보정 상태 > 기본(/main)
