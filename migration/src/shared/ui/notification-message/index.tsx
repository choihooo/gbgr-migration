import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import { ErrorIcon, SuccessIcon } from '@/shared/ui/icons/status-icons'
// 레거시: src/renderer/src/shared/ui/notification-message/NotificateMessage.tsx
// CVA → Record 직접 매핑 변환

const notificationClasses = {
  default: 'bg-grey-0 text-grey-800',
  success: 'bg-yellow-50 border-yellow-500 text-grey-800 border',
} as const

const iconClasses = {
  default: 'bg-grey-25 text-grey-800',
  success: 'bg-yellow-500 text-grey-0',
} as const

type NotificationVariant = keyof typeof notificationClasses

interface NotificateMessageProps {
  message: ReactNode
  step: number
  errorMessage?: ReactNode
  variant?: NotificationVariant
}

export function NotificateMessage({
  message,
  step,
  errorMessage,
  variant = 'default',
}: NotificateMessageProps) {
  const getIcon = () => {
    if (variant === 'success') {
      return <SuccessIcon className="h-10 w-10" />
    }
    return <span className="text-sm font-medium">{step}</span>
  }

  return (
    <>
      <div
        className={cn(
          'w-[544px] p-[18px] text-body-md-regular transition-all duration-200 ease-in-out rounded-full',
          notificationClasses[variant],
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-6">
          <div
            className={cn(
              'inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0',
              iconClasses[variant],
            )}
            aria-hidden="true"
          >
            {getIcon()}
          </div>

          <div className="flex h-10 min-w-0 flex-1 items-center">
            <div className="leading-relaxed">{message}</div>
          </div>
        </div>
      </div>

      {variant === 'default' && errorMessage && (
        <div className="text-caption-sm-regular text-error mt-2 flex items-start gap-[6px]">
          <ErrorIcon />
          <span className="leading-5">{errorMessage}</span>
        </div>
      )}
    </>
  )
}
