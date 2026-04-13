import { useTranslation } from 'react-i18next'

function OnboardingCompletionPage() {
  const { t } = useTranslation()

  return <div>{t('onboarding.completionPageTitle')}</div>
}

export default OnboardingCompletionPage
