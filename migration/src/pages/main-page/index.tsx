import { useTranslation } from 'react-i18next'

function MainPage() {
  const { t } = useTranslation()

  return <div>{t('dashboard.pageTitle')}</div>
}

export default MainPage
