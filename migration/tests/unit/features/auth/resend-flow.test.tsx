import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppI18nProvider } from '@/app/providers/i18n-provider'
import { useAuthEmailStore } from '@/entities/user'
import { useResendVerification } from '@/features/auth/model/use-resend-verification'
import { installMockStorage } from '../../../setup/auth-test-storage'

const mockResend = vi.fn()

vi.mock('@/features/auth/api/use-resend-verification-email-mutation', () => ({
  useResendVerificationEmailMutation: () => ({
    mutateAsync: mockResend,
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

describe('useResendVerification', () => {
  beforeEach(() => {
    installMockStorage()
    mockResend.mockReset()
    useAuthEmailStore.getState().clearEmail()
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    })
  })

  it('이메일이 없으면 이메일 없음 메시지를 반환한다', async () => {
    const { result } = renderHook(() => useResendVerification(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.handleResend()
    })

    expect(result.current.feedbackMessage.length).toBeGreaterThan(0)
  })

  it('재발송 성공 시 성공 메시지를 표시한다', async () => {
    useAuthEmailStore.getState().setEmail('user@test.com')
    mockResend.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useResendVerification(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.handleResend()
    })

    expect(mockResend).toHaveBeenCalledWith({
      email: 'user@test.com',
      callbackUrl: 'gbgr://auth/verify-callback',
    })
    expect(result.current.feedbackMessage).toContain('user@test.com')
  })
})
