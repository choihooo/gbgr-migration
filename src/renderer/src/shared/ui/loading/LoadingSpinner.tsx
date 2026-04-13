import LoadingVideo from '@assets/video/Loading.mov'
import { cn } from '@shared/lib/cn'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
}

export const LoadingSpinner = ({
  className,
  size = 'md',
  text,
}: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className,
      )}
      role="status"
      aria-label="로딩 중"
    >
      <video
        className={cn(
          'pointer-events-none select-none object-contain',
          sizeClasses[size],
        )}
        src={LoadingVideo}
        autoPlay
        loop
        muted
        playsInline
      />
      <span className="sr-only">로딩 중...</span>
      {text && <p className="text-body-md-medium text-grey-400">{text}</p>}
    </div>
  )
}
