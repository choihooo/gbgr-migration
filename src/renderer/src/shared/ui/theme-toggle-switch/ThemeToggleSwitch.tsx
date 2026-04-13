import MoonIcon from '@assets/common/icons/moon_icon.svg?react'
import SunIcon from '@assets/common/icons/sun_icon.svg?react'
import { cn } from '@shared/lib/cn'
import * as React from 'react'

interface ThemeToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

const ThemeToggleSwitch = React.forwardRef<
  HTMLButtonElement,
  ThemeToggleSwitchProps
>(({ checked, onChange }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'bg-grey-25 relative flex h-[30px] w-fit cursor-pointer items-center gap-2 rounded-full px-[3px]',
      )}
    >
      <div className="z-1 flex h-[24px] w-[24px] items-center justify-center">
        <SunIcon className={cn('[&_path]:stroke-sun-stroke z-10')} />
      </div>

      <div className="z-1 flex h-[24px] w-[24px] items-center justify-center">
        <MoonIcon className={cn('[&_path]:stroke-moon-stroke z-10')} />
      </div>

      <span
        className={cn(
          'absolute left-[3px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-yellow-400 transition-transform duration-400 ease-in-out',
          checked ? 'translate-x-[32px]' : 'translate-x-[0px]',
        )}
      />
    </button>
  )
})

ThemeToggleSwitch.displayName = 'ThemeToggleSwitch'
export { ThemeToggleSwitch }
