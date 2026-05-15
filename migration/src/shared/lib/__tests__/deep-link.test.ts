import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initDeepLinkListener } from '../deep-link'

const { getCurrentMock, onOpenUrlMock } = vi.hoisted(() => ({
  getCurrentMock: vi.fn(),
  onOpenUrlMock: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-deep-link', () => ({
  getCurrent: getCurrentMock,
  onOpenUrl: onOpenUrlMock,
}))

describe('initDeepLinkListener', () => {
  beforeEach(() => {
    getCurrentMock.mockReset()
    onOpenUrlMock.mockReset()
  })

  it('시작 URL이 있으면 앱 경로로 이동한다', async () => {
    const navigate = vi.fn()
    const unlisten = vi.fn()
    getCurrentMock.mockResolvedValue(['gbgr://auth/verify-callback?token=abc'])
    onOpenUrlMock.mockResolvedValue(unlisten)

    const cleanup = await initDeepLinkListener({ navigate })

    expect(navigate).toHaveBeenCalledWith('/auth/verify-callback?token=abc')
    expect(cleanup).toBe(unlisten)
  })

  it('초기 URL 조회가 실패해도 런타임 딥링크 리스너는 등록한다', async () => {
    const navigate = vi.fn()
    const unlisten = vi.fn()
    getCurrentMock.mockRejectedValue(new Error('cold start unavailable'))
    onOpenUrlMock.mockImplementation(async handler => {
      await handler(['gbgr://auth/verify-callback?token=runtime'])
      return unlisten
    })

    const cleanup = await initDeepLinkListener({ navigate })

    expect(onOpenUrlMock).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('/auth/verify-callback?token=runtime')
    expect(cleanup).toBe(unlisten)
  })
})
