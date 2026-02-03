import { CSSProperties, useState } from 'react'
import { BulleId } from '../types'
import { useModal } from '../context/ModalContext'

interface Props {
  id: BulleId
  src: string
  alt: string
  offsetX: number
  offsetY: number
  width: number
  style?: CSSProperties
}

export const Bulle: React.FC<Props> = ({ id, src, alt, offsetX, offsetY, width, style }) => {
  const [hovered, setHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { openModalAt } = useModal()

  const handleClick = (e: React.MouseEvent) => {
    openModalAt(id, e.clientX, e.clientY)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${offsetX}px`,
        top: `${offsetY}px`,
        width: `${width}px`,
      }}
    >
      {/* Loading spinner */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid rgba(102, 126, 234, 0.3)',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'bulle-spin 0.8s linear infinite',
            }}
          />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className="max-w-none"
        onClick={handleClick}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: 'none',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s ease, opacity 0.3s ease',
          cursor: 'pointer',
          filter: 'drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.2))',
          opacity: isLoading ? 0 : 1,
          ...style,
        }}
      />

      <style>{`
        @keyframes bulle-spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
