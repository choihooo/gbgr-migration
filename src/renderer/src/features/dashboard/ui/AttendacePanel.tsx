import DownIcon from '@assets/common/icons/arrow-narrow-down.svg?react'
import UpIcon from '@assets/common/icons/arrow-narrow-up.svg?react'
import { useAttendanceQuery } from '@entities/dashboard'
import { IntensitySlider } from '@shared/ui/intensity-slider'
import { PageMoveButton } from '@shared/ui/page-move-button'
import { PannelHeader } from '@shared/ui/panel-header'
import { ToggleSwitch } from '@shared/ui/toggle-switch'
import { useState } from 'react'

type CalendarProps = {
  year: number
  month: number // month: 0~11
  attendances?: Record<string, number> // 날짜별 레벨 값
}

interface CircleProps {
  level: number | null // 1~5 또는 null (데이터 없음)
  today: boolean
  future: boolean
}

// 사용시간 0~1시간: 가장 연한 노란색
// 1 초과~2 시간 미만: 2단계 노랑
// 2 시간 이상~3 시간 미만: 3단계 노랑
// 3 이상~4 미만 : 4단계 노랑
// 4 이상 ~: 5단계 노랑
const LEVEL_COLORS = [
  'bg-yellow-100', // 1레벨 (0~1시간): 가장 연한 노란색
  'bg-yellow-200', // 2레벨 (1 초과~2 시간 미만): 2단계 노랑
  'bg-yellow-300', // 3레벨 (2 시간 이상~3 시간 미만): 3단계 노랑
  'bg-yellow-400', // 4레벨 (3 이상~4 미만): 4단계 노랑
  'bg-yellow-500', // 5레벨 (4 이상): 5단계 노랑 (가장 진한 노란색)
] as const

/**
 * 사용 시간(시간 단위)에 따라 레벨(1~5)을 반환합니다.
 * @param hours 사용 시간 (시간 단위)
 * @returns 레벨 1~5
 */
const getLevelFromHours = (hours: number): number => {
  if (hours <= 1) return 1 // 0~1시간: 레벨 1
  if (hours < 2) return 2 // 1 초과~2 시간 미만: 레벨 2
  if (hours < 3) return 3 // 2 시간 이상~3 시간 미만: 레벨 3
  if (hours < 4) return 4 // 3 이상~4 미만: 레벨 4
  return 5 // 4 이상: 레벨 5
}

const Circle = ({ level, today, future }: CircleProps) => {
  // 미래 날짜
  if (future) {
    return (
      <div className="border-bg-line h-[18px] w-[18px] rounded-full border bg-transparent" />
    )
  }

  // 데이터 없는 날 (안 사용한 날)
  if (!level) {
    return (
      <div
        className={[
          'bg-grey-50 h-[18px] w-[18px] rounded-full',
          today
            ? 'ring-offset-grey-0 ring-2 ring-yellow-500 ring-offset-2'
            : '',
        ].join(' ')}
      />
    )
  }

  // 데이터 있는 날 (레벨 색 Circle)
  const clampedLevel = Math.min(Math.max(level, 1), LEVEL_COLORS.length)
  const colorClass = LEVEL_COLORS[clampedLevel - 1]

  return (
    <div
      className={[
        'h-[18px] w-[18px] rounded-full',
        colorClass,
        today ? 'ring-offset-grey-0 ring-2 ring-yellow-500 ring-offset-2' : '',
      ].join(' ')}
    />
  )
}

