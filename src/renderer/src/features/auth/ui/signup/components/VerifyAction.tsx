import { Button } from '@shared/ui/button'
import { TextField } from '@shared/ui/input-field'
import { useNavigate } from 'react-router-dom'

export default function VerifyAction({ email }: { email: string }) {
  const navigate = useNavigate()

  return (
    <div className="mt-20 flex w-[440px] flex-col gap-5">
      <TextField
        placeholder={email}
        className="cursor-not-allowed px-7"
        disabled={true}
      />
      <Button
        text="로그인"
        className="text-body-xl-medium h-[49px]"
        onClick={() => navigate('/auth/login')}
      />
    </div>
  )
}
