import MinusIcon from '@assets/main/minus_icon.svg?react'
import PlusIcon from '@assets/main/plus_icon.svg?react'
import { NotificationToggleSwitch } from '@shared/ui/toggle-switch'
import type { useTimeEditor } from '../hooks/useTimeEditor'

interface TimeControlSectionProps {
  title: string
  description: string
  isEnabled: boolean
  onToggle: () => void
  isDisabled?: boolean
  timeEditor: ReturnType<typeof useTimeEditor>
}

export const TimeControlSection = ({
  title,
  description,
  isEnabled,
  onToggle,
  isDisabled = false,
  timeEditor,
}: TimeControlSectionProps) => {
  return (
    <div
      className={`bg-surface-modal-container flex flex-col gap-1 rounded-[12px] p-3 ${isDisabled ? 'pointer-events-none' : ''}`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-body-lg-semibold text-grey-900">{title}</span>
        <NotificationToggleSwitch
          checked={isEnabled}
          onChange={onToggle}
          isDisabled={isDisabled}
        />
      </div>

      {/* 설명 */}
      <span className="text-caption-xs-meidum text-grey-400 mb-4">
        {description}
      </span>

      {/* 시간 조절 UI */}
      <div
        className={`flex items-center justify-center overflow-hidden rounded-[8px] border border-solid transition-colors ${
          timeEditor.isEditing
            ? 'border-sementic-brand-primary'
            : 'border-grey-50'
        } ${isDisabled || !isEnabled ? 'pointer-events-none' : ''}`}
      >
        {/* 감소 버튼 */}
        <button
          onClick={timeEditor.handlers.decreaseTime}
          disabled={isDisabled || !isEnabled || timeEditor.time <= 1}
          className="bg-modal-button flex h-10 w-10 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-20"
        >
          <MinusIcon className="[&_path]:stroke-grey-500" />
        </button>

        {/* 시간 표시/입력 */}
        {timeEditor.isEditing ? (
          <input
            ref={timeEditor.inputRef}
            type="text"
            value={timeEditor.tempTime}
            onChange={timeEditor.handlers.handleTimeChange}
            onKeyDown={timeEditor.handlers.handleTimeKeyDown}
            onBlur={timeEditor.handlers.handleTimeSubmit}
            className="bg-surface-modal text-body-md-meidum text-grey-900 h-10 text-center outline-none"
          />
        ) : (
          <div
            aria-disabled={isDisabled || !isEnabled}
            onClick={timeEditor.handlers.handleTimeClick}
            className="bg-surface-modal text-body-md-meidum text-grey-900 aria-disabled:bg-surface-modal aria-disabled:text-modal-disabled flex h-10 flex-1 cursor-pointer items-center justify-center"
          >
            {timeEditor.time}분
          </div>
        )}

        {/* 증가 버튼 */}
        <button
          onClick={timeEditor.handlers.increaseTime}
          disabled={isDisabled || !isEnabled || timeEditor.time >= 300}
          className="bg-modal-button flex h-10 w-10 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-20"
        >
          <PlusIcon className="[&_path]:stroke-grey-400" />
        </button>
      </div>
    </div>
  )
}
