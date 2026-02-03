import { useState, CSSProperties, ImgHTMLAttributes } from 'react'

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string
  alt: string
  containerStyle?: CSSProperties
  showSpinner?: boolean
}

export function LoadingImage({
  src,
  alt,
  style,
  containerStyle,
  showSpinner = true,
  ...imgProps
}: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        ...containerStyle,
      }}
    >
      {/* Loading placeholder */}
      {isLoading && showSpinner && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 254, 245, 0.5)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'loading-spin 0.8s linear infinite',
            }}
          />
          <style>{`
            @keyframes loading-spin {
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...style,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
        {...imgProps}
      />

      {/* Error state */}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            fontSize: '0.875rem',
            borderRadius: '8px',
          }}
        >
          Erreur de chargement
        </div>
      )}
    </div>
  )
}
