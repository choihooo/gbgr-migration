import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  NotificationToggleSwitch,
  ToggleSwitch,
} from '@/shared/ui/toggle-switch'

describe('ToggleSwitch', () => {
  it('uncheckedLabel과 checkedLabel을 표시한다', () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={vi.fn()}
        uncheckedLabel="월간"
        checkedLabel="연간"
      />,
    )
    expect(screen.getByText('월간')).toBeInTheDocument()
    expect(screen.getByText('연간')).toBeInTheDocument()
  })

  it('클릭 시 onChange가 반대값으로 호출된다', async () => {
    const onChange = vi.fn()
    render(
      <ToggleSwitch
        checked={false}
        onChange={onChange}
        uncheckedLabel="A"
        checkedLabel="B"
      />,
    )
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('role=switch와 aria-checked 속성을 가진다', () => {
    render(
      <ToggleSwitch
        checked={true}
        onChange={vi.fn()}
        uncheckedLabel="A"
        checkedLabel="B"
      />,
    )
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })
})

describe('NotificationToggleSwitch', () => {
  it('클릭 시 onChange가 반대값으로 호출된다', async () => {
    const onChange = vi.fn()
    render(<NotificationToggleSwitch checked={false} onChange={onChange} />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('checked=true일 때 bg-yellow-400 클래스를 가진다', () => {
    render(<NotificationToggleSwitch checked={true} onChange={vi.fn()} />)
    const sw = screen.getByRole('switch')
    expect(sw.className).toContain('bg-yellow-400')
  })

  it('checked=false일 때 bg-grey-100 클래스를 가진다', () => {
    render(<NotificationToggleSwitch checked={false} onChange={vi.fn()} />)
    const sw = screen.getByRole('switch')
    expect(sw.className).toContain('bg-grey-100')
  })

  it('role=switch와 aria-checked 속성을 가진다', () => {
    render(<NotificationToggleSwitch checked={false} onChange={vi.fn()} />)
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'false')
  })
})
