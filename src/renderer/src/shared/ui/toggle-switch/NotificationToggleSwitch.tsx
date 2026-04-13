import { cn } from '@shared/lib/cn'
import * as React from 'react'

interface NotificationToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  isDisabled?: boolean
}

const NotificationToggleSwitch = React.forwardRef<
  HTMLButtonElement,
  NotificationToggleSwitchProps
>(({ checked, onChange, isDisabled = false }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[18px] w-[34px] cursor-pointer items-center rounded-full px-[3px] py-[2px] transition-colors duration-200 ease-in-out',
        checked && isDisabled
          ? 'bg-global-yellow-100'
          : checked
            ? 'bg-yellow-400'
            : 'bg-grey-100',
      )}
    >
      <span
        className={cn(
          'bg-grey-0 dark:bg-grey-500 inline-block h-[14px] w-[14px] transform rounded-full transition-transform duration-200 ease-in-out',
          checked ? 'dark:bg-grey-1000 translate-x-[14px]' : '',
        )}
      />
    </button>
  )
})

NotificationToggleSwitch.displayName = 'NotificationToggleSwitch'
export { NotificationToggleSwitch }
