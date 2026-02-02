import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Dons: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/dons.svg"
    alt="Dons"
    className={className}
    style={style}
  />
)
