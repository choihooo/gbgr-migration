import InfoIcon from '@assets/common/icons/info-circle.svg?react'
import * as React from 'react'

interface PannelHeaderProps {
  children?: React.ReactNode
}

const PannelHeader = React.forwardRef<HTMLDivElement, PannelHeaderProps>(
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

PannelHeader.displayName = 'PannelHeader'
export { PannelHeader }
