/**
 * @legacy src/renderer/src/features/dashboard/ui/SettingsModal.tsx
 */

import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import {
  CalibrationResetIcon,
  LogoutIcon,
  WithdrawIcon,
} from '@/shared/ui/icons/option-icons'
import { Modal } from '@/shared/ui/modal'
import { NotificationToggleSwitch } from '@/shared/ui/toggle-switch'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const navigate = useNavigate()
  const markUnauthenticated = useAuthSessionStore(s => s.markUnauthenticated)

  const [isStartupEnabled, setIsStartupEnabled] = useState(false)
  const [isStartupSupported, setIsStartupSupported] = useState(true)
  const [isStartupLoading, setIsStartupLoading] = useState(true)
  const [isStartupSaving, setIsStartupSaving] = useState(false)
  const [startupError, setStartupError] = useState('')

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
          : '자동 실행 설정을 변경하지 못했습니다.'
      setStartupError(message)
      setIsStartupEnabled(!nextEnabled)
    } finally {
      setIsStartupSaving(false)
    }
  }

  const handleLogout = () => {
    markUnauthenticated()
    onClose()
    navigate('/auth/login', { replace: true })
  }

  const handleWithdraw = () => {
    const shouldProceed = window.confirm('정말 회원탈퇴 하시겠어요?')
    if (!shouldProceed) return

    // TODO: 회원탈퇴 API 연동 (withdrawMutation)
    markUnauthenticated()
    onClose()
    navigate('/auth/signup', { replace: true })
  }

  const handleCalibrationReset = () => {
    // TODO: 캘리브레이션 재설정 로직 연동 (requestCalibrationReset)
    onClose()
    navigate('/onboarding/init')
  }

  const startupDescription = isStartupLoading
    ? '현재 상태를 확인하고 있어요.'
    : !isStartupSupported
      ? '현재 운영체제에서는 지원하지 않아요.'
      : isStartupSaving
        ? '설정을 적용하고 있어요.'
        : '컴퓨터 로그인 후 거부기린을 자동으로 실행해요.'

  const actionItems = [
    { label: '로그아웃', icon: <LogoutIcon />, onClick: handleLogout },
    { label: '회원탈퇴', icon: <WithdrawIcon />, onClick: handleWithdraw },
    {
      label: '캘리브레이션 재설정',
      icon: <CalibrationResetIcon />,
      onClick: handleCalibrationReset,
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[339px]">
      <div className="flex flex-col gap-4 rounded-[24px] border border-grey-0 bg-white p-4 shadow-[0_0_24px_rgba(0,0,0,0.12)] dark:bg-grey-1000">
        <div className="rounded-[12px] bg-grey-25 p-3 dark:bg-grey-900">
          <h2 className="text-body-lg-semibold text-grey-900 dark:text-grey-100">
            설정
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[12px] bg-grey-25 p-3 dark:bg-grey-900">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body-md-medium text-grey-900 dark:text-grey-100">
              OS 시작 시 자동 실행
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

        <div className="flex flex-col overflow-hidden rounded-[12px] bg-grey-25 dark:bg-grey-900">
          {actionItems.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={cn(
                "font-['Pretendard'] flex cursor-pointer items-center gap-2 px-3 py-[10px] text-left text-[12px] font-medium leading-[150%] text-grey-700 hover:bg-grey-50 dark:text-grey-300 dark:hover:bg-grey-800",
                index === actionItems.length - 1
                  ? ''
                  : 'border-b border-grey-50 dark:border-grey-800',
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
          text="닫기"
          variant="primary"
          size="md"
          className="text-body-md-medium h-[43px] w-full"
        />
      </div>
    </Modal>
  )
}
