import type { ReactNode } from 'react'

import { usePosturePatternQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import type { PanelBaseProps } from '@/features/main-panels/model/types'
import { cn } from '@/shared/lib/cn'
import {
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  HourglassIcon,
  ThumbupIcon,
} from '@/shared/ui/icons/ui-icons'
import { PanelHeader } from '@/shared/ui/panel-header'

function formatTime(time?: string) {
  if (!time) return '오후 2시'
  const [hourText] = time.split(':')
  const hour = Number(hourText)
  const period = hour < 12 ? '오전' : '오후'
  return `${period} ${hour % 12 || 12}시`
}

function formatDay(day?: string) {
  const map: Record<string, string> = {
    MONDAY: '월요일',
    TUESDAY: '화요일',
    WEDNESDAY: '수요일',
    THURSDAY: '목요일',
    FRIDAY: '금요일',
    SATURDAY: '토요일',
    SUNDAY: '일요일',
  }

  return day ? (map[day] ?? day) : '수요일'
}

function PatternCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode
  title: string
  value: string
}) {
  return (
    <div className="bg-grey-25 flex h-full flex-col justify-between rounded-xl p-3">
      <div className="text-caption-sm-medium text-grey-400 mb-1 flex items-center gap-1">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-grey-600 text-headline-2xl-semibold">{value}</div>
    </div>
  )
}

export function PosePatternPanel({ className }: PanelBaseProps) {
  const { data } = usePosturePatternQuery()
  const posePattern = data?.data

  const worstTime = formatTime(posePattern?.worstTime)
  const worstDay = formatDay(posePattern?.worstDay)
  const recovery = `${posePattern?.recovery ?? 18}분`
  const stretching = posePattern?.stretching?.trim()
    ? posePattern.stretching
    : '목돌리기'

  return (
    <section
      className={cn('flex h-full min-h-0 flex-col gap-3 p-4', className)}
    >
      <PanelHeader>자세 패턴 분석</PanelHeader>

      <div className="bg-grey-25 flex shrink-0 flex-col gap-3 rounded-2xl p-3">
        <div className="text-caption-sm-medium flex items-center justify-between text-yellow-400">
          <span>TIP</span>
          <ChevronRightIcon className="h-4 w-4" />
        </div>
        <div className="text-grey-600 text-caption-sm-medium">
          {worstDay} {worstTime}에 자세가 급격히 나빠져요! 이 시간대에 맞춰
          스트레칭 알림을 설정해드릴까요?
        </div>
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2">
        <PatternCard
          icon={<ClockIcon className="text-grey-200 h-5 w-5" />}
          title="안좋은 시간"
          value={worstTime}
        />
        <PatternCard
          icon={<CalendarIcon className="text-grey-200 h-5 w-5" />}
          title="안좋은 요일"
          value={worstDay}
        />
        <PatternCard
          icon={<HourglassIcon className="text-grey-200 h-5 w-5" />}
          title="회복까지 평균"
          value={recovery}
        />
        <PatternCard
          icon={<ThumbupIcon className="text-grey-200 h-5 w-5" />}
          title="추천 스트레칭"
          value={stretching}
        />
      </div>
    </section>
  )
}
