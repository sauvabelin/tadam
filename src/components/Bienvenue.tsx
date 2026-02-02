import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Bienvenue: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/bienvenue.svg"
    alt="Bienvenue"
    className={className}
    style={style}
  />
)
