import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Background: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/Natel_Fond.svg"
    alt=""
    className={className}
    style={style}
  />
)
