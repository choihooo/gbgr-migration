import * as React from 'react'

import CalendarIcon from '@assets/common/icons/calendar.svg?react'
import ChevronRigthIcon from '@assets/common/icons/chevron-right.svg?react'
import ClockIcon from '@assets/common/icons/clock.svg?react'
import GlassHourIcon from '@assets/common/icons/hourglass.svg?react'
import TumbupIcon from '@assets/common/icons/thumbup.svg?react'
import { usePosturePatternQuery } from '@entities/dashboard'
import { PannelHeader } from '@shared/ui/panel-header'

// 시간 형식 변환: "14:00:00" -> "오후 2시"
const formatTime = (timeStr: string): string => {
  const [hours] = timeStr.split(':').map(Number)
  const hour12 = hours % 12 || 12
  const period = hours < 12 ? '오전' : '오후'
  return `${period} ${hour12}시`
}

// 요일 변환: "FRIDAY" -> "금요일"
const formatDay = (dayStr: string): string => {
  const dayMap: Record<string, string> = {
    MONDAY: '월요일',
    TUESDAY: '화요일',
    WEDNESDAY: '수요일',
    THURSDAY: '목요일',
    FRIDAY: '금요일',
    SATURDAY: '토요일',
    SUNDAY: '일요일',
  }
  return dayMap[dayStr] || dayStr
}

type PatternHeaderIcon = 'thumb' | 'clock' | 'calendar' | 'hourglass'

interface PatternHeaderProps {
  children?: React.ReactNode
  icon: PatternHeaderIcon
  className?: string
  iconSize?: number
}

const iconMap: Record<
  PatternHeaderIcon,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  thumb: TumbupIcon,
  clock: ClockIcon,
  calendar: CalendarIcon,
  hourglass: GlassHourIcon,
}

const PatternHeader = React.forwardRef<HTMLDivElement, PatternHeaderProps>(
  ({ children, icon, className, iconSize = 20 }, ref) => {
    const IconComp = iconMap[icon]

    return (
      <div
        ref={ref}
        className={`text-caption-sm-medium text-grey-400 flex items-center gap-1 ${className ?? ''}`}
      >
        <span
          className="bg-grey-50 inline-flex items-center justify-center rounded-full"
          style={{ width: iconSize, height: iconSize }}
        >
          <IconComp
            className="text-grey-200 [&_*]:fill-none [&_line]:stroke-current"
            style={{ width: iconSize, height: iconSize }}
            aria-hidden
          />
        </span>
        <span>{children}</span>
      </div>
    )
  },
)
PatternHeader.displayName = 'PatternHeader'

const PosePatternPanel = () => {
  const { data: patternData } = usePosturePatternQuery()

  const worstTime = patternData?.data.worstTime
    ? formatTime(patternData.data.worstTime)
    : '오후 2시'
  const worstDay = patternData?.data.worstDay
    ? formatDay(patternData.data.worstDay)
    : '수요일'
  const recovery = patternData?.data.recovery ?? 18
  const stretching = patternData?.data.stretching ?? '목돌리기'

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <PannelHeader>자세 패턴 분석</PannelHeader>

      <div className="bg-grey-25 flex shrink-0 flex-col gap-3 rounded-2xl p-3">
        <div className="text-caption-sm-medium flex items-center justify-between text-yellow-400">
          TIP <ChevronRigthIcon className="stroke-current" />
        </div>
        <div className="text-grey-600 text-caption-sm-medium">
          {worstDay} {worstTime}에 자세가 급격히 나빠져요! 이 시간대에 맞춰{' '}
          스트레칭 알림을 설정해드릴까요?
        </div>
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2">
        <div className="bg-grey-25 flex h-full flex-col justify-between rounded-xl p-3">
          <PatternHeader icon="clock" className="mb-1">
            안좋은 시간
          </PatternHeader>
          <div className="text-grey-600 text-headline-2xl-semibold">
            {worstTime}
          </div>
        </div>

        <div className="bg-grey-25 flex h-full flex-col justify-between rounded-xl p-3">
          <PatternHeader icon="calendar" className="mb-1">
            안좋은 요일
          </PatternHeader>
          <div className="text-grey-600 text-headline-2xl-semibold">
            {worstDay}
          </div>
        </div>

        <div className="bg-grey-25 flex h-full flex-col justify-between rounded-xl p-3">
          <PatternHeader icon="hourglass" className="mb-1">
            회복까지 평균
          </PatternHeader>
          <div className="text-grey-600 text-headline-2xl-semibold">
            {recovery}분
          </div>
        </div>

        <div className="bg-grey-25 flex h-full flex-col justify-between rounded-xl p-3">
          <PatternHeader icon="thumb" className="mb-1">
            추천 스트레칭
          </PatternHeader>
          <div className="text-grey-600 text-headline-2xl-semibold">
            {stretching}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PosePatternPanel
