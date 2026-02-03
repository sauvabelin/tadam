import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string) => void
  initialUrl?: string
}

export function LinkModal({ isOpen, onClose, onSubmit, initialUrl = '' }: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl)
      setError(null)
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, initialUrl])

  const handleSubmit = useCallback(() => {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      setError('Veuillez entrer une URL')
      return
    }

    // Basic URL validation
    try {
      // Allow relative URLs starting with / or #
      if (!trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('#')) {
        // Try to parse as absolute URL
        const parsed = new URL(
          trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`
        )
        onSubmit(parsed.href)
      } else {
        onSubmit(trimmedUrl)
      }
      onClose()
    } catch {
      setError('URL non valide')
    }
  }, [url, onSubmit, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [handleSubmit, onClose]
  )

  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '90vw',
          maxWidth: '400px',
          backgroundColor: '#FFFEF5',
          borderRadius: '16px',
          border: '3px solid #2D2D2D',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '2px solid #e5e7eb',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#1a1a2e',
            }}
          >
            Ajouter un lien
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              background: '#FF6B6B',
              border: '2px solid #2D2D2D',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#2D2D2D',
            }}
          >
            x
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            URL
          </label>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="https://exemple.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${error ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p
              style={{
                color: '#ef4444',
                marginTop: '0.5rem',
                marginBottom: 0,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderTop: '2px solid #e5e7eb',
            background: '#f9fafb',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'white',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '0.625rem 1.25rem',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              color: 'white',
            }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
