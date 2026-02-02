import { CSSProperties } from 'react'
import { Bulle } from './Bulle'

interface Props {
  className?: string
  style?: CSSProperties
  bulleOffset?: { x: number; y: number; width: number }
}

export const InspectionDesSacs: React.FC<Props> = ({ className, style, bulleOffset }) => (
  <div className={className} style={{ ...style, overflow: 'visible' }}>
    <img
      src="/assets/inspection-des-sacs.svg"
      alt="Inspection des sacs"
      style={{ width: '100%' }}
    />
    {bulleOffset && (
      <Bulle
        src="/assets/inspection_des_sacs_bulle.svg"
        alt="Inspection des sacs"
        offsetX={bulleOffset.x}
        offsetY={bulleOffset.y}
        width={bulleOffset.width}
      />
    )}
  </div>
)
