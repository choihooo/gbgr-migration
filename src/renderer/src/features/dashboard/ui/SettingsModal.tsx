import CalibrationResetIcon from '@assets/option/CalibrationResetIcon.svg?react'
import LogoutIcon from '@assets/option/LogoutIcon.svg?react'
import WithdrawIcon from '@assets/option/WithdrawIcon.svg?react'
import { useWithdrawMutation } from '@entities/user'
import { clearAnalyticsFlags } from '@shared/lib/analytics'
import {
  clearCalibrationGate,
  requestCalibrationReset,
} from '@shared/lib/calibration-gate'
import { parseErrorMessage } from '@shared/lib/error/parse-error'
import { Button } from '@shared/ui/button'
import { ModalPortal } from '@shared/ui/modal'
import { NotificationToggleSwitch } from '@shared/ui/toggle-switch'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface SettingsModalProps {
  onClose: () => void
}

const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const navigate = useNavigate()
  const withdrawMutation = useWithdrawMutation()
  const [isStartupEnabled, setIsStartupEnabled] = useState(false)
  const [isStartupSupported, setIsStartupSupported] = useState(true)
  const [isStartupLoading, setIsStartupLoading] = useState(true)
  const [isStartupSaving, setIsStartupSaving] = useState(false)
  const [startupError, setStartupError] = useState('')

  useEffect(() => {
    let isMounted = true

    const syncStartupSettings = async () => {
      if (!window.electronAPI?.startup) {
        if (!isMounted) return

        setIsStartupEnabled(false)
        setIsStartupSupported(false)
        setStartupError('')
        setIsStartupLoading(false)
        setIsStartupSaving(false)
        return
      }

      try {
        const result = await window.electronAPI.startup.get()
        if (!isMounted) return

        setIsStartupEnabled(result.enabled)
        setIsStartupSupported(result.supported)
        setStartupError(result.success ? '' : (result.error ?? ''))
      } catch (error: unknown) {
        if (!isMounted) return

        setIsStartupEnabled(false)
        setIsStartupSupported(true)
        setStartupError(parseErrorMessage(error))
      } finally {
        if (!isMounted) return
        setIsStartupLoading(false)
        setIsStartupSaving(false)
      }
    }

    void syncStartupSettings()

    return () => {
      isMounted = false
    }
  }, [])

  const clearLocalAuthData = (
    userId: string | null,
    clearCalibration: boolean,
  ) => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('sessionId')
    localStorage.removeItem('sessionStartAt')
    localStorage.removeItem('sessionStartDistance')
    localStorage.removeItem('lastSessionId')
    localStorage.removeItem('widgetVisibleStartAt')
    localStorage.removeItem('mainWindowActiveAt')

    // GA 플래그 클린업
    clearAnalyticsFlags()

    if (clearCalibration) {
      localStorage.removeItem('calibration_result_v1')
      clearCalibrationGate(userId)
    }
  }

  const handleLogout = () => {
    const userId = localStorage.getItem('userId')
    clearLocalAuthData(userId, false)
    onClose()
    navigate('/auth/login', { replace: true })
  }

  const handleWithdraw = async () => {
    if (withdrawMutation.isPending) return

    const shouldProceed = window.confirm('정말 회원탈퇴 하시겠어요?')
    if (!shouldProceed) return

    try {
      await withdrawMutation.mutateAsync()

      const userId = localStorage.getItem('userId')
      clearLocalAuthData(userId, true)
      onClose()
      navigate('/auth/signup', { replace: true })
      alert('회원탈퇴가 완료되었습니다.')
    } catch (error: unknown) {
      console.error('회원탈퇴 실패:', error)
      alert(parseErrorMessage(error))
    }
  }

  const handleCalibrationReset = () => {
    const userId = localStorage.getItem('userId')
    requestCalibrationReset(userId)
    onClose()
    navigate('/onboarding/init')
  }

  const handleStartupToggle = async (nextEnabled: boolean) => {
    if (isStartupLoading || isStartupSaving || !isStartupSupported) return

    setIsStartupEnabled(nextEnabled)
    setIsStartupSaving(true)
    setStartupError('')

    try {
      const result = await window.electronAPI.startup.set(nextEnabled)

      setIsStartupEnabled(result.enabled)
      setIsStartupSupported(result.supported)

      if (!result.success) {
        const message = result.error ?? '자동 실행 설정을 변경하지 못했습니다.'
        setStartupError(message)
        alert(message)
      }
    } catch (error: unknown) {
      const message = parseErrorMessage(error)
      setStartupError(message)
      setIsStartupEnabled(!nextEnabled)
      alert(message)
    } finally {
      setIsStartupSaving(false)
    }
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
    {
      label: '회원탈퇴',
      icon: <WithdrawIcon />,
      onClick: handleWithdraw,
      disabled: withdrawMutation.isPending,
    },
    {
      label: '캘리브레이션 재설정',
      icon: <CalibrationResetIcon />,
      onClick: handleCalibrationReset,
    },
  ]

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-999999 flex h-full w-full items-center justify-center bg-black/40 dark:bg-black/70"
        onClick={onClose}
      >
        <div
          className="bg-surface-modal border-grey-0 flex w-[339px] flex-col gap-4 rounded-[24px] border p-4 shadow-[0_0_24px_rgba(0,0,0,0.12)]"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-surface-modal-container rounded-[12px] p-3">
            <h2 className="text-body-lg-semibold text-grey-900">설정</h2>
          </div>

          <div className="bg-surface-modal-container flex items-center justify-between gap-3 rounded-[12px] p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-body-md-medium text-grey-900">
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

          <div className="bg-surface-modal-container flex flex-col overflow-hidden rounded-[12px]">
            {actionItems.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                className={`font-['Pretendard'] text-[12px] leading-[150%] font-medium text-grey-700 hover:bg-grey-25 flex cursor-pointer items-center gap-2 px-3 py-[10px] text-left ${
                  item.disabled ? 'cursor-not-allowed opacity-60' : ''
                } ${
                  index === actionItems.length - 1
                    ? ''
                    : 'border-grey-50 border-b'
                }`}
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
      </div>
    </ModalPortal>
  )
}

export default SettingsModal
