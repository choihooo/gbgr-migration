import Logo from '@assets/common/icons/logo.svg?react'
import Symbol from '@assets/common/icons/symbol.svg?react'

export default function HeroSection() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="hbp:gap-6 flex w-full flex-row items-center justify-center gap-5">
        <Symbol className="h-[62px] w-[62px]" />
        <Logo className="hbp:h-[55px] hbp:w-[230px] [&>path]:fill-logo-fill flex h-[44px] w-[184px]" />
      </div>
      <p className="text-body-lg-medium text-grey-400 hbp:text-headline-2xl-medium">
        세상 모든 거북목들이 기린이 될 때까지
      </p>
    </div>
  )
}
