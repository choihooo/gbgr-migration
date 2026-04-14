/**
 * @legacy src/renderer/src/shared/ui/theme-toggle-switch/ThemeToggleSwitch.tsx
 * @legacy src/renderer/src/assets/common/icons/sun_icon.svg
 * @legacy src/renderer/src/assets/common/icons/moon_icon.svg
 */

import { forwardRef } from 'react'
import { cn } from '@/shared/lib/cn'

interface ThemeToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label="라이트 모드"
      className={className}
    >
      <g clipPath="url(#clip0_1902_14219)">
        <path
          d="M12.3345 3.66671L12.7611 3.24004M3.24114 12.76L3.66781 12.3334M8.00114 2.00004V1.33337M8.00114 14.6667V14M2.00114 8.00004H1.33447M14.6678 8.00004H14.0011M3.66781 3.66671L3.24114 3.24004M12.7611 12.76L12.3345 12.3334M12.3345 8.00004C12.3345 10.3933 10.3944 12.3334 8.00114 12.3334C5.60791 12.3334 3.66781 10.3933 3.66781 8.00004C3.66781 5.60681 5.60791 3.66671 8.00114 3.66671C10.3944 3.66671 12.3345 5.60681 12.3345 8.00004Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1902_14219">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label="다크 모드"
      className={className}
    >
      <path
        d="M1.35258 8.27997C1.59258 11.7133 4.50591 14.5066 7.99258 14.66C10.4526 14.7666 12.6526 13.62 13.9726 11.8133C14.5192 11.0733 14.2259 10.58 13.3126 10.7466C12.8659 10.8266 12.4059 10.86 11.9259 10.84C8.66591 10.7066 5.99925 7.97997 5.98591 4.75997C5.97925 3.89331 6.15925 3.07331 6.48591 2.32664C6.84591 1.49997 6.41258 1.10664 5.57925 1.45997C2.93925 2.57331 1.13258 5.23331 1.35258 8.27997Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const ThemeToggleSwitch = forwardRef<
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
          checked ? 'translate-x-[32px]' : 'translate-x-0',
        )}
      />
    </button>
  )
})

ThemeToggleSwitch.displayName = 'ThemeToggleSwitch'
