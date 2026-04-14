import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthSessionStore } from '@/entities/session'

describe('useAuthSessionStore', () => {
  beforeEach(() => {
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

  it('세션을 인증 상태로 저장한다', () => {
    useAuthSessionStore.getState().setSession({
      status: 'authenticated',
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: 'user-1',
      userName: 'Tester',
    })

    expect(useAuthSessionStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: 'user-1',
      userName: 'Tester',
    })
  })

  it('미인증 전환 시 리다이렉트 경로를 보존한다', () => {
    useAuthSessionStore.setState({
      status: 'authenticated',
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: 'user-1',
      userName: 'Tester',
      redirectPath: '/main',
      lastErrorCode: null,
      hydratedAt: 1,
    })

    useAuthSessionStore.getState().markUnauthenticated('AUTH-101')

    expect(useAuthSessionStore.getState()).toMatchObject({
      status: 'unauthenticated',
      redirectPath: '/main',
      lastErrorCode: 'AUTH-101',
    })
  })
})
