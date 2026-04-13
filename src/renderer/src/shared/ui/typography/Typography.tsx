import { cn } from '@shared/lib/cn'
import type React from 'react'

interface TypographyProps {
  variant?:
    | 'title-4xl-bold'
    | 'title-4xl-semibold'
    | 'headline-3xl-regular'
    | 'headline-3xl-medium'
    | 'headline-3xl-semibold'
    | 'headline-2xl-regular'
    | 'headline-2xl-medium'
    | 'headline-2xl-semibold'
    | 'body-xl-regular'
    | 'body-xl-medium'
    | 'body-xl-semibold'
    | 'body-lg-regular'
    | 'body-lg-medium'
    | 'body-lg-semibold'
    | 'body-md-regular'
    | 'body-md-medium'
    | 'body-md-semibold'
    | 'caption-sm-regular'
    | 'caption-sm-medium'
    | 'caption-sm-semibold'
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function Typography({
  variant = 'body-md-regular',
  children,
  className,
  as: Component = 'p',
}: TypographyProps) {
  const variantClasses = {
    'title-4xl-bold': 'text-title-4xl-bold',
    'title-4xl-semibold': 'text-title-4xl-semibold',
    'headline-3xl-regular': 'text-headline-3xl-regular',
    'headline-3xl-medium': 'text-headline-3xl-medium',
    'headline-3xl-semibold': 'text-headline-3xl-semibold',
    'headline-2xl-regular': 'text-headline-2xl-regular',
    'headline-2xl-medium': 'text-headline-2xl-medium',
    'headline-2xl-semibold': 'text-headline-2xl-semibold',
    'body-xl-regular': 'text-body-xl-regular',
    'body-xl-medium': 'text-body-xl-medium',
    'body-xl-semibold': 'text-body-xl-semibold',
    'body-lg-regular': 'text-body-lg-regular',
    'body-lg-medium': 'text-body-lg-medium',
    'body-lg-semibold': 'text-body-lg-semibold',
    'body-md-regular': 'text-body-md-regular',
    'body-md-medium': 'text-body-md-medium',
    'body-md-semibold': 'text-body-md-semibold',
    'caption-sm-regular': 'text-caption-sm-regular',
    'caption-sm-medium': 'text-caption-sm-medium',
    'caption-sm-semibold': 'text-caption-sm-semibold',
  }

  return (
    <Component className={cn(variantClasses[variant], className)}>
      {children}
    </Component>
  )
}
