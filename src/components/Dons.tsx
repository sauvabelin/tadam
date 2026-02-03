import { CSSProperties, useState } from 'react'
import { Bulle } from './Bulle'

interface Props {
  className?: string
  style?: CSSProperties
  bulleOffset?: { x: number; y: number; width: number }
}

export const Dons: React.FC<Props> = ({ className, style, bulleOffset }) => {
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
        src="/assets/dons.svg"
        alt="Dons"
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        style={{
          width: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
      {bulleOffset && (
        <Bulle
          id="dons"
          src="/assets/dons_bulle.svg"
          alt="Dons"
          offsetX={bulleOffset.x}
          offsetY={bulleOffset.y}
          width={bulleOffset.width}
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
