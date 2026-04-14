import { cn } from '@/shared/lib/cn'
import { forwardRef, useEffect, useRef, useState } from 'react'
// 레거시: src/renderer/src/shared/ui/toggle-switch/ToggleSwitch.tsx
// 레거시: src/renderer/src/shared/ui/toggle-switch/NotificationToggleSwitch.tsx

/* ─── ToggleSwitch (레이블 슬라이딩 인디케이터) ─── */

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  uncheckedLabel?: string
  checkedLabel?: string
}

export const ToggleSwitch = forwardRef<HTMLButtonElement, ToggleSwitchProps>(
  ({ checked, onChange, uncheckedLabel, checkedLabel }, ref) => {
    const uncheckedRef = useRef<HTMLDivElement>(null)
    const checkedRef = useRef<HTMLDivElement>(null)
    const [indicatorWidth, setIndicatorWidth] = useState(0)
    const [translateX, setTranslateX] = useState(0)

    useEffect(() => {
      const updateIndicator = () => {
        if (uncheckedRef.current && checkedRef.current) {
          const uncheckedWidth = uncheckedRef.current.offsetWidth
          const checkedWidth = checkedRef.current.offsetWidth
          const gap = 8
          const extraPadding = 16

          if (checked) {
            setIndicatorWidth(checkedWidth + extraPadding)
            setTranslateX(uncheckedWidth + gap - extraPadding / 2)
          } else {
            setIndicatorWidth(uncheckedWidth + extraPadding)
            setTranslateX(-extraPadding / 2)
          }
        }
      }

      const timeoutId = setTimeout(updateIndicator, 0)
      return () => clearTimeout(timeoutId)
    }, [uncheckedLabel, checkedLabel, checked])

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'bg-grey-25 text-caption-xs-meidum relative flex h-[28px] w-fit cursor-pointer items-center gap-2 rounded-full px-[12px]',
        )}
      >
        <span
          className={cn(
            'bg-grey-0 absolute left-[12px] h-[22px] rounded-full transition-all duration-400 ease-in-out',
          )}
          style={{
            width: `${indicatorWidth}px`,
            transform: `translateX(${translateX}px)`,
          }}
        />

        <div
          ref={uncheckedRef}
          className={cn(
            'relative z-10 flex h-[24px] items-center justify-center px-2',
            !checked ? 'text-yellow-400' : 'text-grey-400',
          )}
        >
          {uncheckedLabel}
        </div>

        <div
          ref={checkedRef}
          className={cn(
            'relative z-10 flex h-[24px] items-center justify-center px-2',
            checked ? 'text-yellow-400' : 'text-grey-400',
          )}
        >
          {checkedLabel}
        </div>
      </button>
    )
  },
)

ToggleSwitch.displayName = 'ToggleSwitch'

/* ─── NotificationToggleSwitch (소형 알림용) ─── */

interface NotificationToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  isDisabled?: boolean
}

export const NotificationToggleSwitch = forwardRef<
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
