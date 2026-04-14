import { useTranslation } from 'react-i18next'
import { SignUpForm } from '@/features/auth/ui/signup/components/SignUpForm'

function SignupPage() {
  const { t } = useTranslation()

  return (
    <main className="hbp:pt-[75px] mb-5 flex flex-col pt-15">
      <div className="hbp:mx-auto hbp:max-w-screen-lg hbp:px-10 w-full overflow-visible">
        <section className="hbp:gap-[45px] flex w-full flex-col items-center justify-center gap-9 px-7">
          <p className="text-title-4xl-bold hbp:text-[40px] text-grey-900 w-full text-center">
            {t('auth.signup.title')}
          </p>
          <SignUpForm />
        </section>
      </div>
    </main>
  )
}

export default SignupPage
