import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import {
  lockCalibrationGate,
  markCalibrationInitialRequired,
  requestCalibrationReset,
} from '@/shared/lib/calibration-gate'
import { CalibrationRouteGuard } from '../calibration-route-guard'

function renderGuard(route = '/onboarding/init') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<CalibrationRouteGuard />}>
          <Route path="/onboarding/init" element={<div>보정 시작 화면</div>} />
          <Route
            path="/onboarding/calibration"
            element={<div>보정 측정 화면</div>}
          />
          <Route
            path="/onboarding/completion"
            element={<div>보정 완료 화면</div>}
          />
        </Route>
        <Route path="/main" element={<div>메인 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CalibrationRouteGuard', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(AUTH_STORAGE_KEYS.userId, 'user-1')
  })

  it('초기 보정이 필요한 사용자는 온보딩 보정 라우트에 접근할 수 있다', () => {
    markCalibrationInitialRequired('user-1')

    renderGuard()

    expect(screen.getByText('보정 시작 화면')).toBeInTheDocument()
  })

  it('보정 재설정이 요청된 사용자는 보정 측정 라우트에 접근할 수 있다', () => {
    requestCalibrationReset('user-1')

    renderGuard('/onboarding/calibration')

    expect(screen.getByText('보정 측정 화면')).toBeInTheDocument()
  })

  it('보정을 완료한 사용자가 온보딩 보정 라우트에 접근하면 메인으로 이동한다', () => {
    lockCalibrationGate('user-1')

    renderGuard()

    expect(screen.getByText('메인 화면')).toBeInTheDocument()
  })

  it('보정을 완료한 사용자는 완료 화면에 접근할 수 있다', () => {
    lockCalibrationGate('user-1')

    renderGuard('/onboarding/completion')

    expect(screen.getByText('보정 완료 화면')).toBeInTheDocument()
  })
})