const Calendar = ({ year, month, attendances = {} }: CalendarProps) => {
  const days = ['일', '월', '화', '수', '목', '금', '토']

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 7의 배수 칸으로 맞추기 (마지막 주 패딩)
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7
  const trailing = totalCells - (firstDayOfMonth + daysInMonth)

  const calendarDays: (number | null)[] = [
    ...(Array(firstDayOfMonth).fill(null) as (number | null)[]),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...(Array(trailing).fill(null) as (number | null)[]),
  ]

  // 오늘 정보
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()

  // API 데이터에서 날짜별 레벨 가져오기
  const getLevelForDay = (day: number): number | null => {
    // 날짜를 YYYY-MM-DD 형식으로 변환
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const usageMinutes = attendances[dateStr]

    // 사용 시간이 없거나 0이면 null (안 사용한 날 - 그레이로 표시)
    if (
      usageMinutes === undefined ||
      usageMinutes === null ||
      usageMinutes === 0
    ) {
      return null
    }

    // 분을 시간으로 변환
    const usageHours = usageMinutes / 60

    // 사용 시간에 따라 레벨 결정 (1~5)
    return getLevelFromHours(usageHours)
  }

  const isFutureDay = (day: number) => {
    // 같은 달 기준으로 오늘 이후
    if (year > todayYear) return true
    if (year === todayYear && month > todayMonth) return true
    if (year === todayYear && month === todayMonth && day > todayDate)
      return true
    return false
  }

  return (
    <div className="h-[150px] w-full">
      {/* 요일 헤더 */}
      <div className="text-grey-400 text-caption-2xs-medium grid grid-cols-7 gap-x-1 text-center">
        {days.map((day, i) => (
          <div key={day} className={i === 0 ? 'text-point-red' : undefined}>
            {day}
          </div>
        ))}
      </div>

      {/* 이번 달 칸만 동그라미 */}
      <div className="mt-[5px] grid h-full grid-cols-7 gap-x-1 gap-y-1 text-center">
        {calendarDays.map((day, index) => (
          <div key={index} className="flex items-center justify-center">
            {day !== null && (
              <Circle
                level={getLevelForDay(day)}
                today={
                  year === todayYear &&
                  month === todayMonth &&
                  day === todayDate
                }
                future={isFutureDay(day)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// subContent 값에 따른 메시지 매핑
const getSubContentMessage = (subContent?: string): string => {
  if (!subContent) {
    return '당신은 매일 골든리트리버 한 마리를 목에 업고 작업한 것과 같아요 🥺'
  }

  const messageMap: Record<string, string> = {
    뽀각거부기: '뚠뚠한 골든리트리버 한 마리를 매일 목에 업고 있어요 🐶',
    꾸부정거부기: '기내용 캐리어를 목 위에 올려두고 앉아 있는 셈이에요 🧳',
    아기기린: '무거운 볼링공을 목에 걸고 일하는 중이에요 🎳',
    쑥쑥기린: '작은 수박 한 통 정도를 목에 얹은 상태예요 🍉',
    꽃꼿기린: '머리 본연의 무게만 딱! 지금 아주 좋아요 🌸',
  }

  return messageMap[subContent] || subContent
}

const AttendacePanel = () => {
  // 오늘 월(1일)로 정규화
  const today = new Date()
  const todayYm = new Date(today.getFullYear(), today.getMonth(), 1)

  const [viewDate, setViewDate] = useState<Date>(todayYm)
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth() // 0~11

  // API 호출
  const { data: attendanceData } = useAttendanceQuery({
    period: 'MONTHLY',
    year: viewYear,
    month: viewMonth + 1, // API는 1~12월 사용
  })

  const clampToTodayMonth = (d: Date) => {
    const y = d.getFullYear()
    const m = d.getMonth()
    const ty = todayYm.getFullYear()
    const tm = todayYm.getMonth()
    if (y > ty || (y === ty && m > tm)) return todayYm // 미래 달로 못감
    return d
  }

  const addMonthsSafe = (base: Date, delta: number) =>
    clampToTodayMonth(new Date(base.getFullYear(), base.getMonth() + delta, 1))

  const isAtCurrentMonth =
    viewYear === todayYm.getFullYear() && viewMonth === todayYm.getMonth()

  return (
    <div className="grid h-full w-full grid-cols-4 grid-rows-[57px_1fr_1fr_1fr] gap-2 p-4">
      <div className="flex flex-col">
        <PannelHeader>출석 현황</PannelHeader>
        <div className="text-headline-3xl-semibold text-grey-700">
          {viewMonth + 1}월
        </div>
      </div>

      {/* ←/→ 월 이동 버튼 */}
      <div className="flex items-end justify-end p-[9px]">
        <div className="flex gap-2">
          <PageMoveButton
            direction="prev"
            onClick={() => setViewDate(d => addMonthsSafe(d, -1))}
          />
          <PageMoveButton
            direction="next"
            onClick={() => setViewDate(d => addMonthsSafe(d, +1))}
            disabled={isAtCurrentMonth}
          />
        </div>
      </div>

      <div />

      <div className="flex flex-col items-end justify-end gap-3">
        <ToggleSwitch
          uncheckedLabel="월간"
          checkedLabel="연간"
          checked={false}
          onChange={() => {}}
        />
        <IntensitySlider leftLabel="Less" rightLabel="More" />
      </div>

      <div className="col-span-2 row-span-3">
        <Calendar
          year={viewYear}
          month={viewMonth}
          attendances={attendanceData?.data.attendances}
        />
      </div>

      <div className="bg-grey-25 col-span-2 row-span-3 rounded-xl p-3">
        <div className="mb-2 flex h-[76px] flex-col gap-3">
          <div className="text-grey-700 text-body-md-semibold">
            {attendanceData?.data.title || '잘하고 있어요!'}
          </div>
          <div className="text-caption-xs-regular text-grey-600 flex flex-col gap-1">
            {attendanceData?.data.content1 && (
              <div className="flex items-center gap-1">
                <UpIcon />
                {attendanceData.data.content1}
              </div>
            )}
            {attendanceData?.data.content2 && (
              <div className="flex items-center gap-1">
                <DownIcon />
                {attendanceData.data.content2}
              </div>
            )}
          </div>
        </div>
        <div className="bg-grey-50 h-px w-full" />
        <div className="text-grey-500 text-caption-sm-medium flex h-[calc(100%-84px)] w-full items-center">
          {getSubContentMessage(attendanceData?.data.subContent)}
        </div>
      </div>
    </div>
  )
}

export default AttendacePanel
