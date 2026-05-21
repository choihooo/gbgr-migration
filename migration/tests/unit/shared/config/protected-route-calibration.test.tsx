import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthSessionStore } from '@/entities/session/model/use-auth-session-store'
import { ProtectedRoute } from '@/shared/config/auth-routes'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import {
  markCalibrationInitialRequired,
  requestCalibrationReset,
} from '@/shared/lib/calibration-gate'

function renderProtectedRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/onboarding" element={<ProtectedRoute />}>
          <Route path="init" element={<div>보정 시작 화면</div>} />
          <Route path="calibration" element={<div>보정 측정 화면</div>} />
        </Route>
        <Route path="/main" element={<div>메인 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute calibration routing', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(AUTH_STORAGE_KEYS.userId, 'user-1')
    useAuthSessionStore.setState({
      status: 'authenticated',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 'user-1',
      userName: '사용자',
      redirectPath: null,
      lastErrorCode: null,
      hydratedAt: Date.now(),
    })
  })

  it('초기 보정 대상자가 이미 /onboarding/init에 있으면 자식 화면을 렌더링한다', () => {
    markCalibrationInitialRequired('user-1')

    renderProtectedRoute('/onboarding/init')

    expect(screen.getByText('보정 시작 화면')).toBeInTheDocument()
  })

  it('보정 재설정 대상자가 이미 /onboarding/calibration에 있으면 자식 화면을 렌더링한다', () => {
    requestCalibrationReset('user-1')

    renderProtectedRoute('/onboarding/calibration')

    expect(screen.getByText('보정 측정 화면')).toBeInTheDocument()
  })
})

