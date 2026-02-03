import { CSSProperties } from 'react'

interface Props {
  size?: number
  color?: string
  style?: CSSProperties
}

export function LoadingSpinner({ size = 40, color = '#667eea', style }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
        />
        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </svg>
    </div>
  )
}
