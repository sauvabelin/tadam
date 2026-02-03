import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Editor } from '@tiptap/react'

interface LinkPopoverProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  position: { top: number; left: number }
}

export function LinkPopover({ editor, isOpen, onClose, position }: LinkPopoverProps) {
  const [url, setUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current link URL from editor
  useEffect(() => {
    if (isOpen) {
      const attrs = editor.getAttributes('link')
      setUrl(attrs.href || '')
      setIsEditing(false)
    }
  }, [isOpen, editor])

  // Focus input when editing
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleOpenLink = useCallback(() => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [url])

  const handleRemoveLink = useCallback(() => {
    editor.chain().focus().unsetLink().run()
    onClose()
  }, [editor, onClose])

  const handleSaveUrl = useCallback(() => {
    if (url.trim()) {
      let finalUrl = url.trim()
      // Add protocol if missing
      if (!finalUrl.startsWith('http') && !finalUrl.startsWith('/') && !finalUrl.startsWith('#')) {
        finalUrl = `https://${finalUrl}`
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run()
    }
    setIsEditing(false)
  }, [url, editor])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSaveUrl()
      } else if (e.key === 'Escape') {
        setIsEditing(false)
      }
    },
    [handleSaveUrl]
  )

  if (!isOpen) return null

  // Adjust position to keep popover in viewport
  const adjustedPosition = {
    top: position.top,
    left: Math.min(position.left, window.innerWidth - 320),
  }

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 10000,
        backgroundColor: '#FFFEF5',
        borderRadius: '10px',
        border: '2px solid #2D2D2D',
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
        minWidth: '280px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '0.75rem' }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://exemple.com"
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
            <button
              onClick={handleSaveUrl}
              style={{
                padding: '0.5rem 0.75rem',
                background: '#10b981',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'white',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              OK
            </button>
          </div>
        ) : (
          <>
            {/* URL display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: '#f3f4f6',
                borderRadius: '6px',
                marginBottom: '0.75rem',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span
                style={{
                  flex: 1,
                  fontSize: '0.875rem',
                  color: '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {url || 'Pas de lien'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem',
                  background: 'white',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Modifier
              </button>
              <button
                onClick={handleOpenLink}
                disabled={!url}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem',
                  background: url ? '#2563eb' : '#d1d5db',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: url ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'white',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Ouvrir
              </button>
              <button
                onClick={handleRemoveLink}
                style={{
                  padding: '0.5rem',
                  background: '#fee2e2',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Supprimer le lien"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
