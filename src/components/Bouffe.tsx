import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Bouffe: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/bouffe.svg"
    alt="Bouffe"
    className={className}
    style={style}
  />
)
