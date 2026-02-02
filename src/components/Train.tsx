import { CSSProperties } from 'react'
import { Bulle } from './Bulle'

interface Props {
  className?: string
  style?: CSSProperties
  bulleOffset?: { x: number; y: number; width: number }
}

export const Train: React.FC<Props> = ({ className, style, bulleOffset }) => (
  <div className={className} style={{ ...style, overflow: 'visible' }}>
    <img
      src="/assets/train.svg"
      alt="Train"
      style={{ width: '100%' }}
    />
    {bulleOffset && (
      <Bulle
        src="/assets/journee des parents_bulle.svg"
        alt="Journee des parents"
        offsetX={bulleOffset.x}
        offsetY={bulleOffset.y}
        width={bulleOffset.width}
      />
    )}
  </div>
)
