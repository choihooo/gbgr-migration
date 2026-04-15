import { describe, expect, it } from 'vitest'
import { resolveEngineModeFromVisibility } from './use-window-visibility-sync'

describe('resolveEngineModeFromVisibility', () => {
  it('숨김 상태에서는 background 모드를 반환한다', () => {
    expect(resolveEngineModeFromVisibility(true)).toBe('background')
  })

  it('표시 상태에서는 foreground 모드를 반환한다', () => {
    expect(resolveEngineModeFromVisibility(false)).toBe('foreground')
  })
})
