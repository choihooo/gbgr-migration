import CompletionCharacter from '@assets/common/icons/completion.svg?react'
import { useLevelQuery } from '@entities/dashboard'
import { useCreateSessionMutation } from '@entities/session'
import { Button } from '@shared/ui/button'
import { useCameraStore } from '@widgets/camera'
import { useNavigate } from 'react-router-dom'

const OnboardingCompletionPage = () => {
  const navigate = useNavigate()
  const { mutate: createSession, isPending } = useCreateSessionMutation()
  const { setShow } = useCameraStore()
  const { data: levelData } = useLevelQuery()

  const handleStart = () => {
    /* 세션 생성 후 메인 페이지로 이동 */
    createSession(undefined, {
      onSuccess: () => {
        // 세션 시작 시점의 이동거리 저장
        const startDistance = levelData?.data.current || 0
        localStorage.setItem('sessionStartDistance', startDistance.toString())

        setShow() // 카메라 활성화
        navigate('/main')
      },
    })
  }

  return (
    <main className="hbp:h-[calc(100vh-75px)] flex h-[calc(100vh-60px)] flex-col items-center">
      <div className="relative flex w-full flex-col items-center justify-center px-7">
        {/* 캐릭터 영역 */}
        <CompletionCharacter className="labtop:w-[560px] labtop:h-[560px] h-[415px] w-[415px]" />
        {/* 색종이 효과 */}

        {/* 텍스트 영역 */}
        <div className="mb-12 flex flex-col items-center gap-4">
          <h1 className="text-title-4xl-bold text-grey-700">자세 등록 완료</h1>
          <p className="text-headline-2xl-regular text-grey-500 text-center">
            이제부터 거부기린과 함께 거북목을 개선해볼까요?
          </p>
        </div>

        {/* 버튼 */}
        <div className="pb-30">
          <Button
            variant="primary"
            size="xl"
            className="w-[440px]"
            text={isPending ? '세션 생성 중...' : '시작하기'}
            onClick={handleStart}
            disabled={isPending}
          />
        </div>
      </div>
    </main>
  )
}

export default OnboardingCompletionPage
