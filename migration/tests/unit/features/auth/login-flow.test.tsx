import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppI18nProvider } from '@/app/providers/i18n-provider'
import { useAuthSessionStore } from '@/entities/session'
import { useAuthEmailStore, useAuthUserStore } from '@/entities/user'
import { useLoginForm } from '@/features/auth/model/use-login-form'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import { installMockStorage } from '../../../setup/auth-test-storage'

const { mockNavigate, mockMutateAsync, mockFetchCurrentUser } = vi.hoisted(
  () => ({
    mockNavigate: vi.fn(),
    mockMutateAsync: vi.fn(),
    mockFetchCurrentUser: vi.fn(),
  }),
)

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/features/auth/api/use-login-mutation', () => ({
  useLoginMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

vi.mock('@/features/auth/api/auth-api', () => ({
  fetchCurrentUser: mockFetchCurrentUser,
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppI18nProvider>{children}</AppI18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('useLoginForm', () => {
  beforeEach(() => {
    installMockStorage()
    mockNavigate.mockReset()
    mockMutateAsync.mockReset()
    mockFetchCurrentUser.mockReset()
    useAuthEmailStore.getState().clearEmail()
    useAuthUserStore.getState().clearUser()
    useAuthSessionStore.setState({
      status: 'unauthenticated',
      accessToken: null,
      refreshToken: null,
      userId: null,
      userName: null,
      redirectPath: '/onboarding/init',
      lastErrorCode: null,
      hydratedAt: null,
    })
  })

  it('로그인 성공 시 세션을 저장하고 원래 보호 경로로 이동한다', async () => {
    mockMutateAsync.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'access',
        refreshToken: 'refresh',
      },
    })
    mockFetchCurrentUser.mockResolvedValue({
      success: true,
      data: {
        id: 'user-1',
        name: 'Tester',
      },
    })

    const { result } = renderHook(() => useLoginForm(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.updateField('email')({
        target: { value: 'user@test.com' },
      } as never)
      result.current.updateField('password')({
        target: { value: 'Password!1' },
      } as never)
      result.current.updateField('saveId')({
        target: { checked: true },
      } as never)
    })

    await waitFor(() => {
      expect(result.current.formValues.email).toBe('user@test.com')
      expect(result.current.formValues.password).toBe('Password!1')
    })

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as never)
    })

    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)).toBe(
      'access',
    )
    expect(useAuthSessionStore.getState().status).toBe('authenticated')
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding/init', {
      replace: true,
    })
  })

  it('미인증 로그인 시 인증 대기 화면으로 이동한다', async () => {
    mockMutateAsync.mockRejectedValue(new Error('email verification required'))

    const { result } = renderHook(() => useLoginForm(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.updateField('email')({
        target: { value: 'user@test.com' },
      } as never)
      result.current.updateField('password')({
        target: { value: 'Password!1' },
      } as never)
    })

    await waitFor(() => {
      expect(result.current.formValues.email).toBe('user@test.com')
      expect(result.current.formValues.password).toBe('Password!1')
    })

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as never)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/auth/verify', { replace: true })
  })
})
