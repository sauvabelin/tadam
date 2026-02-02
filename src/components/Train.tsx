import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Train: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/train.svg"
    alt="Train"
    className={className}
    style={style}
  />
)
