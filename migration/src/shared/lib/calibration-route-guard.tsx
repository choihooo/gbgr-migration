import { Navigate, Outlet } from 'react-router-dom'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import { canAccessCalibrationFlow } from '@/shared/lib/calibration-gate'

/**
 * 보정 라우트 가드 컴포넌트
 *
 * 보정 관련 라우트(/onboarding/*)에 대한 접근을 제어한다.
 * 보정이 완료된(locked) 사용자가 보정 라우트에 직접 접근하면 /main으로 리다이렉트한다.
 *
 * 포팅 원본: src/renderer/src/shared/lib/calibration-gate.ts (canAccessCalibrationFlow 활용)
 */
export function CalibrationRouteGuard() {
  const userId = localStorage.getItem(AUTH_STORAGE_KEYS.userId)
  // TODO: 보정 게이트 복원 (007 구현 완료 후)
  const _canAccess = canAccessCalibrationFlow(userId)

  if (!_canAccess) {
    return <Navigate to="/main" replace />
  }

  return <Outlet />
}
