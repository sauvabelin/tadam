import { CSSProperties, useState } from 'react'

interface Props {
  src: string
  alt: string
  offsetX: number
  offsetY: number
  width: number
  style?: CSSProperties
}

export const Bulle: React.FC<Props> = ({ src, alt, offsetX, offsetY, width, style }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <img
      src={src}
      alt={alt}
      className="max-w-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: `${offsetX}px`,
        top: `${offsetY}px`,
        width: `${width}px`,
        height: 'auto',
        maxWidth: 'none',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        cursor: 'pointer',
        filter: 'drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.3))',
        ...style,
      }}
    />
  )
}
