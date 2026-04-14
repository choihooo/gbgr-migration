import { forwardRef, type ReactNode } from 'react'
import { InfoIcon } from '@/shared/ui/icons/ui-icons'

// 레거시: src/renderer/src/shared/ui/panel-header/PannelHeader.tsx

interface PanelHeaderProps {
  children?: ReactNode
}

export const PanelHeader = forwardRef<HTMLDivElement, PanelHeaderProps>(
  ({ children }, ref) => {
    return (
      <div
        ref={ref}
        className="text-caption-sm-medium text-grey-400 flex items-center gap-1"
      >
        {children}
        <InfoIcon className="[&_path]:stroke-grey-200 cursor-pointer" />
      </div>
    )
  },
)

PanelHeader.displayName = 'PanelHeader'
