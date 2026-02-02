import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const Contact: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/contact.svg"
    alt="Contact"
    className={className}
    style={style}
  />
)
