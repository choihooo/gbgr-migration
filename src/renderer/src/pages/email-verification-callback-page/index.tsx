import CompletionCharacter from '@assets/common/icons/completion.svg?react'
import { useVerifyEmailMutation } from '@entities/user'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const EmailVerificationCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const processedTokenRef = useRef<string | null>(null)

  const { mutate } = useVerifyEmailMutation({
    redirectTo: '/auth/verify-callback',
  })
  useEffect(() => {
    if (!token || processedTokenRef.current === token) {
      return
    }

    processedTokenRef.current = token
    mutate(token)
  }, [mutate, token])

  return (
    <main className="hbp:min-h-[calc(100vh-75px)] flex min-h-[calc(100vh-60px)] flex-col items-center justify-center">
      <div className="hbp:mx-auto hbp:max-w-screen-lg hbp:px-10 relative w-full overflow-visible">
        <section className="flex w-full flex-col items-center justify-center px-7">
          <div className="mb-12 flex flex-col items-center gap-[46px]">
            <div className="flex flex-col items-center justify-center gap-6">
              <CompletionCharacter className="labtop:w-[560px] labtop:h-[560px] h-[415px] w-[415px]" />
              <p className="text-title-4xl-bold text-grey-700">환영합니다</p>
              <p className="text-headline-2xl-regular text-grey-800 text-center">
                이메일 인증이 완료되었습니다.
                <br />
                거부기린 앱으로 돌아가서
                <br />
                로그인하여 서비스를 이용해주세요.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default EmailVerificationCallbackPage
