/**
 * @legacy src/renderer/src/features/dashboard/ui/MainHeader.tsx
 */

import type { ComponentType, SVGProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/entities/theme'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { BrandLogo, BrandSymbol } from '@/shared/ui/icons/brand-icons'
import {
  BellIcon,
  DashboardIcon,
  SettingIcon,
  TipOffIcon,
} from '@/shared/ui/icons/nav-icons'
import { ThemeToggleSwitch } from '@/shared/ui/theme-toggle-switch'
import type { TabType } from '../model/use-navigation-tabs'

interface TabItem {
  id: TabType
  label: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  disabled: boolean
}

interface DashboardHeaderProps {
  activeTab?: TabType
  onTabClick?: (tabId: TabType) => void
  onOpenNotification?: () => void
}

export function DashboardHeader({
  activeTab = 'dashboard',
  onTabClick,
  onOpenNotification,
}: DashboardHeaderProps) {
  const { t } = useTranslation()
  const isDark = useThemeStore(s => s.isDark)
  const setPreference = useThemeStore(s => s.setPreference)

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: t('dashboard.header.dashboard'),
      icon: DashboardIcon,
      disabled: false,
    },
    {
      id: 'settings',
      label: t('dashboard.header.settings'),
      icon: SettingIcon,
      disabled: false,
    },
    {
      id: 'report',
      label: t('dashboard.header.report'),
      icon: TipOffIcon,
      disabled: false,
    },
    { id: 'review', label: t('dashboard.header.review'), disabled: false },
  ]

  return (
    <header
      className={cn('bg-grey-0 mr-4 flex justify-between rounded-[999px] p-2')}
    >
      <div className="flex items-center gap-10">
        <div className="ml-3 flex items-center gap-[10px]">
          <BrandSymbol className="flex h-[27px] w-[27px]" />
          <BrandLogo
            className={cn(
              'hbp:h-[27px] hbp:w-[115px] [&>path]:fill-logo-fill flex h-[22px] w-[92px]',
            )}
          />
        </div>

        <nav className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <Button
                key={tab.id}
                onClick={() => onTabClick?.(tab.id)}
                disabled={tab.disabled}
                variant={isActive ? 'primary' : 'grey'}
                size="sm"
                className={cn(
                  'group',
                  isActive
                    ? 'text-grey-1000 dark:text-grey-0 bg-yellow-400'
                    : 'bg-grey-25 text-grey-400 group-hover:text-grey-700',
                )}
                text={
                  <div className="flex items-center gap-2">
                    {Icon && (
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px]',
                          isActive
                            ? 'text-grey-1000 dark:text-grey-0'
                            : 'text-grey-400 group-hover:text-grey-700',
                        )}
                      />
                    )}
                    <span className="text-body-md-medium group-hover:text-grey-700">
                      {tab.label}
                    </span>
                  </div>
                }
              />
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggleSwitch
          checked={isDark}
          onChange={dark => setPreference(dark ? 'dark' : 'light')}
        />
        <Button
          onClick={onOpenNotification}
          variant="grey"
          className="h-[34px] w-[34px] p-[7px]"
          text={<BellIcon className="[&>path]:stroke-grey-400" />}
        />
      </div>
    </header>
  )
}
