import Logo from '@assets/common/icons/logo.svg?react'
import Symbol from '@assets/common/icons/symbol.svg?react'
import { useThemePreference } from '@shared/hooks/use-theme-preference'
import { ThemeToggleSwitch } from '@shared/ui/theme-toggle-switch'

const Header = () => {
  const [isDark, setIsDark] = useThemePreference()

  return (
    <div className="bg-grey-0 hbp:h-[75px] hbp:px-7.5 hbp:py-5 fixed top-0 z-100 h-15 w-full px-6 py-4">
      <div className="flex w-full flex-row justify-between">
        <div className="hbp:gap-4 flex flex-row items-center gap-[10px]">
          <Symbol className="flex h-[27px] w-[27px]" />
          <Logo className="hbp:h-[27px] hbp:w-[115px] [&>path]:fill-logo-fill flex h-[22px] w-[92px]" />
        </div>
        <ThemeToggleSwitch checked={isDark} onChange={setIsDark} />
      </div>
    </div>
  )
}

export default Header
