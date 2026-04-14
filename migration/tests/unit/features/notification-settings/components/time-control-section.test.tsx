/**
 * TimeControlSection 단위 테스트
 * @legacy src/renderer/src/features/notification/ui/components/TimeControlSection.tsx
 *
 * 검증 항목:
 * - +/- 버튼 증감
 * - 인라인 편집 모드 전환
 * - 범위 클램핑 (1-300)
 * - disabled 상태
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { useTimeEditor } from '@/features/notification-settings/lib/use-time-editor'
import { TimeControlSection } from '@/features/notification-settings/ui/components/TimeControlSection'

/**
 * useTimeEditor의 최소한의 stub.
 * 각 테스트에서 필요한 필드만 오버라이드.
 */
function makeTimeEditor(overrides: Record<string, unknown> = {}) {
  return {
    time: 30,
    isEditing: false,
    tempTime: '30',
    inputRef: { current: null },
    handlers: {
      handleTimeClick: vi.fn(),
      handleTimeChange: vi.fn(),
      handleTimeSubmit: vi.fn(),
      handleTimeKeyDown: vi.fn(),
      increaseTime: vi.fn(),
      decreaseTime: vi.fn(),
    },
    ...overrides,
  } as ReturnType<typeof useTimeEditor>
}

const baseProps = {
  title: '맞춤 스트레칭 주기',
  description: '나만의 스트레칭 타이밍이에요.',
  isEnabled: true,
  onToggle: vi.fn(),
  isDisabled: false,
}

describe('TimeControlSection', () => {
  it('제목과 설명을 렌더링한다', () => {
    render(<TimeControlSection {...baseProps} timeEditor={makeTimeEditor()} />)

    expect(screen.getByText('맞춤 스트레칭 주기')).toBeInTheDocument()
    expect(
      screen.getByText('나만의 스트레칭 타이밍이에요.'),
    ).toBeInTheDocument()
  })

  it('+ 버튼 클릭 시 increaseTime 핸들러를 호출한다', () => {
    const editor = makeTimeEditor()
    render(<TimeControlSection {...baseProps} timeEditor={editor} />)

    // 증가 버튼: 마지막 버튼 요소
    const buttons = screen.getAllByRole('button')
    const increaseBtn = buttons[buttons.length - 1]
    fireEvent.click(increaseBtn)

    expect(editor.handlers.increaseTime).toHaveBeenCalledOnce()
  })

  it('- 버튼 클릭 시 decreaseTime 핸들러를 호출한다', () => {
    const editor = makeTimeEditor()
    render(<TimeControlSection {...baseProps} timeEditor={editor} />)

    // 감소 버튼: 첫 번째 버튼 요소 (토글 스위치 제외하고 영역 내 첫 버튼)
    const decreaseBtn = screen
      .getAllByRole('button')
      .find(btn => btn.querySelector('svg path[d*="M5 12H19"]'))
    expect(decreaseBtn).toBeTruthy()
    fireEvent.click(decreaseBtn as HTMLElement)

    expect(editor.handlers.decreaseTime).toHaveBeenCalledOnce()
  })

  it('시간 표시를 클릭하면 handleTimeClick 핸들러를 호출한다', () => {
    const editor = makeTimeEditor()
    render(<TimeControlSection {...baseProps} timeEditor={editor} />)

    const timeDisplay = screen.getByText('30분')
    fireEvent.click(timeDisplay)

    expect(editor.handlers.handleTimeClick).toHaveBeenCalledOnce()
  })

  it('isEditing=true일 때 input을 렌더링한다', () => {
    const editor = makeTimeEditor({ isEditing: true, tempTime: '45' })
    render(<TimeControlSection {...baseProps} timeEditor={editor} />)

    const input = screen.getByDisplayValue('45')
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
  })

  it('disabled 상태에서는 버튼이 비활성화된다', () => {
    const editor = makeTimeEditor({ time: 30 })
    render(
      <TimeControlSection
        {...baseProps}
        timeEditor={editor}
        isDisabled={true}
      />,
    )

    // 감소/증가 버튼이 disabled 상태
    const buttons = screen.getAllByRole('button')
    // toggle 스위치 버튼 제외한 +/- 버튼들
    const controlButtons = buttons.filter(
      btn => btn.getAttribute('role') !== 'switch',
    )
    controlButtons.forEach(btn => {
      expect(btn).toBeDisabled()
    })
  })

  it('isEnabled=false일 때도 버튼이 비활성화된다', () => {
    const editor = makeTimeEditor({ time: 30 })
    render(
      <TimeControlSection
        {...baseProps}
        timeEditor={editor}
        isEnabled={false}
      />,
    )

    const buttons = screen.getAllByRole('button')
    const controlButtons = buttons.filter(
      btn => btn.getAttribute('role') !== 'switch',
    )
    controlButtons.forEach(btn => {
      expect(btn).toBeDisabled()
    })
  })

  it('time이 1이면 감소 버튼이 비활성화된다', () => {
    const editor = makeTimeEditor({ time: 1 })
    render(<TimeControlSection {...baseProps} timeEditor={editor} />)

    const decreaseBtn = screen
      .getAllByRole('button')
      .find(btn => btn.querySelector('svg path[d*="M5 12H19"]'))
    expect(decreaseBtn).toBeDisabled()
  })

  it('time이 300이면 증가 버튼이 비활성화된다', () => {
    const editor = makeTimeEditor({ time: 300 })
    render(<TimeControlSection {...baseProps} timeEditor={editor} />)

    const buttons = screen.getAllByRole('button')
    const increaseBtn = buttons[buttons.length - 1]
    expect(increaseBtn).toBeDisabled()
  })
})
