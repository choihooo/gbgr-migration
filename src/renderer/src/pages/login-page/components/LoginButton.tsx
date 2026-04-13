import { Button } from '@shared/ui/button'

interface LoginButtonProps {
  text?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export default function LoginButton({
  text: _text = '',
  type = 'button',
  onClick,
  disabled = true,
  className = '',
}: LoginButtonProps) {
  return (
    <Button
      text="로그인"
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant="primary"
      size="xl"
      className={`hbp:mt-7 mt-5 w-full ${className} hbp:h-[74px] text-headline-2xl-medium`}
    >
      로그인
    </Button>
  )
}
