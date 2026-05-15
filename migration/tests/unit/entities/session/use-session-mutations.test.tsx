import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStopSessionMutation } from '@/entities/session/model/use-session-mutations'
import { installMockStorage } from '../../../setup/auth-test-storage'

const { mockStopSession, mockCloseWidget, mockMeasureEnd } = vi.hoisted(() => ({
  mockStopSession: vi.fn(),
  mockCloseWidget: vi.fn(),
  mockMeasureEnd: vi.fn(),
}))

vi.mock('@/entities/session/api/session-api', () => ({
  createSession: vi.fn(),
  stopSession: mockStopSession,
  pauseSession: vi.fn(),
  resumeSession: vi.fn(),
  saveMetrics: vi.fn(),
}))

vi.mock('@/shared/lib/widget-api', () => ({
  closeWidget: mockCloseWidget,
}))

vi.mock('@/shared/lib/analytics', () => ({
  AnalyticsEvents: {
    measureStart: vi.fn(),
    firstMeasureStart: vi.fn(),
    meaningfulUse: vi.fn(),
    measureEnd: mockMeasureEnd,
  },
  GA_STORAGE_KEYS: {
    SIGNUP_COMPLETED_AT: 'signupCompletedAt',
    FIRST_MEASURE_START_SENT: 'firstMeasureStartSent',
    MEANINGFUL_USE_SENT: 'meaningfulUseSent',
  },
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useStopSessionMutation', () => {
  beforeEach(() => {
    installMockStorage()
    mockStopSession.mockReset()
    mockCloseWidget.mockReset()
    mockMeasureEnd.mockReset()
  })

  it('세션 종료 성공 시 위젯도 함께 닫는다', async () => {
    window.localStorage.setItem('sessionStartAt', String(Date.now() - 5_000))
    window.localStorage.setItem('sessionId', 'session-1')
    mockStopSession.mockResolvedValue({ success: true })
    mockCloseWidget.mockResolvedValue(undefined)

    const { result } = renderHook(() => useStopSessionMutation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync('session-1')
    })

    await waitFor(() => {
      expect(mockCloseWidget).toHaveBeenCalledTimes(1)
    })
  })
})
