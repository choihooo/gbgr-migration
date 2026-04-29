import { beforeEach, describe, expect, it, vi } from 'vitest'

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

import { getPostAuthRedirectPath } from '@/features/auth/model/use-auth-redirect'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import {
  markCalibrationInitialRequired,
  requestCalibrationReset,
} from '@/shared/lib/calibration-gate'

describe('router auth helpers', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('보호 경로가 없으면 메인으로 보낸다', () => {
    expect(getPostAuthRedirectPath(null)).toBe('/main')
  })

  it('auth 경로는 메인으로 교정한다', () => {
    expect(getPostAuthRedirectPath('/auth/login')).toBe('/main')
  })

  it('보호 경로가 있으면 그대로 복귀한다', () => {
    expect(getPostAuthRedirectPath('/onboarding/init')).toBe('/onboarding/init')
  })

  it('초기 보정이 필요한 사용자는 로그인 후 온보딩 시작으로 보낸다', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.userId, 'user123')
    markCalibrationInitialRequired('user123')

    expect(getPostAuthRedirectPath(null)).toBe('/onboarding/init')
  })

  it('보정 재설정이 필요한 사용자는 로그인 후 보정 측정으로 보낸다', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.userId, 'user123')
    requestCalibrationReset('user123')

    expect(getPostAuthRedirectPath('/auth/login')).toBe(
      '/onboarding/calibration',
    )
  })
})
