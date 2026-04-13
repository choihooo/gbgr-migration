import PageMoveIcon from '@assets/common/icons/page-move-button.svg?react'
import { cn } from '@shared/lib/cn'
import * as React from 'react'

interface PageMoveButtonProps {
  direction?: 'prev' | 'next'
  onClick?: () => void
  disabled?: boolean
}

const PageMoveButton = React.forwardRef<HTMLButtonElement, PageMoveButtonProps>(
  ({ direction = 'prev', onClick, disabled = false }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'rounded-full',
          !disabled && 'cursor-pointer',
          !disabled && 'hover:[&_path:first-child]:stroke-grey-300',
          !disabled && 'hover:[&_path:last-child]:stroke-grey-400',
          !disabled && 'active:bg-grey-50',
          !disabled && 'active:[&_path:first-child]:stroke-grey-300',
          !disabled && 'active:[&_path:last-child]:stroke-grey-400',
          disabled && '[&_path:first-child]:stroke-grey-50',
          disabled && '[&_path:last-child]:stroke-grey-50',
        )}
      >
        <PageMoveIcon
          className={cn(
            !disabled && '[&_path:first-child]:stroke-grey-200',
            !disabled && '[&_path:last-child]:stroke-grey-300',
            direction === 'next' && 'scale-x-[-1]',
          )}
        />
      </button>
    )
  },
)

PageMoveButton.displayName = 'PageMoveButton'
export { PageMoveButton }
