import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isEntering, setIsEntering] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Trigger enter animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsEntering(true)
        })
      })

      const timer = setTimeout(() => {
        setIsEntering(false)
        setTimeout(() => {
          setIsAnimating(false)
          onClose()
        }, 400) // Wait for exit animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible && !isAnimating) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: isEntering ? '2rem' : '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '1rem 1.5rem',
        background: '#FFFEF5',
        color: '#2D2D2D',
        borderRadius: '50px',
        border: '3px solid #2D2D2D',
        boxShadow: '4px 6px 0px rgba(0, 0, 0, 0.3)',
        fontSize: '1rem',
        fontWeight: 600,
        transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
    {message}
    </div>,
    document.body
  )
}
