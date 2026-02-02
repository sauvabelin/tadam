import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Familles: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/familles.svg"
    alt="Familles"
    className={className}
    style={style}
  />
)
