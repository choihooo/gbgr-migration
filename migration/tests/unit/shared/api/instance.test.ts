import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearStoredTokens, refreshAccessToken } from '@/shared/api/instance'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import { installMockStorage } from '../../../setup/auth-test-storage'

describe('shared/api/instance', () => {
  beforeEach(() => {
    installMockStorage()
    vi.restoreAllMocks()
  })

  it('토큰 정리 시 인증 토큰만 제거한다', () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, 'access')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, 'refresh')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.savedEmail, 'user@test.com')

    clearStoredTokens()

    expect(
      window.localStorage.getItem(AUTH_STORAGE_KEYS.accessToken),
    ).toBeNull()
    expect(
      window.localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken),
    ).toBeNull()
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.savedEmail)).toBe(
      'user@test.com',
    )
  })

  it('리프레시 성공 시 새 토큰을 저장한다', async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, 'refresh-token')
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        success: true,
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        },
      },
    } as never)

    await refreshAccessToken()

    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)).toBe(
      'new-access',
    )
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken)).toBe(
      'new-refresh',
    )
  })
})
