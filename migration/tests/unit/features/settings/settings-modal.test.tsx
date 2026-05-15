import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppI18nProvider } from '@/app/providers/i18n-provider'
import { useAuthSessionStore } from '@/entities/session'
import { useAuthUserStore } from '@/entities/user'
import { SettingsModal } from '@/features/settings/ui/SettingsModal'
import { GA_STORAGE_KEYS } from '@/shared/lib/analytics/storage-keys'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import { installMockStorage } from '../../../setup/auth-test-storage'

const {
  mockDisable,
  mockEnable,
  mockIsEnabled,
  mockNavigate,
  mockFetchUpdate,
} = vi.hoisted(() => ({
  mockDisable: vi.fn(),
  mockEnable: vi.fn(),
  mockIsEnabled: vi.fn(),
  mockNavigate: vi.fn(),
  mockFetchUpdate: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-autostart', () => ({
  disable: mockDisable,
  enable: mockEnable,
  isEnabled: mockIsEnabled,
}))

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/features/auth/model/use-withdraw-mutation', () => ({
  useWithdrawMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/shared/lib/update-api', () => ({
  fetchUpdate: mockFetchUpdate,
  installUpdate: vi.fn(),
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
        <AppI18nProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </AppI18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('SettingsModal', () => {
  beforeEach(() => {
    installMockStorage()
    mockDisable.mockReset()
    mockEnable.mockReset()
    mockIsEnabled.mockReset()
    mockNavigate.mockReset()
    mockFetchUpdate.mockReset()
    mockIsEnabled.mockResolvedValue(false)
    mockFetchUpdate.mockResolvedValue({
      configured: false,
      update: null,
    })
    useAuthUserStore.setState({
      id: 'user@test.com',
      name: 'Tester',
    })
    useAuthSessionStore.setState({
      status: 'authenticated',
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: 'user@test.com',
      userName: 'Tester',
      redirectPath: '/dashboard',
      lastErrorCode: null,
      hydratedAt: Date.now(),
    })
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, 'access')
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, 'refresh')
    localStorage.setItem(AUTH_STORAGE_KEYS.userId, 'user@test.com')
    localStorage.setItem(AUTH_STORAGE_KEYS.userName, 'Tester')
    localStorage.setItem(GA_STORAGE_KEYS.FIRST_MEASURE_START_SENT, '1')
  })

  it('로그아웃 시 인증 상태와 analytics 플래그를 함께 정리한다', async () => {
    render(<SettingsModal isOpen onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    const logoutButton = await screen.findByRole('button', { name: /로그아웃/ })
    await waitFor(() => {
      expect(mockFetchUpdate).toHaveBeenCalled()
    })

    fireEvent.click(logoutButton)

    expect(localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)).toBeNull()
    expect(
      localStorage.getItem(GA_STORAGE_KEYS.FIRST_MEASURE_START_SENT),
    ).toBeNull()
    expect(useAuthSessionStore.getState().status).toBe('unauthenticated')
    expect(useAuthUserStore.getState().id).toBeNull()
    expect(useAuthUserStore.getState().name).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', { replace: true })
  })

  it('updater가 설정되지 않은 환경에서는 업데이트 액션 버튼을 숨긴다', async () => {
    render(<SettingsModal isOpen onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(mockFetchUpdate).toHaveBeenCalled()
    })

    expect(
      screen.getByText('업데이트 서버가 아직 설정되지 않았어요.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '업데이트 확인' }),
    ).not.toBeInTheDocument()
  })
})
