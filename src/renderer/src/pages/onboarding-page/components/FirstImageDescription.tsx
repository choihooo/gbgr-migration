import GiraffeIcon from '@assets/onboarding/giraffe.svg?react'
import TurtleIcon from '@assets/onboarding/turtle.svg?react'

const FirstImageDescription = () => {
  const userName = localStorage.getItem('userName') || '사용자'

  return (
    <div className="relative flex h-full flex-col items-center justify-center">
      <p className="bg-grey-0 text-headline-2xl-semibold text-grey-600 mb-18 h-[81px] w-full max-w-[894px] min-w-[734px] rounded-[24px] p-6">
        안녕하세요! {userName}님의 자세 건강을 책임질 AI 파트너, 거부기린이에요.
      </p>
      <div className="flex w-7/10 items-end justify-between">
        <TurtleIcon />
        <GiraffeIcon />
      </div>
    </div>
  )
}

export default FirstImageDescription
