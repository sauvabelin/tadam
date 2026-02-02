import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Hike: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/hike.svg"
    alt="Hike"
    className={className}
    style={style}
  />
)
