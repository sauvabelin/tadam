import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Lettres: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/lettres.svg"
    alt="Lettres"
    className={className}
    style={style}
  />
)
