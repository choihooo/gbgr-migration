import { useState } from 'react'

/**
 * 모달 상태를 관리하는 훅
 *
 * @example
 * ```tsx
 * const { isOpen, open, close } = useModal();
 *
 * <button onClick={open}>모달 열기</button>
 * {isOpen && <Modal onClose={close} />}
 * ```
 */
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
