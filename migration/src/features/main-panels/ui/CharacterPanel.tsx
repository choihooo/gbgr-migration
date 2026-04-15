import { cn } from '@/shared/lib/cn'
import type { PanelBaseProps } from '../model/types'

/**
 * @legacy src/renderer/src/features/dashboard/ui/CharacterPanel.tsx
 * 정적 UI 패널 — 카드 컨테이너와 내부 정사각형 비주얼 영역만 표시한다.
 */
export function CharacterPanel({ className }: PanelBaseProps) {
  return (
    <div
      className={cn(
        'border-grey-100 col-span-12 rounded-2xl border bg-white p-0 md:col-span-5',
        className,
      )}
    >
      <div className="bg-warning-300/30 aspect-square w-full rounded-2xl" />
    </div>
  )
}
