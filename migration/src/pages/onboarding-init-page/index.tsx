import { useTranslation } from 'react-i18next'

function OnboardingInitPage() {
  const { t } = useTranslation()

  return <div>{t('onboarding.initPageTitle')}</div>
}

export default OnboardingInitPage
