/**
 * @legacy src/renderer/src/features/notification/ui/components/TimeControlSection.tsx
 */

import type { SVGProps } from 'react'
import { cn } from '@/shared/lib/cn'
import { NotificationToggleSwitch } from '@/shared/ui/toggle-switch'
import type { useTimeEditor } from '../../lib/use-time-editor'

function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="시간 감소"
      {...props}
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="시간 증가"
      {...props}
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface TimeControlSectionProps {
  title: string
  description: string
  isEnabled: boolean
  onToggle: () => void
  isDisabled?: boolean
  timeEditor: ReturnType<typeof useTimeEditor>
}

export function TimeControlSection({
  title,
  description,
  isEnabled,
  onToggle,
  isDisabled = false,
  timeEditor,
}: TimeControlSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-[12px] bg-grey-25 p-3 dark:bg-grey-900',
        isDisabled ? 'pointer-events-none' : '',
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-body-lg-semibold text-grey-900 dark:text-grey-100">
          {title}
        </span>
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
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-[8px] border border-solid transition-colors',
          timeEditor.isEditing
            ? 'border-sementic-brand-primary'
            : 'border-grey-50 dark:border-grey-800',
          isDisabled || !isEnabled ? 'pointer-events-none' : '',
        )}
      >
        {/* 감소 버튼 */}
        <button
          onClick={timeEditor.handlers.decreaseTime}
          disabled={isDisabled || !isEnabled || timeEditor.time <= 1}
          className="flex h-10 w-10 cursor-pointer items-center justify-center bg-white disabled:cursor-not-allowed disabled:opacity-20 dark:bg-grey-800"
        >
          <MinusIcon className="text-grey-500" />
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
            className="h-10 text-center text-body-md-meidum text-grey-900 outline-none dark:bg-grey-800 dark:text-grey-100"
          />
        ) : (
          <button
            type="button"
            disabled={isDisabled || !isEnabled}
            onClick={timeEditor.handlers.handleTimeClick}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center text-body-md-meidum text-grey-900 dark:text-grey-100"
          >
            {timeEditor.time}분
          </button>
        )}

        {/* 증가 버튼 */}
        <button
          onClick={timeEditor.handlers.increaseTime}
          disabled={isDisabled || !isEnabled || timeEditor.time >= 300}
          className="flex h-10 w-10 cursor-pointer items-center justify-center bg-white disabled:cursor-not-allowed disabled:opacity-20 dark:bg-grey-800"
        >
          <PlusIcon className="text-grey-400" />
        </button>
      </div>
    </div>
  )
}
