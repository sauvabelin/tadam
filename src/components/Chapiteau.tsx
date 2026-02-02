import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Chapiteau: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/chapiteau.svg"
    alt="Chapiteau"
    className={className}
    style={style}
  />
)
