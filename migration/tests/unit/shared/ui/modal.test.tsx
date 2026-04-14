import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from '@/shared/ui/modal'

describe('Modal', () => {
  it('isOpen=true일 때 콘텐츠를 렌더링한다', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    expect(screen.getByText('모달 콘텐츠')).toBeInTheDocument()
  })

  it('isOpen=false일 때 렌더링하지 않는다', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    expect(screen.queryByText('모달 콘텐츠')).not.toBeInTheDocument()
  })

  it('ESC 키를 누르면 onClose가 호출된다', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closeOnEsc=false면 ESC로 닫지 않는다', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} closeOnEsc={false}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('오버레이 클릭 시 onClose가 호출된다', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closeOnOverlayClick=false면 오버레이 클릭으로 닫지 않는다', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} closeOnOverlayClick={false}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('열릴 때 body overflow가 hidden으로 설정된다', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('닫힐 때 body overflow가 복원된다', () => {
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>모달 콘텐츠</p>
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('')
  })
})
