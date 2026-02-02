import { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export const InspectionDesSacs: React.FC<Props> = ({ className, style }) => (
  <img
    src="/assets/inspection-des-sacs.svg"
    alt="Inspection des sacs"
    className={className}
    style={style}
  />
)
