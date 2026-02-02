import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Concert: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/concert.svg"
    alt="Concert"
    className={className}
    style={style}
  />
)
