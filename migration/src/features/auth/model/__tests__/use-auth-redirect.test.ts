import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'

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

import { getPostAuthRedirectPath } from '../../model/use-auth-redirect'

vi.stubGlobal('localStorage', localStorageMock)

describe('getPostAuthRedirectPath - 보정 상태 라우팅', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('보정 상태 initial_required 시 /onboarding/init으로 이동', () => {
    localStorageMock.setItem(AUTH_STORAGE_KEYS.userId, 'user123')
    localStorageMock.setItem('calibration_gate_v1:user123', 'initial_required')
    expect(getPostAuthRedirectPath(null)).toBe('/onboarding/init')
  })

  it('보정 상태 reset_requested 시 /onboarding/calibration으로 이동', () => {
    localStorageMock.setItem(AUTH_STORAGE_KEYS.userId, 'user123')
    localStorageMock.setItem('calibration_gate_v1:user123', 'reset_requested')
    expect(getPostAuthRedirectPath(null)).toBe('/onboarding/calibration')
  })

  it('보정 상태 locked 시 /main으로 이동', () => {
    localStorageMock.setItem(AUTH_STORAGE_KEYS.userId, 'user123')
    localStorageMock.setItem('calibration_gate_v1:user123', 'locked')
    expect(getPostAuthRedirectPath(null)).toBe('/main')
  })

  it('redirectPath가 있고 auth 경로가 아니면 redirectPath 사용', () => {
    localStorageMock.setItem('calibration_gate_v1', 'locked')
    expect(getPostAuthRedirectPath('/settings')).toBe('/settings')
  })

  it('redirectPath가 /auth로 시작하면 보정 상태 분기 적용', () => {
    localStorageMock.setItem(AUTH_STORAGE_KEYS.userId, 'user123')
    localStorageMock.setItem('calibration_gate_v1:user123', 'initial_required')
    expect(getPostAuthRedirectPath('/auth/login')).toBe('/onboarding/init')
  })

  it('redirectPath가 /widget이면 보정 상태 분기 적용', () => {
    localStorageMock.setItem(AUTH_STORAGE_KEYS.userId, 'user123')
    localStorageMock.setItem('calibration_gate_v1:user123', 'initial_required')
    expect(getPostAuthRedirectPath('/widget')).toBe('/onboarding/init')
  })
})
