import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppI18nProvider } from '@/app/providers/i18n-provider'
import { useAuthEmailStore } from '@/entities/user'
import { useSignupForm } from '@/features/auth/model/use-signup-form'
import { installMockStorage } from '../../../setup/auth-test-storage'

const mockNavigate = vi.fn()
const mockCheckEmail = vi.fn()
const mockSignup = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/features/auth/api/use-signup-mutation', () => ({
  useCheckEmailMutation: () => ({
    mutateAsync: mockCheckEmail,
    isPending: false,
  }),
  useSignupMutation: () => ({
    mutateAsync: mockSignup,
    isPending: false,
  }),
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    setTitle: vi.fn(),
  }),
}))

function createWrapper() {
  const queryClient = new QueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppI18nProvider>{children}</AppI18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('useSignupForm', () => {
  beforeEach(() => {
    installMockStorage()
    mockNavigate.mockReset()
    mockCheckEmail.mockReset()
    mockSignup.mockReset()
    useAuthEmailStore.getState().clearEmail()
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    })
  })

  it('중복 확인 성공 후 회원가입이 완료되면 인증 대기 화면으로 이동한다', async () => {
    mockCheckEmail.mockResolvedValue({
      data: {
        isDuplicate: false,
      },
    })
    mockSignup.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useSignupForm(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.updateField('email')({
        target: { value: 'user@test.com' },
      } as never)
      result.current.updateField('password')({
        target: { value: 'Password!1' },
      } as never)
      result.current.updateField('confirmPassword')({
        target: { value: 'Password!1' },
      } as never)
      result.current.updateField('name')({
        target: { value: '테스터' },
      } as never)
    })

    await waitFor(() => {
      expect(result.current.formValues.email).toBe('user@test.com')
      expect(result.current.formValues.confirmPassword).toBe('Password!1')
    })

    await act(async () => {
      await result.current.handleDuplicateCheck()
    })

    await waitFor(() => {
      expect(result.current.duplicateCheck.success).toBe(true)
    })

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as never)
    })

    expect(mockSignup).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'Password!1',
      name: '테스터',
      avatar: '',
      callbackUrl: 'gbgr://auth/verify-callback',
    })
    expect(useAuthEmailStore.getState().email).toBe('user@test.com')
    expect(mockNavigate).toHaveBeenCalledWith('/auth/verify')
  })
})
