import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import {
  canAccessCalibrationFlow,
  getCalibrationGateState,
} from '@/shared/lib/calibration-gate'

/**
 * 보정 라우트 가드 컴포넌트
 *
 * 보정 관련 라우트(/onboarding/*)에 대한 접근을 제어한다.
 * 보정이 완료된(locked) 사용자가 보정 라우트에 직접 접근하면 /main으로 리다이렉트한다.
 *
 * 포팅 원본: src/renderer/src/shared/lib/calibration-gate.ts (canAccessCalibrationFlow 활용)
 */
export function CalibrationRouteGuard() {
  const location = useLocation()
  const userId = localStorage.getItem(AUTH_STORAGE_KEYS.userId)
  const gateState = getCalibrationGateState(userId)
  const canAccess = canAccessCalibrationFlow(userId)
  const isCompletionRoute = location.pathname === '/onboarding/completion'

  if (isCompletionRoute && gateState === 'locked') {
    return <Outlet />
  }

  if (!canAccess) {
    return <Navigate to="/main" replace />
  }

  return <Outlet />
}
