import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Journal: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/journal.svg"
    alt="Journal"
    className={className}
    style={style}
  />
)
