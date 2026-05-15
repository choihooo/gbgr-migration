/**
 * 보정 화면 - 측정 중 패널
 *
 * 포팅 원본: src/renderer/src/pages/calibration-page/components/MeasuringPanel.tsx
 */
import { NotificateMessage } from '@/shared/ui/notification-message'

interface MeasuringPanelProps {
  step1Error?: string | null
  step2Error?: string | null
  engineMessage?: string | null
}

const MeasuringPanel = ({
  step1Error,
  step2Error,
  engineMessage,
}: MeasuringPanelProps) => {
  return (
    <div className="flex w-full max-w-[544px] min-w-0 shrink-0 flex-col pt-4 xl:pt-12">
      <div className="mb-12">
        <h1 className="text-title-4xl-bold text-grey-900 mb-[20px]">
          바른자세 기준점 등록
        </h1>
        <div className="flex flex-col gap-4">
          <NotificateMessage
            message="의자에 편안히 앉아 허리를 펴고 턱을 당겨주세요"
            step={1}
            variant={step1Error ? 'default' : 'success'}
            errorMessage={step1Error || undefined}
          />
          <NotificateMessage
            message="화면의 가이드에 맞춰 바르다고 생각하는 자세를 5초간 유지해주세요"
            step={2}
            variant={step1Error || step2Error ? 'default' : 'success'}
            errorMessage={step2Error || undefined}
          />
          {engineMessage ? (
            <NotificateMessage
              message={engineMessage}
              step={3}
              variant="default"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default MeasuringPanel
