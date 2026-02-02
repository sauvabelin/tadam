import { CSSProperties } from 'react'
import { Bulle } from './Bulle'

interface Props {
  className?: string
  style?: CSSProperties
  bulleOffset?: { x: number; y: number; width: number }
}

export const Journal: React.FC<Props> = ({ className, style, bulleOffset }) => (
  <div className={className} style={{ ...style, overflow: 'visible' }}>
    <img
      src="/assets/journal.svg"
      alt="Journal"
      style={{ width: '100%' }}
    />
    {bulleOffset && (
      <Bulle
        src="/assets/jounaux_bulle.svg"
        alt="Journaux"
        offsetX={bulleOffset.x}
        offsetY={bulleOffset.y}
        width={bulleOffset.width}
      />
    )}
  </div>
)
