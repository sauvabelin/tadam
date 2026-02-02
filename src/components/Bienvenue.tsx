import { CSSProperties } from 'react'
import { Bulle } from './Bulle'

interface BulleConfig {
  x: number
  y: number
  width: number
}

interface Props {
  className?: string
  style?: CSSProperties
  bulleOffsets?: {
    inscription?: BulleConfig
    bienvenue?: BulleConfig
  }
}

export const Bienvenue: React.FC<Props> = ({ className, style, bulleOffsets }) => (
  <div className={className} style={{ ...style, overflow: 'visible' }}>
    <img
      src="/assets/bienvenue.svg"
      alt="Bienvenue"
      style={{ width: '100%' }}
    />
    {bulleOffsets?.inscription && (
      <Bulle
        src="/assets/inscription_bulle.svg"
        alt="Inscription"
        offsetX={bulleOffsets.inscription.x}
        offsetY={bulleOffsets.inscription.y}
        width={bulleOffsets.inscription.width}
      />
    )}
    {bulleOffsets?.bienvenue && (
      <Bulle
        src="/assets/bienvenue_bulle.svg"
        alt="Bienvenue"
        offsetX={bulleOffsets.bienvenue.x}
        offsetY={bulleOffsets.bienvenue.y}
        width={bulleOffsets.bienvenue.width}
      />
    )}
  </div>
)
