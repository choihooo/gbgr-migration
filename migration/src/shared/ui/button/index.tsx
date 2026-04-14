import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type ButtonVariant = 'primary' | 'sub' | 'grey'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-yellow-400 text-grey-1000 hover:bg-yellow-500 active:bg-yellow-600 disabled:bg-yellow-100 disabled:text-grey-0',
  sub: 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 active:bg-yellow-200 active:text-yellow-600',
  grey: 'bg-grey-25 text-grey-500 hover:bg-grey-50 active:bg-grey-100 active:text-grey-300 disabled:bg-grey-25 disabled:text-grey-100',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-[33px] px-3 text-caption-sm-medium',
  sm: 'h-10 px-4 text-body-md-medium',
  md: 'h-10 px-5 text-body-md-medium',
  lg: 'h-[51px] px-6 text-body-lg-medium',
  xl: 'h-[59px] px-7 text-body-lg-medium',
}

export function Button({
  className,
  text,
  type = 'button',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none disabled:cursor-not-allowed active:scale-95',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {text}
    </button>
  )
}
