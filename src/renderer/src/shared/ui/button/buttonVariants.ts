import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none disabled:cursor-not-allowed active:scale-95',
  {
    variants: {
      variant: {
        primary:
          'bg-yellow-400 text-grey-1000 hover:bg-yellow-500 active:bg-yellow-600 disabled:bg-yellow-100 disabled:text-grey-0 cursor-pointer',
        sub: 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 active:bg-yellow-200 active:text-yellow-600 cursor-pointer',
        grey: 'bg-grey-25 text-grey-500 hover:bg-grey-50 active:bg-grey-100 active:text-grey-300 cursor-pointer disabled:bg-grey-25 disabled:text-grey-100',
      },

      size: {
        xs: 'h-[33px] px-3 text-caption-sm-medium',
        sm: 'h-10 px-4 text-body-md-medium',
        md: 'h-10 px-5 text-body-md-medium',
        lg: 'h-[51px] px-6 text-body-lg-medium',
        xl: 'h-[59px] px-7 text-body-lg-medium ',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)
