import { useTranslation } from 'react-i18next'

function OnboardingPage() {
  const { t } = useTranslation()

  return <div>{t('onboarding.pageTitle')}</div>
}

export default OnboardingPage
