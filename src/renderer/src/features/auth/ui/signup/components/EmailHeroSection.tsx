import EmailIcon from '@assets/auth/email_icon.svg?react'
import { useEmailStore } from '@entities/user'

export default function EmailHeroSection() {
  const email = useEmailStore(state => state.email)

  return (
    <div className="mb-12 flex flex-col items-center gap-[46px]">
      <EmailIcon className="ml-5" />
      <div className="flex flex-col items-center justify-center gap-6">
        <p className="text-title-4xl-bold text-grey-700">이메일 인증</p>
        <p className="text-headline-2xl-regular text-grey-800 text-center">
          본인 인증 메일을 귀하의
          <span className="text-headline-2xl-semibold text-yellow-500">
            {` ${email}`}
          </span>
          로 보냈습니다.
          <br />
          받은 메일함에서 인증 메일을 열고{' '}
          <span className="text-headline-2xl-semibold">본인인증</span>을
          클릭하면 회원가입이 완료됩니다.
        </p>
      </div>
    </div>
  )
}
