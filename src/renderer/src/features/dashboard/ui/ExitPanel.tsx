import { useLevelQuery } from '@entities/dashboard'
import { useSessionReportQuery } from '@entities/session'
import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

const ExitPanel = () => {
  const [sessionId, setSessionId] = useState<string | null>(null)

  // localStorage에서 sessionId 가져오기 (없으면 lastSessionId 사용)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const id =
      localStorage.getItem('sessionId') || localStorage.getItem('lastSessionId')
    if (id && id !== sessionId) {
      setSessionId(id)
    }
  }, [sessionId])

  // 세션 리포트 조회
  const { data, isLoading, error } = useSessionReportQuery(sessionId)

  // 현재 이동거리 조회
  const { data: levelData } = useLevelQuery()

  // CSS 변수에서 색상 가져오기
  const getColor = (cssVar: string, fallback: string) => {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim() || fallback
    )
  }

  // 세션 조회 API 데이터 사용
  const totalSeconds = data?.data.totalSeconds || 0
  const goodSeconds = data?.data.goodSeconds || 0

  const totalTime = Math.round(totalSeconds / 60) // 초를 분으로 변환

  // 비율은 초 단위로 먼저 계산 후 반올림 (정확도 향상)
  const correctPosturePercentage =
    totalSeconds > 0 ? Math.round((goodSeconds / totalSeconds) * 100) : 0

  const score = data?.data.score || 0 // 바른 자세 점수

  /* 이번 세션에서 이동한 거리 계산 */
  const currentDistance = levelData?.data.current || 0
  const startDistance = Number.parseInt(
    localStorage.getItem('sessionStartDistance') || '0',
    10,
  )
  const sessionDistance = Math.max(
    0,
    currentDistance - startDistance,
  ) /* 오늘 이동거리 */

  // CSS 변수에서 색상 가져오기 (다크모드 변경 시 재계산)
  const colors = useMemo(
    () => ({
      time: getColor('--color-yellow-400', '#ffcb31'),
      background: getColor('--color-grey-25', '#e5e7eb'),
      score: getColor('--color-yellow-400', '#fbbf24'),
    }),
    [],
  )

  // 안쪽 링 배경 데이터 (회색) - 전체를 회색으로 채움
  const innerBackgroundData = useMemo(
    () => [{ name: '배경', value: 100, color: colors.background }],
    [colors.background],
  )

  // 안쪽 링 프로그레스 데이터 (노란색) - 바른 자세 비율만큼 노란색
  const ScoreProgressData = useMemo(
    () => [
      {
        name: '바른 자세 비율',
        value: correctPosturePercentage,
        color: colors.score,
      },
    ],
    [correctPosturePercentage, colors.score],
  )

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}시간 ${mins}분`
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="">
        <div className="dark:bg-grey-100 rounded-xl bg-white p-6">
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-body-lg-medium text-grey-400">
              리포트를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 발생
  if (error) {
    return (
      <div className="">
        <div className="dark:bg-grey-100 rounded-xl bg-white p-6">
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-body-lg-medium text-error-500">
              리포트를 불러올 수 없습니다
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 데이터 없음
  if (!data) {
    return (
      <div className="">
        <div className="dark:bg-grey-100 rounded-xl bg-white p-6">
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-body-lg-medium text-grey-400">
              세션 데이터가 없습니다
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="dark:bg-grey- bg-grey-0 rounded-xl py-6">
        <div className="mb-12 flex flex-col">
          <h2 className="text-caption-sm-medium text-grey-400">
            오늘의 리포트
          </h2>
          <p className="text-headline-3xl-semibold text-grey-700">
            오늘 총 {sessionDistance.toLocaleString()}m 이동했어요
          </p>
        </div>

        {/* 도넛 차트 */}
        <div className="relative mb-12 flex justify-center">
          <ResponsiveContainer width="100%" height={212.5}>
            <PieChart>
              <Pie
                data={innerBackgroundData}
                cx="50%"
                cy="50%"
                innerRadius={77.75}
                outerRadius={92}
                startAngle={450}
                endAngle={90}
                dataKey="value"
                stroke="none"
                paddingAngle={0}
                cornerRadius={0}
                isAnimationActive={false}
              >
                <Cell fill={innerBackgroundData[0].color} />
              </Pie>

              <Pie
                data={ScoreProgressData}
                cx="50%"
                cy="50%"
                innerRadius={77.75}
                outerRadius={92}
                startAngle={450}
                endAngle={450 - (correctPosturePercentage / 100) * 360}
                dataKey="value"
                stroke="none"
                paddingAngle={0}
                cornerRadius={10}
              >
                <Cell fill={ScoreProgressData[0].color} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* 중앙 텍스트 */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-caption-sm-regular text-grey-500">사용시간</p>
            <p className="text-headline-2xl-semibold text-grey-600">
              {formatTime(totalTime)}
            </p>
          </div>
        </div>

        {/* 하단 지표 */}
        <div className="flex flex-col gap-7">
          <div className="flex items-center">
            <div
              className="h-4 w-2 rounded-full"
              style={{ backgroundColor: colors.time }}
            />
            <p className="ml-1 flex flex-1 items-center justify-between">
              <span className="text-body-md-medium text-grey-400">
                바른 자세 시간
              </span>
              <span className="text-headline-2xl-semibold text-grey-600">
                {correctPosturePercentage}%
              </span>
            </p>
          </div>

          <div className="bg-grey-25 flex flex-col rounded-[24px] p-5">
            <p className="flex flex-col gap-2 px-5">
              <span className="text-body-sm-medium text-grey-400">
                바른 자세 점수
              </span>
              <span className="text-body-xl-semibold text-grey-600">
                {score}점
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExitPanel
