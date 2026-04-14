import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

// 레거시: src/renderer/src/shared/ui/modal/ModalPortal.ts
// + 오버레이, ESC 닫기, 스크롤 락 기능 통합

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
}

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}: ModalProps) {
  const previousOverflow = useRef('')

  // 스크롤 락
  useEffect(() => {
    if (isOpen) {
      previousOverflow.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = previousOverflow.current
    }
    return () => {
      document.body.style.overflow = previousOverflow.current
    }
  }, [isOpen])

  // ESC 닫기
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEsc, onClose])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) onClose()
    },
    [closeOnOverlayClick, onClose],
  )

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={cn('relative', className)}>{children}</div>
    </div>,
    document.body,
  )
}
