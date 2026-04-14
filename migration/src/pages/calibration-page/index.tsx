import { useTranslation } from 'react-i18next'

function CalibrationPage() {
  const { t } = useTranslation()

  return <div>{t('onboarding.calibrationPageTitle')}</div>
}

export default CalibrationPage
