import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@shared/lib/cn'
import { buttonVariants } from './buttonVariants'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  text?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, text, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {text}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button }
