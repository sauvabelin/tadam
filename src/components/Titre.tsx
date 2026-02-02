import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Titre: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/titre.svg"
    alt="Tadam"
    className={className}
    style={{
      filter: 'drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.5))',
      ...style,
    }}
  />
)
