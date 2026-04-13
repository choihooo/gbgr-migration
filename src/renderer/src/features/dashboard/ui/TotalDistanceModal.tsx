import { Button } from '@shared/ui/button'
import { ModalPortal } from '@shared/ui/modal'
import CharacterSpeedRow from './CharacterSpeedRow'
import { CHARACTER_SPEED_DATA } from './CharacterSpeedRow/constants'

interface TotalDistanceModalProps {
  onClose: () => void
}

const TotalDistanceModal = ({ onClose }: TotalDistanceModalProps) => {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-999999 flex h-full w-full items-center justify-center bg-black/40 dark:bg-black/70"
        onClick={onClose}
      >
        <div
          className="bg-surface-modal border-grey-0 flex flex-col gap-4 rounded-[24px] border p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex w-[438px] flex-col px-4">
            <h2 className="text-body-lg-semibold text-grey-900 mb-6 text-center max-[1439px]:mb-4">
              캐릭터별 속도 소개
            </h2>
            <div className="flex flex-col gap-1">
              <div className="text-grey-300 text-caption-xs-regular flex justify-between">
                <div className="w-25">자세 상태</div>
                <div className="w-[150px] text-center">캐릭터</div>
                <div className="w-[58px] text-right">시간당 속도</div>
              </div>
              <div className="bg-bg-line my-2 h-px w-full" />
              <div className="text-caption-xs-meidum flex w-full flex-col gap-3 text-gray-500 max-[1439px]:gap-1">
                {CHARACTER_SPEED_DATA.map(character => (
                  <CharacterSpeedRow
                    key={character.level}
                    level={character.level}
                    name={character.name}
                    speed={character.speed}
                  />
                ))}
              </div>
            </div>
          </div>
          <Button
            onClick={onClose}
            text="닫기"
            variant="primary"
            size="md"
            className="mt-2 max-[1439px]:mt-0"
          />
        </div>
      </div>
    </ModalPortal>
  )
}

export default TotalDistanceModal
