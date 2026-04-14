/**
 * @legacy src/renderer/src/app/layouts/header/Header.tsx
 */
import { BrandLogo, BrandSymbol } from '@/shared/ui/icons/brand-icons'
import { useThemeStore } from '@/entities/theme'
import { ThemeToggleSwitch } from '@/shared/ui/theme-toggle-switch'
import { cn } from '@/shared/lib/cn'

export function Header() {
  const isDark = useThemeStore((s) => s.isDark)
  const setPreference = useThemeStore((s) => s.setPreference)

  return (
    <div className={cn('bg-grey-0 hbp:h-[75px] hbp:px-7.5 hbp:py-5 fixed top-0 z-100 h-15 w-full px-6 py-4')}>
      <div className="flex w-full flex-row justify-between">
        <div className={cn('hbp:gap-4 flex flex-row items-center gap-[10px]')}>
          <BrandSymbol className="flex h-[27px] w-[27px]" />
          <BrandLogo className={cn('hbp:h-[27px] hbp:w-[115px] [&>path]:fill-logo-fill flex h-[22px] w-[92px]')} />
        </div>
        <ThemeToggleSwitch
          checked={isDark}
          onChange={(dark) => setPreference(dark ? 'dark' : 'light')}
        />
      </div>
    </div>
  )
}
