import { describe, expect, it } from 'vitest'
import { getPostAuthRedirectPath } from '@/features/auth/model/use-auth-redirect'

describe('router auth helpers', () => {
  it('보호 경로가 없으면 메인으로 보낸다', () => {
    expect(getPostAuthRedirectPath(null)).toBe('/main')
  })

  it('auth 경로는 메인으로 교정한다', () => {
    expect(getPostAuthRedirectPath('/auth/login')).toBe('/main')
  })

  it('보호 경로가 있으면 그대로 복귀한다', () => {
    expect(getPostAuthRedirectPath('/onboarding/init')).toBe('/onboarding/init')
  })
})
