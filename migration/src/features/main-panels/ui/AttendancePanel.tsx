/**
 * 출석 현황 패널
 * @legacy src/renderer/src/features/dashboard/ui/AttendacePanel.tsx
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAttendanceQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { cn } from '@/shared/lib/cn'
import {
  ArrowNarrowDownIcon,
  ArrowNarrowUpIcon,
  ChevronRightIcon,
} from '@/shared/ui/icons/ui-icons'
import { PanelHeader } from '@/shared/ui/panel-header'
import { ToggleSwitch } from '@/shared/ui/toggle-switch'

const LEVEL_COLORS = [
  'bg-yellow-100',
  'bg-yellow-200',
  'bg-yellow-300',
  'bg-yellow-400',
  'bg-yellow-500',
] as const

function getLevelFromMinutes(minutes?: number | null) {
  if (!minutes) return null
  const hours = minutes / 60
  if (hours <= 1) return 1
  if (hours < 2) return 2
  if (hours < 3) return 3
  if (hours < 4) return 4
  return 5
}

function getMessage(subContent: string | undefined, t: (key: string) => string) {
  if (!subContent) {
    return t('dashboard.panels.attendance.fallbackMessage')
  }

  const map: Record<string, string> = {
    뽀각거부기: t('dashboard.panels.attendance.level1'),
    꾸부정거부기: t('dashboard.panels.attendance.level2'),
    아기기린: t('dashboard.panels.attendance.level3'),
    쑥쑥기린: t('dashboard.panels.attendance.level4'),
    꽃꼿기린: t('dashboard.panels.attendance.level5'),
  }

  return map[subContent] ?? subContent
}

function AttendanceDot({
  level,
  today,
  future,
}: {
  level: number | null
  today: boolean
  future: boolean
}) {
  if (future) {
    return (
      <div className="border-bg-line h-[18px] w-[18px] rounded-full border bg-transparent" />
    )
  }

  const colorClass = level ? LEVEL_COLORS[level - 1] : 'bg-grey-50'

  return (
    <div
      className={cn(
        'h-[18px] w-[18px] rounded-full',
        colorClass,
        today && 'ring-offset-grey-0 ring-2 ring-yellow-500 ring-offset-2',
      )}
    />
  )
}

export function AttendancePanel() {
  const { t } = useTranslation()
  const days = [
    t('dashboard.panels.attendance.sunday'),
    t('dashboard.panels.attendance.monday'),
    t('dashboard.panels.attendance.tuesday'),
    t('dashboard.panels.attendance.wednesday'),
    t('dashboard.panels.attendance.thursday'),
    t('dashboard.panels.attendance.friday'),
    t('dashboard.panels.attendance.saturday'),
  ] as const
  const today = new Date()
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), 1)
  const [viewDate, setViewDate] = useState(normalizedToday)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const { data } = useAttendanceQuery({
    period: 'MONTHLY',
    year,
    month: month + 1,
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const trailing = totalCells - (firstDay + daysInMonth)
  const dates = [
    ...Array.from({ length: firstDay }, (_, index) => ({
      key: `leading-${year}-${month}-${index}`,
      day: null as number | null,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      key: `${year}-${month + 1}-${index + 1}`,
      day: index + 1,
    })),
    ...Array.from({ length: trailing }, (_, index) => ({
      key: `trailing-${year}-${month}-${index}`,
      day: null as number | null,
    })),
  ]

  const isCurrentMonth =
    year === normalizedToday.getFullYear() &&
    month === normalizedToday.getMonth()

  return (
    <section className="grid h-full w-full grid-cols-4 grid-rows-[57px_1fr_1fr_1fr] gap-2 p-4">
      <div className="flex flex-col">
        <PanelHeader>{t('dashboard.panels.attendance.title')}</PanelHeader>
        <div className="text-headline-3xl-semibold text-grey-700">
          {t('dashboard.panels.attendance.month', { value: month + 1 })}
        </div>
      </div>

      <div className="flex items-end justify-end p-[9px]">
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-grey-25 text-grey-400 flex h-7 w-7 items-center justify-center rounded-full"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            aria-label={t('dashboard.panels.attendance.previousMonth')}
          >
            <ChevronRightIcon className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            className="bg-grey-25 text-grey-400 flex h-7 w-7 items-center justify-center rounded-full disabled:text-grey-200"
            onClick={() =>
              setViewDate(
                isCurrentMonth ? normalizedToday : new Date(year, month + 1, 1),
              )
            }
            aria-label={t('dashboard.panels.attendance.nextMonth')}
            disabled={isCurrentMonth}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div />

      <div className="flex flex-col items-end justify-end gap-3">
        <ToggleSwitch
          uncheckedLabel={t('dashboard.panels.attendance.weekly')}
          checkedLabel={t('dashboard.panels.attendance.yearly')}
          checked={false}
          onChange={() => {}}
        />
        <div className="text-caption-2xs-medium text-grey-300 flex items-center gap-2">
          <span>{t('dashboard.panels.attendance.less')}</span>
          <div className="flex gap-1">
            {LEVEL_COLORS.map(color => (
              <span key={color} className={cn('h-2 w-4 rounded-full', color)} />
            ))}
          </div>
          <span>{t('dashboard.panels.attendance.more')}</span>
        </div>
      </div>

      <div className="col-span-2 row-span-3">
        <div className="h-[150px] w-full">
          <div className="text-grey-400 text-caption-2xs-medium grid grid-cols-7 gap-x-1 text-center">
            {days.map((day, index) => (
              <div
                key={day}
                className={index === 0 ? 'text-point-red' : undefined}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="mt-[5px] grid h-full grid-cols-7 gap-x-1 gap-y-1 text-center">
            {dates.map(({ key, day }) => {
              if (day === null) {
                return <div key={key} />
              }

              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const level = getLevelFromMinutes(
                data?.data.attendances?.[dateKey],
              )
              const future =
                year > today.getFullYear() ||
                (year === today.getFullYear() && month > today.getMonth()) ||
                (year === today.getFullYear() &&
                  month === today.getMonth() &&
                  day > today.getDate())

              return (
                <div key={dateKey} className="flex items-center justify-center">
                  <AttendanceDot
                    level={level}
                    today={
                      year === today.getFullYear() &&
                      month === today.getMonth() &&
                      day === today.getDate()
                    }
                    future={future}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-grey-25 col-span-2 row-span-3 rounded-xl p-3">
        <div className="mb-2 flex h-[76px] flex-col gap-3">
          <div className="text-grey-700 text-body-md-semibold">
            {data?.data.title ?? t('dashboard.panels.attendance.fallbackTitle')}
          </div>
          <div className="text-caption-xs-regular text-grey-600 flex flex-col gap-1">
            {data?.data.content1 ? (
              <div className="flex items-center gap-1">
                <ArrowNarrowUpIcon className="text-point-green" />
                {data.data.content1}
              </div>
            ) : null}
            {data?.data.content2 ? (
              <div className="flex items-center gap-1">
                <ArrowNarrowDownIcon className="text-point-red" />
                {data.data.content2}
              </div>
            ) : null}
          </div>
        </div>
        <div className="bg-grey-50 h-px w-full" />
        <div className="text-grey-500 text-caption-sm-medium flex h-[calc(100%-84px)] items-center">
          {getMessage(data?.data.subContent, t)}
        </div>
      </div>
    </section>
  )
}
