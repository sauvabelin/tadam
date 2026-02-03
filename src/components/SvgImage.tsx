import { CSSProperties, useState } from 'react'

interface Props {
  src: string
  alt: string
  style?: CSSProperties
  className?: string
}

export function SvgImage({ src, alt, style, className }: Props) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {/* Loading placeholder with pulse animation */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 254, 245, 0.3)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(102, 126, 234, 0.2)',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'svg-spin 0.8s linear infinite',
            }}
          />
          <style>{`
            @keyframes svg-spin {
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        style={{
          width: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  )
}
