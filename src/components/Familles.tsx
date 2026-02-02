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
    patatra?: BulleConfig
    fantasia?: BulleConfig
    lamifa?: BulleConfig
    zampazzi?: BulleConfig
  }
}

export const Familles: React.FC<Props> = ({ className, style, bulleOffsets }) => (
  <div className={className} style={{ ...style, overflow: 'visible' }}>
    <img
      src="/assets/familles.svg"
      alt="Familles"
      style={{ width: '100%' }}
    />
    {bulleOffsets?.patatra && (
      <Bulle
        src="/assets/patatra_bulle.svg"
        alt="Patatra"
        offsetX={bulleOffsets.patatra.x}
        offsetY={bulleOffsets.patatra.y}
        width={bulleOffsets.patatra.width}
      />
    )}
    {bulleOffsets?.fantasia && (
      <Bulle
        src="/assets/fantasia_bulle.svg"
        alt="Fantasia"
        offsetX={bulleOffsets.fantasia.x}
        offsetY={bulleOffsets.fantasia.y}
        width={bulleOffsets.fantasia.width}
      />
    )}
    {bulleOffsets?.lamifa && (
      <Bulle
        src="/assets/lamifa_bulle.svg"
        alt="Lamifa"
        offsetX={bulleOffsets.lamifa.x}
        offsetY={bulleOffsets.lamifa.y}
        width={bulleOffsets.lamifa.width}
      />
    )}
    {bulleOffsets?.zampazzi && (
      <Bulle
        src="/assets/zampazzi_bulle.svg"
        alt="Zampazzi"
        offsetX={bulleOffsets.zampazzi.x}
        offsetY={bulleOffsets.zampazzi.y}
        width={bulleOffsets.zampazzi.width}
      />
    )}
  </div>
)
