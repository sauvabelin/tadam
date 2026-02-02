import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Informations: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/informations.svg"
    alt="Informations"
    className={className}
    style={style}
  />
)
