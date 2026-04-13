import * as React from 'react'

import { cn } from '@shared/lib/cn'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  uncheckedLabel?: string
  checkedLabel?: string
}

const ToggleSwitch = React.forwardRef<HTMLButtonElement, ToggleSwitchProps>(
  ({ checked, onChange, uncheckedLabel, checkedLabel }, ref) => {
    const uncheckedRef = React.useRef<HTMLDivElement>(null)
    const checkedRef = React.useRef<HTMLDivElement>(null)
    const [indicatorWidth, setIndicatorWidth] = React.useState(0)
    const [translateX, setTranslateX] = React.useState(0)

    React.useEffect(() => {
      const updateIndicator = () => {
        if (uncheckedRef.current && checkedRef.current) {
          const uncheckedWidth = uncheckedRef.current.offsetWidth
          const checkedWidth = checkedRef.current.offsetWidth
          const gap = 8 // gap-2 = 8px
          const extraPadding = 16 // 인디케이터 추가 너비 (좌우 각 4px)

          if (checked) {
            // 연간 선택됨: 인디케이터가 연간 위치로
            setIndicatorWidth(checkedWidth + extraPadding)
            setTranslateX(uncheckedWidth + gap - extraPadding / 2)
          } else {
            // 월간 선택됨: 인디케이터가 월간 위치로
            setIndicatorWidth(uncheckedWidth + extraPadding)
            setTranslateX(-extraPadding / 2)
          }
        }
      }

      // 레이아웃 완료 후 재계산
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
export { ToggleSwitch }
