import { CSSProperties } from 'react'
import { Bulle } from './Bulle'

interface Props {
  className?: string
  style?: CSSProperties
  bulleOffset?: { x: number; y: number; width: number }
}

export const Informations: React.FC<Props> = ({ className, style, bulleOffset }) => (
  <div className={className} style={{ ...style, overflow: 'visible' }}>
    <img
      src="/assets/informations.svg"
      alt="Informations"
      style={{ width: '100%' }}
    />
    {bulleOffset && (
      <Bulle
        src="/assets/informations_generales_bulle.svg"
        alt="Informations"
        offsetX={bulleOffset.x}
        offsetY={bulleOffset.y}
        width={bulleOffset.width}
      />
    )}
  </div>
)
