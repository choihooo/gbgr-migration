/**
 * 보정 화면 - 웰컴 패널 (측정 시작 전 안내)
 *
 * 포팅 원본: src/renderer/src/pages/calibration-page/components/WelcomePanel.tsx
 * 변경점: isEngineAvailable=false 시 버튼 비활성화 + 미연결 안내 메시지 표시
 */

import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'

interface WelcomePanelProps {
  isPoseDetected: boolean
  onStartMeasurement: () => void
  isEngineAvailable?: boolean
}

const WelcomePanel = ({
  isPoseDetected,
  onStartMeasurement,
  isEngineAvailable = false,
}: WelcomePanelProps) => {
  const { t } = useTranslation()
  const username = localStorage.getItem('userName') || '사용자'

  return (
    <div className="flex w-full max-w-[422px] min-w-0 shrink-0 flex-col pt-4 xl:pt-12">
      <div className="mb-12">
        <h1 className="text-title-4xl-bold text-grey-900 mb-[20px]">
          바른자세 기준점 등록
        </h1>
        <p className="text-body-xl-medium text-grey-500 leading-relaxed">
          {username}님의 바른 자세를 등록할 준비가 되셨다면
          <br />
          측정하기 버튼을 눌러주세요.
        </p>
      </div>

      {!isEngineAvailable && (
        <div className="bg-yellow-50 rounded-[12px] p-4 mb-4">
          <p className="text-body-md-semibold text-grey-700">
            {t('onboarding.calibration.engineUnavailable')}
          </p>
          <p className="text-body-sm-regular text-grey-500 mt-1">
            {t('onboarding.calibration.engineUnavailableDescription')}
          </p>
        </div>
      )}

      <Button
        text={t('onboarding.calibration.measureButton')}
        className="text-body-xl-medium w-[149px]"
        size="xl"
        disabled={!isPoseDetected || !isEngineAvailable}
        onClick={onStartMeasurement}
      />
    </div>
  )
}

export default WelcomePanel
