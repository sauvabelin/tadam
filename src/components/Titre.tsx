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
    style={style}
  />
)
