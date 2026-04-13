import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'
import { ErrorIcon, SuccessIcon } from './icons'

const notification = cva(
  'w-[544px] p-[18px] text-body-md-regular transition-all duration-200 ease-in-out rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-grey-0 text-grey-800',
        success: 'bg-yellow-50 border-yellow-500 text-grey-800 border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const icon = cva(
  'inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-grey-25 text-grey-800',
        fail: 'bg-grey-25 text-grey-800',
        success: 'bg-yellow-500 text-grey-0',
      },
    },
  },
)

type Props = {
  /** 알림 메시지 내용 */
  message: React.ReactNode
  /** 스텝 번호 (기본 상태에서 사용) */
  step: number
  /** 에러 메시지 (기본 상태에서만 사용) */
  errorMessage?: React.ReactNode
} & VariantProps<typeof notification>

export function NotificateMessage({
  message,
  step,
  errorMessage,
  variant = 'default',
}: Props) {
  const getIcon = () => {
    if (variant === 'success') {
      return <SuccessIcon className="h-10 w-10" />
    }

    // default 상태에서는 항상 스텝 번호 표시
    return <span className="text-sm font-medium">{step}</span>
  }

  return (
    <>
      <div
        className={notification({ variant })}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-6">
          {/* 아이콘 */}
          <div className={icon({ variant })} aria-hidden="true">
            {getIcon()}
          </div>

          {/* 메시지 영역 */}
          <div className="flex h-10 min-w-0 flex-1 items-center">
            <div className="leading-relaxed">{message}</div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 (보더 밖에 별도로 표시) */}
      {variant === 'default' && errorMessage && (
        <div className="text-caption-sm-regular text-error mt-2 flex items-start gap-[6px]">
          <ErrorIcon />
          <span className="leading-5">{errorMessage}</span>
        </div>
      )}
    </>
  )
}

export default NotificateMessage
