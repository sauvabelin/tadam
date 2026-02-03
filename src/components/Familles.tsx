import { CSSProperties, useState } from 'react'
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

export const Familles: React.FC<Props> = ({ className, style, bulleOffsets }) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={className} style={{ ...style, overflow: 'visible' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(102, 126, 234, 0.2)',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'svg-load-spin 0.8s linear infinite',
            }}
          />
        </div>
      )}
      <img
        src="/assets/familles.svg"
        alt="Familles"
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        style={{
          width: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
      {bulleOffsets?.patatra && (
        <Bulle
          id="patatra"
          src="/assets/patatra_bulle.svg"
          alt="Patatra"
          offsetX={bulleOffsets.patatra.x}
          offsetY={bulleOffsets.patatra.y}
          width={bulleOffsets.patatra.width}
        />
      )}
      {bulleOffsets?.fantasia && (
        <Bulle
          id="fantasia"
          src="/assets/fantasia_bulle.svg"
          alt="Fantasia"
          offsetX={bulleOffsets.fantasia.x}
          offsetY={bulleOffsets.fantasia.y}
          width={bulleOffsets.fantasia.width}
        />
      )}
      {bulleOffsets?.lamifa && (
        <Bulle
          id="lamifa"
          src="/assets/lamifa_bulle.svg"
          alt="Lamifa"
          offsetX={bulleOffsets.lamifa.x}
          offsetY={bulleOffsets.lamifa.y}
          width={bulleOffsets.lamifa.width}
        />
      )}
      {bulleOffsets?.zampazzi && (
        <Bulle
          id="zampazzi"
          src="/assets/zampazzi_bulle.svg"
          alt="Zampazzi"
          offsetX={bulleOffsets.zampazzi.x}
          offsetY={bulleOffsets.zampazzi.y}
          width={bulleOffsets.zampazzi.width}
        />
      )}
      <style>{`
        @keyframes svg-load-spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
