import { cn } from '@/shared/lib/cn'
import type { PanelBaseProps } from '../model/types'

/**
 * @legacy src/renderer/src/features/dashboard/ui/TrendPanel.tsx
 * 정적 UI 패널 — 레거시와 동일한 카드 구조, 제목, 필터 버튼, 차트 영역
 */
export function TrendPanel({ className }: PanelBaseProps) {
  return (
    <div
      className={cn(
        'border-grey-100 col-span-12 rounded-2xl border bg-white p-5 lg:col-span-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-headline-xl-bold text-grey-800">자세 추이</h3>
        <div className="flex items-center gap-2">
          <button className="text-caption-md-medium text-grey-500 bg-grey-50 rounded-full px-3 py-1">
            주간
          </button>
          <button className="text-caption-md-medium text-warning-600 bg-warning-50 rounded-full px-3 py-1">
            월간
          </button>
        </div>
      </div>
      <div className="bg-grey-50 h-[200px] rounded-xl" />
    </div>
  )
}
