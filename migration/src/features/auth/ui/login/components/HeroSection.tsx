import { useTranslation } from 'react-i18next'
import { BrandLogo, BrandSymbol } from '@/shared/ui/icons/brand-icons'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="hbp:gap-6 flex w-full items-center justify-center gap-5">
        <BrandSymbol className="h-[62px] w-[62px]" />
        <BrandLogo className="text-logo-fill hbp:h-[55px] hbp:w-[230px] h-[44px] w-[184px]" />
      </div>
      <p className="text-body-lg-medium text-grey-400 hbp:text-headline-2xl-medium">
        {t('auth.slogan')}
      </p>
    </div>
  )
}
