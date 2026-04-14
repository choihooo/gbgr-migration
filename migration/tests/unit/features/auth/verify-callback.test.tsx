import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppI18nProvider } from '@/app/providers/i18n-provider'
import { useAuthEmailStore } from '@/entities/user'
import { useEmailVerificationCallback } from '@/features/auth/model/use-email-verification-callback'
import { installMockStorage } from '../../../setup/auth-test-storage'

const mockVerify = vi.fn()

vi.mock('@/features/auth/api/use-verify-email-mutation', () => ({
  useVerifyEmailMutation: () => ({
    mutateAsync: mockVerify,
    isPending: false,
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

describe('useEmailVerificationCallback', () => {
  beforeEach(() => {
    installMockStorage()
    mockVerify.mockReset()
    useAuthEmailStore.getState().setEmail('user@test.com')
  })

  it('토큰 검증 성공 시 성공 상태가 된다', async () => {
    mockVerify.mockResolvedValue({
      success: true,
    })

    const { result } = renderHook(
      () => useEmailVerificationCallback('valid-token'),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
  })

  it('토큰이 없으면 에러 상태가 된다', async () => {
    const { result } = renderHook(() => useEmailVerificationCallback(null), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
  })
})
