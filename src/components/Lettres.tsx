import { CSSProperties } from 'react'
import { Bulle } from './Bulle'

interface Props {
  className?: string
  style?: CSSProperties
  bulleOffset?: { x: number; y: number; width: number }
}

export const Lettres: React.FC<Props> = ({ className, style, bulleOffset }) => (
  <div className={className} style={{ ...style, overflow: 'visible' }}>
    <img
      src="/assets/lettres.svg"
      alt="Lettres"
      style={{ width: '100%' }}
    />
    {bulleOffset && (
      <Bulle
        id="lettres"
        src="/assets/lettre_bulle.svg"
        alt="Lettres"
        offsetX={bulleOffset.x}
        offsetY={bulleOffset.y}
        width={bulleOffset.width}
      />
    )}
  </div>
)
