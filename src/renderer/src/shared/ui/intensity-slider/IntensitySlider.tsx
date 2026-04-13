import { cn } from '@shared/lib/cn'
import * as React from 'react'

interface IntensitySliderProps {
  leftLabel?: string
  rightLabel?: string
}

const LEVEL_COLORS = [
  'bg-yellow-50', // 가장 옅은 크림색
  'bg-yellow-100', // 옅은 노란색
  'bg-yellow-200', // 중간 노란색
  'bg-yellow-400', // 밝은 노란색/주황빛
  'bg-yellow-500', // 가장 진한 주황색/노란색
] as const

const IntensitySlider = React.forwardRef<HTMLDivElement, IntensitySliderProps>(
  ({ leftLabel = 'Less', rightLabel = 'More' }, ref) => {
    return (
      <div ref={ref} className="flex items-center gap-1">
        <span className="text-grey-200 text-caption-2xs-regular">
          {leftLabel}
        </span>

        <div className="flex items-center gap-1">
          {LEVEL_COLORS.map((color, index) => (
            <div key={index} className={cn('h-2 w-2 rounded-full', color)} />
          ))}
        </div>

        <span className="text-grey-200 text-caption-2xs-regular">
          {rightLabel}
        </span>
      </div>
    )
  },
)

IntensitySlider.displayName = 'IntensitySlider'
export { IntensitySlider }
