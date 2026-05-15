import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import AngelRiniVideo from '@/assets/video/angel-rini.webm'
import AngelRiniRestSvg from '@/assets/video/angel-rini-rest.svg'
import BackgroundVideo from '@/assets/video/background.webm'
import BugiVideo from '@/assets/video/bugi.webm'
import BugiRestSvg from '@/assets/video/bugi-rest.svg'
import PmRiniVideo from '@/assets/video/pm-rini.webm'
import PmRiniRestSvg from '@/assets/video/pm-rini-rest.svg'
import RiniSvg from '@/assets/video/rini.svg'
import RiniVideo from '@/assets/video/rini.webm'
import StoneBugiVideo from '@/assets/video/stone-bugi.webm'
import StoneBugiRestSvg from '@/assets/video/stone-bugi-rest.svg'
import TireBugiVideo from '@/assets/video/tire-bugi.webm'
import TireBugiRestSvg from '@/assets/video/tire-bugi-rest.svg'
import { useLevelQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { usePostureEngineStore } from '@/entities/posture'
import { useSessionReportQuery } from '@/entities/session'
import { cn } from '@/shared/lib/cn'
import { getScoreLevel } from '@/shared/lib/get-score-level'
import { useCameraStore } from '../model/use-camera-store'

function ExitPanel() {
  const { t } = useTranslation()
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const id =
      localStorage.getItem('sessionId') || localStorage.getItem('lastSessionId')
    if (id && id !== sessionId) {
      setSessionId(id)
    }
  }, [sessionId])

  const { data, isLoading, error } = useSessionReportQuery(sessionId)
  const { data: levelData } = useLevelQuery()

  const getColor = (cssVar: string, fallback: string) => {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim() || fallback
    )
  }

  const totalSeconds = data?.data.totalSeconds || 0
  const goodSeconds = data?.data.goodSeconds || 0
  const totalTime = Math.round(totalSeconds / 60)
  const correctPosturePercentage =
    totalSeconds > 0 ? Math.round((goodSeconds / totalSeconds) * 100) : 0
  const score = data?.data.score || 0

  const currentDistance = levelData?.data.current || 0
  const startDistance = Number.parseInt(
    localStorage.getItem('sessionStartDistance') || '0',
    10,
  )
  const sessionDistance = Math.max(0, currentDistance - startDistance)

  const colors = {
    time: getColor('--color-yellow-400', '#ffcb31'),
    background: getColor('--color-grey-25', '#e5e7eb'),
    score: getColor('--color-yellow-400', '#fbbf24'),
  }

  const innerBackgroundData = useMemo(
    () => [{ name: '배경', value: 100, color: colors.background }],
    [colors.background],
  )

  const scoreProgressData = useMemo(
    () => [
      {
        name: t('dashboard.panels.report.postureTime'),
        value: correctPosturePercentage,
        color: colors.score,
      },
    ],
    [correctPosturePercentage, colors.score, t],
  )

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return t('dashboard.panels.report.hourMinute', {
      hours,
      minutes: mins,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-body-lg-medium text-grey-400">
          {t('dashboard.panels.report.loading')}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-body-lg-medium text-error-500">
          {t('dashboard.panels.report.error')}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-body-lg-medium text-grey-400">
          {t('dashboard.panels.report.empty')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-grey-0 rounded-xl py-6">
      <div className="mb-12 flex flex-col">
        <h2 className="text-caption-sm-medium text-grey-400">
          {t('dashboard.panels.report.todayReport')}
        </h2>
        <p className="text-headline-3xl-semibold text-grey-700">
          {t('dashboard.panels.report.totalDistance', {
            value: sessionDistance.toLocaleString(),
          })}
        </p>
      </div>

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
              data={scoreProgressData}
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
              <Cell fill={scoreProgressData[0].color} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-caption-sm-regular text-grey-500">
            {t('dashboard.panels.report.usageTime')}
          </p>
          <p className="text-headline-2xl-semibold text-grey-600">
            {formatTime(totalTime)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-7">
        <div className="flex items-center">
          <div
            className="h-4 w-2 rounded-full"
            style={{ backgroundColor: colors.time }}
          />
          <p className="ml-1 flex flex-1 items-center justify-between">
            <span className="text-body-md-medium text-grey-400">
              {t('dashboard.panels.report.postureTime')}
            </span>
            <span className="text-headline-2xl-semibold text-grey-600">
              {correctPosturePercentage}%
            </span>
          </p>
        </div>

        <div className="bg-grey-25 flex flex-col rounded-[24px] p-5">
          <p className="flex flex-col gap-2 px-5">
            <span className="text-body-sm-medium text-grey-400">
              {t('dashboard.panels.report.postureScore')}
            </span>
            <span className="text-body-xl-semibold text-grey-600">
              {t('dashboard.panels.report.score', { value: score })}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

function RunningPanel() {
  const { t } = useTranslation()
  const latestResult = usePostureEngineStore(state => state.latestResult)
  const restoredResult = usePostureEngineStore(state => state.restoredResult)
  const cameraState = useCameraStore(state => state.cameraState)
  const isCameraShow = cameraState === 'show'
  const backgroundVideoRef = useRef<HTMLVideoElement>(null)
  const characterCanvasRef = useRef<HTMLCanvasElement>(null)
  const characterVideoRef = useRef<HTMLVideoElement>(null)
  const [seeThruUnavailable, setSeeThruUnavailable] = useState(false)

  const score = latestResult?.score ?? restoredResult?.score ?? 0
  const levelInfo = useMemo(() => getScoreLevel(score), [score])

  const levelVideo = useMemo(() => {
    switch (levelInfo.level) {
      case 1:
        return AngelRiniVideo
      case 2:
        return PmRiniVideo
      case 3:
        return RiniVideo
      case 4:
        return BugiVideo
      case 5:
        return StoneBugiVideo
      case 6:
        return TireBugiVideo
      default:
        return RiniVideo
    }
  }, [levelInfo.level])

  const levelSvgSrc = useMemo(() => {
    switch (levelInfo.level) {
      case 1:
        return AngelRiniRestSvg
      case 2:
        return PmRiniRestSvg
      case 3:
        return RiniSvg
      case 4:
        return BugiRestSvg
      case 5:
        return StoneBugiRestSvg
      case 6:
        return TireBugiRestSvg
      default:
        return RiniSvg
    }
  }, [levelInfo.level])

  const gaugeWidth = useMemo(() => {
    const widthMap: Record<number, string> = {
      1: '100%',
      2: '75%',
      3: '50%',
      4: '50%',
      5: '75%',
      6: '100%',
    }
    return widthMap[levelInfo.level] || '70%'
  }, [levelInfo.level])

  const gradient = useMemo(() => {
    if (levelInfo.level <= 3) {
      return 'linear-gradient(90deg, var(--color-olive-green) 0.18%, var(--color-success) 99.7%)'
    }

    return 'linear-gradient(90deg, var(--color-coral-red) 0%, var(--color-error) 100%)'
  }, [levelInfo.level])

  const runningStatus = useMemo(() => {
    const statusMap: Record<number, string> = {
      1: t('dashboard.panels.report.runningBest'),
      2: t('dashboard.panels.report.runningFast'),
      3: t('dashboard.panels.report.runningGood'),
      4: t('dashboard.panels.report.runningSlow'),
      5: t('dashboard.panels.report.runningSlower'),
      6: t('dashboard.panels.report.runningSlowest'),
    }
    return (
      statusMap[levelInfo.level] || t('dashboard.panels.report.runningFallback')
    )
  }, [levelInfo.level, t])

  useEffect(() => {
    const video = backgroundVideoRef.current
    if (!video) return

    if (isCameraShow) {
      void video.play().catch(error => {
        console.warn('배경 영상 재생 실패:', error)
      })
      return
    }

    video.pause()
  }, [isCameraShow])

  // seeThru로 캐릭터 영상 검은 배경 투명화
  useEffect(() => {
    if (!isCameraShow) return
    if (seeThruUnavailable) return

    const video = characterVideoRef.current
    const canvas = characterCanvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    const draw = () => {
      if (video.paused || video.ended) {
        animationId = requestAnimationFrame(draw)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      ctx.drawImage(video, 0, 0)

      let imageData: ImageData
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      } catch (error) {
        console.warn(
          '[MiniRunningPanel] 영상 픽셀 데이터를 읽을 수 없어 seeThru 처리를 중단합니다:',
          error,
        )
        setSeeThruUnavailable(true)
        return
      }
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // 검은색에 가까울수록 더 투명하게 (threshold 40)
        const brightness = (r + g + b) / 3
        const alpha = Math.min(255, Math.max(0, (brightness / 40) * 255))
        data[i + 3] = Math.round(alpha)
      }

      ctx.putImageData(imageData, 0, 0)
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isCameraShow, levelVideo, seeThruUnavailable])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-caption-sm-medium text-grey-400">{runningStatus}</p>
      </div>

      <div className="relative h-[421px] w-full overflow-hidden rounded-xl">
        <video
          ref={backgroundVideoRef}
          src={BackgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          controls={false}
          controlsList="nofullscreen noplaybackrate nodownload noremoteplayback"
          className="media-display pointer-events-none absolute inset-0 h-full w-full rounded-xl object-cover select-none"
        />

        <div className="relative z-10 mx-4 mt-4">
          <div className="bg-grey-50 relative h-5 w-full rounded-full">
            <div
              className="flex h-full items-center justify-end rounded-full py-[3px] pr-[3px] transition-all duration-1000"
              style={{
                width: gaugeWidth,
                background: gradient,
              }}
            >
              <div className="bg-dot h-[14px] w-[14px] rounded-full opacity-50" />
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative z-10 mt-12 flex items-center justify-center px-4',
          )}
        >
          {isCameraShow ? (
            <>
              <video
                ref={characterVideoRef}
                src={levelVideo}
                autoPlay
                loop
                muted
                playsInline
                crossOrigin="anonymous"
                disablePictureInPicture
                controls={false}
                controlsList="nofullscreen noplaybackrate nodownload noremoteplayback"
                className={cn(
                  'pointer-events-none',
                  seeThruUnavailable
                    ? 'h-auto max-h-[320px] w-full rounded-lg object-contain'
                    : 'absolute h-0 w-0 opacity-0',
                )}
              />
              {!seeThruUnavailable ? (
                <canvas
                  ref={characterCanvasRef}
                  className="pointer-events-none h-auto max-h-[320px] w-full rounded-lg object-contain"
                />
              ) : null}
            </>
          ) : (
            <img
              src={levelSvgSrc}
              alt={t('dashboard.panels.report.levelImageAlt')}
              className="h-auto max-h-[320px] w-full rounded-lg bg-transparent object-contain"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function MiniRunningPanel() {
  const cameraState = useCameraStore(state => state.cameraState)

  return cameraState === 'exit' ? <ExitPanel /> : <RunningPanel />
}
