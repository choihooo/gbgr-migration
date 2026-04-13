import DashboardIcon from '@assets/common/icons/dashboard.svg?react'
import Logo from '@assets/common/icons/logo.svg?react'
import SettingIcon from '@assets/common/icons/setting.svg?react'
import Symbol from '@assets/common/icons/symbol.svg?react'
import TipOff from '@assets/common/icons/tip-off.svg?react'
import NotificationIcon from '@assets/main/bell_icon.svg?react'
import { Button } from '@shared/ui/button'
import type { ComponentType, SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'

import { useModal } from '@shared/hooks/use-modal'
import { useThemePreference } from '@shared/hooks/use-theme-preference'
import { cn } from '@shared/lib/cn'
import { ThemeToggleSwitch } from '@shared/ui/theme-toggle-switch'
import SettingsModal from './SettingsModal'

type TabType = 'dashboard' | 'settings' | 'report' | 'review'
type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface TabItem {
  id: TabType
  label: string
  icon?: IconType
  disabled: boolean
  path: string
}

interface MainHeaderProps {
  onClickNotification?: () => void
}

const ERROR_REPORT_URL =
  'https://adhesive-wrench-b12.notion.site/3067d0b568e281fd97b4f2954d09a2f6?pvs=105'
const REVIEW_FORM_URL =
  'https://adhesive-wrench-b12.notion.site/30f7d0b568e28033b440c1352d8a1a43?pvs=105'

const MainHeader = ({ onClickNotification }: MainHeaderProps) => {
  const [isDark, setIsDark] = useThemePreference()
  const navigate = useNavigate()
  const {
    isOpen: isSettingsOpen,
    open: openSettings,
    close: closeSettings,
  } = useModal()
  const activeTab: TabType = isSettingsOpen ? 'settings' : 'dashboard'

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: DashboardIcon,
      disabled: false,
      path: '/main',
    },
    {
      id: 'settings',
      label: '설정',
      icon: SettingIcon,
      disabled: false,
      path: '/main',
    },
    {
      id: 'report',
      label: '오류 제보',
      icon: TipOff,
      disabled: false,
      path: '/main',
    },
    {
      id: 'review',
      label: '후기 등록',
      disabled: false,
      path: '/main',
    },
  ]

  return (
    <>
      {isSettingsOpen && <SettingsModal onClose={closeSettings} />}
      <div className="bg-grey-0 mr-4 flex justify-between rounded-[999px] p-2">
        {/* 타이틀 영역 */}
        <div className="flex items-center gap-10">
          <div className="ml-3 flex items-center gap-[10px]">
            <Symbol className="flex h-[27px] w-[27px]" />
            <Logo className="hbp:h-[27px] hbp:w-[115px] [&>path]:fill-logo-fill flex h-[22px] w-[92px]" />
          </div>

          {/* 네비게이션 탭 */}
          <nav className="flex gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <Button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'settings') {
                      openSettings()
                      return
                    }
                    if (tab.id === 'report') {
                      window.open(
                        ERROR_REPORT_URL,
                        '_blank',
                        'noopener,noreferrer',
                      )
                      return
                    }
                    if (tab.id === 'review') {
                      window.open(
                        REVIEW_FORM_URL,
                        '_blank',
                        'noopener,noreferrer',
                      )
                      return
                    }
                    navigate(tab.path)
                  }}
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
          <ThemeToggleSwitch checked={isDark} onChange={setIsDark} />
          <Button
            onClick={onClickNotification}
            variant="grey"
            className="h-[34px] w-[34px] p-[7px]"
            text={<NotificationIcon className="[&>path]:stroke-grey-400" />}
          />
        </div>
      </div>
    </>
  )
}

export default MainHeader
