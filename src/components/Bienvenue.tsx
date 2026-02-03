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
    inscription?: BulleConfig
    bienvenue?: BulleConfig
  }
}

export const Bienvenue: React.FC<Props> = ({ className, style, bulleOffsets }) => {
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
        src="/assets/bienvenue.svg"
        alt="Bienvenue"
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        style={{
          width: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
      {bulleOffsets?.inscription && (
        <Bulle
          id="inscription"
          src="/assets/inscription_bulle.svg"
          alt="Inscription"
          offsetX={bulleOffsets.inscription.x}
          offsetY={bulleOffsets.inscription.y}
          width={bulleOffsets.inscription.width}
        />
      )}
      {bulleOffsets?.bienvenue && (
        <Bulle
          id="bienvenue"
          src="/assets/bienvenue_bulle.svg"
          alt="Bienvenue"
          offsetX={bulleOffsets.bienvenue.x}
          offsetY={bulleOffsets.bienvenue.y}
          width={bulleOffsets.bienvenue.width}
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
