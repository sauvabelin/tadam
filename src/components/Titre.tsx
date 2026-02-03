import { CSSProperties, useState } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Titre: React.FC<Props> = ({ className, style }) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      {isLoading && (
        <div
          className={className}
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(102, 126, 234, 0.2)',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'titre-spin 0.8s linear infinite',
            }}
          />
          <style>{`
            @keyframes titre-spin {
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      <img
        src="/assets/titre.svg"
        alt="Tadam"
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        style={{
          filter: 'drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.3))',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease',
          display: isLoading ? 'none' : undefined,
          ...style,
        }}
      />
    </>
  )
}
