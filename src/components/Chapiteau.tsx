import { CSSProperties } from 'react'
import { Bulle } from './Bulle'

interface Props {
  className?: string
  style?: CSSProperties
  bulleOffset?: { x: number; y: number; width: number }
}

export const Chapiteau: React.FC<Props> = ({ className, style, bulleOffset }) => (
  <div className={className} style={{ ...style, overflow: 'visible' }}>
    <img
      src="/assets/chapiteau.svg"
      alt="Chapiteau"
      style={{ width: '100%' }}
    />
    {bulleOffset && (
      <Bulle
        src="/assets/trailer_bulle.svg"
        alt="Trailer"
        offsetX={bulleOffset.x}
        offsetY={bulleOffset.y}
        width={bulleOffset.width}
      />
    )}
  </div>
)
