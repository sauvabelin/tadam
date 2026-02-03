import { CSSProperties, useState } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Background: React.FC<Props> = ({ className, style }) => {
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
            backgroundColor: '#FFFEF5',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(102, 126, 234, 0.2)',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'bg-spin 0.8s linear infinite',
            }}
          />
          <style>{`
            @keyframes bg-spin {
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      <img
        src="/assets/Natel_Fond.svg"
        alt=""
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        style={{
          ...style,
          display: isLoading ? 'none' : undefined,
        }}
      />
    </>
  )
}
