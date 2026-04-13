import {
  useResendVerifyEmailMuation,
  useVerifyEmailMutation,
} from '@entities/user'
import { useEmailStore } from '@entities/user'
import ResendEmailHerosection from '@features/auth/ui/signup/components/ResendEmailHeroSection'
import ResendSection from '@features/auth/ui/signup/components/ResendSection'
import VerifyAction from '@features/auth/ui/signup/components/VerifyAction'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const ResendVerificationPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const processedTokenRef = useRef<string | null>(null)
  const { mutate } = useVerifyEmailMutation({ redirectTo: '/auth/resend' })
  const resendverifyEmailMutation = useResendVerifyEmailMuation()
  const email = useEmailStore(state => state.email)

  /* 토큰 여부에 따른 이메일 인증 */
  useEffect(() => {
    if (!token || processedTokenRef.current === token) {
      return
    }

    processedTokenRef.current = token
    mutate(token)
  }, [mutate, token])

  /* 이메일 다시 보내기 */
  const onResendClick = () => {
    resendverifyEmailMutation.mutate({ email: email, callbackUrl: '' })
  }

  return (
    <main className="hbp:min-h-[calc(100vh-75px)] flex min-h-[calc(100vh-60px)] flex-col items-center justify-center">
      <div className="hbp:mx-auto hbp:max-w-screen-lg hbp:px-10 relative w-full overflow-visible">
        <section className="= flex w-full flex-col items-center justify-center px-7">
          <ResendEmailHerosection />
          <VerifyAction email={email} />
          <ResendSection onClick={onResendClick} />
        </section>
      </div>
    </main>
  )
}

export default ResendVerificationPage
