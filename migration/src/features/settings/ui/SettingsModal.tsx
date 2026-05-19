/**
 * @legacy src/renderer/src/features/dashboard/ui/SettingsModal.tsx
 */

import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session/model/use-auth-session-store'
import { useAuthUserStore } from '@/entities/user'
import {
  clearAuthSession,
  clearRedirectPath,
} from '@/features/auth/lib/session-persistence'
import { useWithdrawMutation } from '@/features/auth/model/use-withdraw-mutation'
import { clearStoredTokens } from '@/shared/api/instance'
import { clearAnalyticsFlags } from '@/shared/lib/analytics'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import {
  clearCalibrationGate,
  requestCalibrationReset,
} from '@/shared/lib/calibration-gate'
import { cn } from '@/shared/lib/cn'
import {
  type AppLanguage,
  changeAppLanguage,
  i18n,
  normalizeLanguage,
} from '@/shared/lib/i18n'
import {
  type FetchUpdateResponse,
  fetchUpdate,
  installUpdate,
} from '@/shared/lib/update-api'
import { Button } from '@/shared/ui/button'
import {
  CalibrationResetIcon,
  LogoutIcon,
  WithdrawIcon,
} from '@/shared/ui/icons/option-icons'
import { Modal } from '@/shared/ui/modal'
import {
  NotificationToggleSwitch,
  ToggleSwitch,
} from '@/shared/ui/toggle-switch'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const markUnauthenticated = useAuthSessionStore(s => s.markUnauthenticated)
  const clearUser = useAuthUserStore(s => s.clearUser)
  const { mutateAsync: withdraw, isPending: isWithdrawPending } =
    useWithdrawMutation()

  const [isStartupEnabled, setIsStartupEnabled] = useState(false)
  const [isStartupSupported, setIsStartupSupported] = useState(true)
  const [isStartupLoading, setIsStartupLoading] = useState(true)
  const [isStartupSaving, setIsStartupSaving] = useState(false)
  const [startupError, setStartupError] = useState('')
  const [isLanguageSaving, setIsLanguageSaving] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<FetchUpdateResponse | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateError, setUpdateError] = useState('')

  const currentLanguage = normalizeLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  )

  useEffect(() => {
    let isMounted = true

    const syncStartupSettings = async () => {
      try {
        const enabled = await isEnabled()
        if (!isMounted) return
        setIsStartupEnabled(enabled)
        setIsStartupSupported(true)
      } catch {
        if (!isMounted) return
        setIsStartupEnabled(false)
        setIsStartupSupported(false)
      } finally {
        if (isMounted) {
          setIsStartupLoading(false)
          setIsStartupSaving(false)
        }
      }
    }

    if (isOpen) {
      void syncStartupSettings()
    }

    return () => {
      isMounted = false
    }
  }, [isOpen])

  useEffect(() => {
    let isMounted = true

    const syncUpdateSettings = async () => {
      if (!isOpen) return

      setUpdateError('')
      setIsCheckingUpdate(true)

      try {
        const response = await fetchUpdate()
        if (!isMounted) return

        setUpdateInfo(response)
        setUpdateMessage(
          response.configured
            ? response.update
              ? t('settings.update.availableDescription', {
                  version: response.update.version,
                })
              : t('settings.update.noUpdate')
            : t('settings.update.unconfigured'),
        )
      } catch (error: unknown) {
        if (!isMounted) return

        const message =
          error instanceof Error
            ? error.message
            : t('settings.update.errorFallback')
        setUpdateError(message)
      } finally {
        if (isMounted) {
          setIsCheckingUpdate(false)
        }
      }
    }

    void syncUpdateSettings()

    return () => {
      isMounted = false
    }
  }, [isOpen, t])

  const handleStartupToggle = async (nextEnabled: boolean) => {
    if (isStartupLoading || isStartupSaving || !isStartupSupported) return

    setIsStartupEnabled(nextEnabled)
    setIsStartupSaving(true)
    setStartupError('')

    try {
      if (nextEnabled) {
        await enable()
      } else {
        await disable()
      }
      setIsStartupEnabled(nextEnabled)
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('settings.startup.errorFallback')
      setStartupError(message)
      setIsStartupEnabled(!nextEnabled)
    } finally {
      setIsStartupSaving(false)
    }
  }

  const clearAuthState = () => {
    clearStoredTokens()
    clearAuthSession()
    clearRedirectPath()
    clearAnalyticsFlags()
    clearUser()
    markUnauthenticated()
  }

  const handleLogout = () => {
    clearAuthState()
    onClose()
    navigate('/auth/login', { replace: true })
  }

  const handleWithdraw = async () => {
    if (isWithdrawPending) return

    const shouldProceed = window.confirm(t('settings.actions.withdrawConfirm'))
    if (!shouldProceed) return

    try {
      await withdraw()
      const userId = localStorage.getItem(AUTH_STORAGE_KEYS.userId)
      clearCalibrationGate(userId)
      clearAuthState()
      onClose()
      navigate('/auth/signup', { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '회원탈퇴에 실패했습니다.'
      alert(message)
    }
  }

  const handleCalibrationReset = () => {
    const userId = localStorage.getItem(AUTH_STORAGE_KEYS.userId)
    requestCalibrationReset(userId)
    onClose()
    navigate('/onboarding/calibration')
  }

  const handleLanguageChange = async (language: AppLanguage) => {
    if (isLanguageSaving || currentLanguage === language) {
      return
    }

    setIsLanguageSaving(true)
    try {
      await changeAppLanguage(language)
    } finally {
      setIsLanguageSaving(false)
    }
  }

  const handleUpdateAction = async () => {
    if (isCheckingUpdate || isInstallingUpdate) {
      return
    }

    setUpdateError('')

    try {
      if (updateInfo?.configured && updateInfo.update) {
        setIsInstallingUpdate(true)
        const response = await installUpdate()

        if (!response.configured) {
          setUpdateInfo(null)
          setUpdateMessage(t('settings.update.unconfigured'))
          return
        }

        if (!response.installed) {
          setUpdateInfo({
            configured: true,
            update: null,
          })
          setUpdateMessage(t('settings.update.noUpdate'))
          return
        }

        setUpdateInfo({
          configured: true,
          update: null,
        })
        setUpdateMessage(
          response.exitsOnInstall
            ? t('settings.update.installingExit')
            : t('settings.update.installedDescription'),
        )
        return
      }

      setIsCheckingUpdate(true)
      const response = await fetchUpdate()
      setUpdateInfo(response)

      if (!response.configured) {
        setUpdateMessage(t('settings.update.unconfigured'))
      } else if (response.update) {
        setUpdateMessage(
          t('settings.update.availableDescription', {
            version: response.update.version,
          }),
        )
      } else {
        setUpdateMessage(t('settings.update.noUpdate'))
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('settings.update.errorFallback')
      setUpdateError(message)
    } finally {
      setIsCheckingUpdate(false)
      setIsInstallingUpdate(false)
    }
  }

  const startupDescription = isStartupLoading
    ? t('settings.startup.loading')
    : !isStartupSupported
      ? t('settings.startup.unsupported')
      : isStartupSaving
        ? t('settings.startup.saving')
        : t('settings.startup.enabledDescription')

  const updateDescription = isCheckingUpdate
    ? t('settings.update.checking')
    : isInstallingUpdate
      ? t('settings.update.installing')
      : updateMessage || t('settings.update.description')

  const updateActionLabel =
    updateInfo?.configured && updateInfo.update
      ? t('settings.update.installAction')
      : t('settings.update.checkAction')
  const showUpdateAction = updateInfo?.configured !== false

  const actionItems = [
    {
      label: t('settings.actions.logout'),
      icon: <LogoutIcon />,
      onClick: handleLogout,
    },
    {
      label: t('settings.actions.withdraw'),
      icon: <WithdrawIcon />,
      onClick: handleWithdraw,
    },
    {
      label: t('settings.actions.calibrationReset'),
      icon: <CalibrationResetIcon />,
      onClick: handleCalibrationReset,
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[339px]">
      <div className="flex flex-col gap-4 rounded-[24px] border border-grey-50 bg-surface-modal p-4 shadow-[0_0_24px_rgba(0,0,0,0.12)]">
        <div className="rounded-[12px] bg-surface-modal-container p-3">
          <h2 className="text-body-lg-semibold text-grey-900">
            {t('settings.title')}
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[12px] bg-surface-modal-container p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body-md-medium text-grey-900">
              {t('settings.language.label')}
            </span>
            <span className="font-['Pretendard'] text-[11px] leading-[150%] text-grey-500">
              {t('settings.language.description')}
            </span>
          </div>

          <div
            className={cn(
              'shrink-0',
              isLanguageSaving ? 'pointer-events-none opacity-70' : '',
            )}
          >
            <ToggleSwitch
              checked={currentLanguage === 'en'}
              onChange={checked => {
                const nextLanguage: AppLanguage = checked ? 'en' : 'ko'
                void handleLanguageChange(nextLanguage)
              }}
              uncheckedLabel={t('settings.language.optionKo')}
              checkedLabel={t('settings.language.optionEn')}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[12px] bg-surface-modal-container p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body-md-medium text-grey-900">
              {t('settings.startup.label')}
            </span>
            <span className="font-['Pretendard'] text-[11px] leading-[150%] text-grey-500">
              {startupDescription}
            </span>
            {startupError ? (
              <span className="font-['Pretendard'] text-[11px] leading-[150%] text-red-500">
                {startupError}
              </span>
            ) : null}
          </div>

          <NotificationToggleSwitch
            checked={isStartupEnabled}
            onChange={handleStartupToggle}
            isDisabled={
              isStartupLoading || isStartupSaving || !isStartupSupported
            }
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[12px] bg-surface-modal-container p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body-md-medium text-grey-900">
              {t('settings.update.label')}
            </span>
            <span className="font-['Pretendard'] text-[11px] leading-[150%] text-grey-500">
              {updateDescription}
            </span>
            {updateError ? (
              <span className="font-['Pretendard'] text-[11px] leading-[150%] text-red-500">
                {updateError}
              </span>
            ) : null}
          </div>

          {showUpdateAction ? (
            <Button
              text={updateActionLabel}
              variant="grey"
              size="xs"
              onClick={() => {
                void handleUpdateAction()
              }}
              disabled={isCheckingUpdate || isInstallingUpdate}
              className="shrink-0"
            />
          ) : null}
        </div>

        <div className="flex flex-col overflow-hidden rounded-[12px] bg-surface-modal-container">
          {actionItems.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={cn(
                "font-['Pretendard'] flex cursor-pointer items-center gap-2 px-3 py-[10px] text-left text-[12px] font-medium leading-[150%] text-grey-700 hover:bg-modal-button",
                index === actionItems.length - 1
                  ? ''
                  : 'border-b border-grey-50',
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <Button
          onClick={onClose}
          text={t('settings.close')}
          variant="primary"
          size="md"
          className="text-body-md-medium h-[43px] w-full"
        />
      </div>
    </Modal>
  )
}
