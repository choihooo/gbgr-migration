import AngelRiniVideo from '@assets/video/angel-rini.webm'
import BackgroundVideo from '@assets/video/background.webm'
import BugiVideo from '@assets/video/bugi.webm'
import PmRiniVideo from '@assets/video/pm-rini.webm'
import RiniVideo from '@assets/video/rini.webm'
import StoneBugiVideo from '@assets/video/stone-bugi.webm'
import TireBugiVideo from '@assets/video/tire-bugi.webm'

import AngelRiniRestSvg from '@assets/video/angel-rini-rest.svg'
import BugiRestSvg from '@assets/video/bugi-rest.svg'
import PmRiniRestSvg from '@assets/video/pm-rini-rest.svg'
import RiniSvg from '@assets/video/rini.svg'
import StoneBugiRestSvg from '@assets/video/stone-bugi-rest.svg'
import TireBugiRestSvg from '@assets/video/tire-bugi-rest.svg'

import { usePostureStore } from '@entities/posture'
import { cn } from '@shared/lib/cn'
import { getScoreLevel } from '@shared/lib/get-score-level'
import { useCameraStore } from '@widgets/camera'
import { useEffect, useMemo, useRef } from 'react'

const RunningPanel = () => {
  const score = usePostureStore(state => state.score)
  const cameraState = useCameraStore(state => state.cameraState)
  const isCameraShow = cameraState === 'show'
  const backgroundVideoRef = useRef<HTMLVideoElement>(null)

  // 점수 기반 레벨 계산
  const levelInfo = useMemo(() => getScoreLevel(score), [score])

  // 레벨에 따른 비디오 선택
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

  // 레벨에 따른 SVG 선택 (카메라 hide 상태일 때 사용)
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

  // 레벨에 따른 게이지바 비율 (레벨이 낮을수록(좋을수록) 더 많이 채워짐)
  const gaugeWidth = useMemo(() => {
    // 레벨 1(가장 좋음): 100%, 레벨 2: 95%, 레벨 3: 70%, 레벨 4: 45%, 레벨 5: 20%, 레벨 6(가장 나쁨): 5%
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

  // 레벨에 따른 그라데이션 색상
  const gradient = useMemo(() => {
    // 레벨이 낮을수록(좋을수록) 초록색, 높을수록(나쁠수록) 빨간색
    if (levelInfo.level <= 3) {
      return 'linear-gradient(90deg, var(--color-olive-green) 0.18%, var(--color-success) 99.7%)'
    }
    return 'linear-gradient(90deg, var(--color-coral-red) 0%, var(--color-error) 100%)'
  }, [levelInfo.level])

  // 레벨에 따른 상태 텍스트
  const runningStatus = useMemo(() => {
    const statusMap: Record<number, string> = {
      1: '최고 속도로 가는 중!', // 가장 좋음
      2: '빠르게 가는 중!',
      3: '씽씽 가는 중!',
      4: '천천히 가는 중',
      5: '느릿느릿 가는중..',
      6: '엉금엉금 가는중..', // 가장 나쁨
    }
    return statusMap[levelInfo.level] || '가는 중'
  }, [levelInfo.level])

  // 카메라 상태에 따라 배경 영상 재생/멈춤 제어
  useEffect(() => {
    const video = backgroundVideoRef.current
    if (!video) return

    if (isCameraShow) {
      video.play().catch(error => {
        console.warn('배경 영상 재생 실패:', error)
      })
    } else {
      video.pause()
    }
  }, [isCameraShow])

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-caption-sm-medium text-grey-400">{runningStatus}</p>
      </div>

      <div className="relative h-[421px] w-full overflow-hidden rounded-xl">
        {/* 배경 영상 */}
        <video
          ref={backgroundVideoRef}
          src={BackgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full rounded-xl object-cover"
        />

        {/* 게이지바 */}
        <div className="relative z-10 mx-4 mt-4">
          {/* 흰색 트랙 */}
          <div className="bg-grey-50 relative h-5 w-full rounded-full">
            {/* 진행 바 */}
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

        {/* 움직이는 동영상 영역 */}
        <div
          className={cn(
            'relative z-10 mt-12 flex items-center justify-center px-4',
          )}
        >
          {isCameraShow ? (
            <video
              src={levelVideo}
              autoPlay
              loop
              muted
              playsInline
              className="h-auto max-h-[320px] w-full rounded-lg bg-transparent object-contain"
            />
          ) : (
            <img
              src={levelSvgSrc}
              alt="레벨 이미지"
              className="h-auto max-h-[320px] w-full rounded-lg bg-transparent object-contain"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default RunningPanel
