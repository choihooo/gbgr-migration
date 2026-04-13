import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/input-field'

interface VerifyActionProps {
  email: string
}

export function VerifyAction({ email }: VerifyActionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="mt-20 flex w-[440px] flex-col gap-5">
      <TextField
        placeholder={email}
        className="cursor-not-allowed px-7"
        disabled={true}
      />
      <Button
        text={t('auth.login.submit')}
        className="text-body-xl-medium h-[49px]"
        onClick={() => navigate('/auth/login')}
      />
    </div>
  )
}
