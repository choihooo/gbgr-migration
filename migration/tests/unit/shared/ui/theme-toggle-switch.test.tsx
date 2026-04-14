/**
 * @tests ThemeToggleSwitch — 복잡 토글 인터랙션 (sun/moon 아이콘, 슬라이딩 인디케이터)
 * @see migration/src/shared/ui/theme-toggle-switch/index.tsx
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeToggleSwitch } from '@/shared/ui/theme-toggle-switch'

describe('ThemeToggleSwitch', () => {
  it('renders as a button with role="switch"', () => {
    render(<ThemeToggleSwitch checked={false} onChange={vi.fn()} />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeInTheDocument()
  })

  it('reflects checked state via aria-checked', () => {
    const { rerender } = render(
      <ThemeToggleSwitch checked={false} onChange={vi.fn()} />,
    )
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')

    rerender(<ThemeToggleSwitch checked={true} onChange={vi.fn()} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with toggled value on click', () => {
    const onChange = vi.fn()
    render(<ThemeToggleSwitch checked={false} onChange={onChange} />)

    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange with false when currently checked', () => {
    const onChange = vi.fn()
    render(<ThemeToggleSwitch checked={true} onChange={onChange} />)

    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('renders sun and moon icons', () => {
    render(<ThemeToggleSwitch checked={false} onChange={vi.fn()} />)
    // SVG elements for sun and moon should be present
    const svgs = screen.getByRole('switch').querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(2)
  })

  it('applies translate-x class when checked (indicator slides to moon)', () => {
    const { rerender } = render(
      <ThemeToggleSwitch checked={false} onChange={vi.fn()} />,
    )
    const indicator = screen.getByRole('switch').querySelector('span')
    expect(indicator?.className).toContain('translate-x-0')

    rerender(<ThemeToggleSwitch checked={true} onChange={vi.fn()} />)
    expect(indicator?.className).toContain('translate-x-[32px]')
  })
})
