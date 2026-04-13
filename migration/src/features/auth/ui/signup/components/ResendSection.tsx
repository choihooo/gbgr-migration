import { useTranslation } from 'react-i18next'

interface ResendSectionProps {
  onClick: () => void
}

export function ResendSection({ onClick }: ResendSectionProps) {
  const { t } = useTranslation()

  return (
    <p className="text-caption-sm-regular text-grey-300 mt-8 flex flex-row gap-3">
      {t('auth.signup.resendPrompt')}
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer text-yellow-500 underline"
      >
        {t('auth.signup.resendAction')}
      </button>
    </p>
  )
}
