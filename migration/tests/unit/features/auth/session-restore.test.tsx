import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthSessionStore } from '@/entities/session'
import { useAuthUserStore } from '@/entities/user'
import { useAuthBootstrap } from '@/features/auth/model/use-auth-bootstrap'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import { installMockStorage } from '../../../setup/auth-test-storage'

const { mockGet, mockRefresh, mockClearStoredTokens, mockSetAnalyticsUserId } =
  vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockRefresh: vi.fn(),
    mockClearStoredTokens: vi.fn(),
    mockSetAnalyticsUserId: vi.fn(),
  }))

vi.mock('@/shared/api/instance', () => ({
  __esModule: true,
  default: {
    get: mockGet,
  },
  clearStoredTokens: mockClearStoredTokens,
  refreshAccessToken: mockRefresh,
}))

vi.mock('@/shared/lib/analytics', () => ({
  setAnalyticsUserId: mockSetAnalyticsUserId,
}))

function createWrapper() {
  const queryClient = new QueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useAuthBootstrap', () => {
  beforeEach(() => {
    installMockStorage()
    mockGet.mockReset()
    mockRefresh.mockReset()
    mockClearStoredTokens.mockReset()
    mockSetAnalyticsUserId.mockReset()
    useAuthUserStore.getState().clearUser()
    useAuthSessionStore.setState({
      status: 'checking',
      accessToken: null,
      refreshToken: null,
      userId: null,
      userName: null,
      redirectPath: null,
      lastErrorCode: null,
      hydratedAt: null,
    })
  })

  it('저장된 세션이 유효하면 인증 상태로 복구한다', async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, 'access')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, 'refresh')
    mockRefresh.mockResolvedValue(undefined)
    mockGet.mockResolvedValue({
      data: {
        success: true,
        data: {
          email: 'user@test.com',
          name: 'Tester',
        },
      },
    })

    renderHook(() => useAuthBootstrap(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(useAuthSessionStore.getState().status).toBe('authenticated')
    })
    expect(mockSetAnalyticsUserId).toHaveBeenCalledWith('user@test.com')
  })

  it('저장된 세션이 실패하면 미인증 상태로 전환한다', async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, 'access')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, 'refresh')
    mockRefresh.mockRejectedValue(new Error('expired'))
    mockGet.mockRejectedValue(new Error('expired'))

    renderHook(() => useAuthBootstrap(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(useAuthSessionStore.getState().status).toBe('unauthenticated')
    })
  })
})
