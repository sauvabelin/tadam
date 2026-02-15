import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  listImages,
  getUnusedImages,
  deleteImage,
  cleanupUnusedImages,
  ImageData,
} from '../../api/bubbleApi'

interface ImageManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert?: (url: string) => void
}

export function ImageManagerModal({ isOpen, onClose, onInsert }: ImageManagerModalProps) {
  const [images, setImages] = useState<ImageData[]>([])
  const [unusedIds, setUnusedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unused'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadImages = useCallback(async () => {
    setIsLoading(true)
    try {
      const [allImages, unused] = await Promise.all([listImages(), getUnusedImages()])
      setImages(allImages)
      setUnusedIds(new Set(unused.map((img) => img.id)))
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadImages()
      setSearchTerm('')
      setFilter('all')
      setDeleteConfirm(null)
    }
  }, [isOpen, loadImages])

  const handleDelete = useCallback(
    async (id: number) => {
      setIsDeleting(true)
      const success = await deleteImage(id)
      setIsDeleting(false)

      if (success) {
        setImages((prev) => prev.filter((img) => img.id !== id))
        setUnusedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
      setDeleteConfirm(null)
    },
    []
  )

  const handleCleanupUnused = useCallback(async () => {
    if (!confirm('Supprimer toutes les images non utilisées ?')) return

    setIsDeleting(true)
    const count = await cleanupUnusedImages()
    setIsDeleting(false)

    if (count > 0) {
      await loadImages()
    }
  }, [loadImages])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isOpen) return null

  const filteredImages = images
    .filter((img) => (filter === 'unused' ? unusedIds.has(img.id) : true))
    .filter((img) =>
      searchTerm
        ? img.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          img.filename.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    )

  const unusedCount = unusedIds.size

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
          maxWidth: '800px',
          maxHeight: '80vh',
          backgroundColor: '#FFFEF5',
          borderRadius: '16px',
          border: '3px solid #2D2D2D',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
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
            Gestion des images
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

        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid #e5e7eb',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                background: filter === 'all' ? '#2563eb' : 'white',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: filter === 'all' ? 'white' : '#374151',
              }}
            >
              Toutes ({images.length})
            </button>
            <button
              onClick={() => setFilter('unused')}
              style={{
                padding: '0.5rem 1rem',
                background: filter === 'unused' ? '#dc2626' : 'white',
                border: `2px solid ${filter === 'unused' ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: filter === 'unused' ? 'white' : unusedCount > 0 ? '#dc2626' : '#374151',
              }}
            >
              Non utilisées ({unusedCount})
            </button>
          </div>

          {/* Cleanup button */}
          {unusedCount > 0 && (
            <button
              onClick={handleCleanupUnused}
              disabled={isDeleting}
              style={{
                padding: '0.5rem 1rem',
                background: '#fee2e2',
                border: 'none',
                borderRadius: '6px',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Nettoyer
            </button>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem 1.25rem',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Chargement...
            </div>
          ) : filteredImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              {searchTerm ? 'Aucun résultat' : 'Aucune image'}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem',
              }}
            >
              {filteredImages.map((image) => {
                const isUnused = unusedIds.has(image.id)
                const isConfirming = deleteConfirm === image.id

                return (
                  <div
                    key={image.id}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      border: `2px solid ${isUnused ? '#fca5a5' : '#e5e7eb'}`,
                      overflow: 'hidden',
                      background: 'white',
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        aspectRatio: '1',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.original_name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>

                    {/* Unused badge */}
                    {isUnused && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: '#dc2626',
                          color: 'white',
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                        }}
                      >
                        Non utilisée
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ padding: '0.5rem' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: '#374151',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={image.original_name}
                      >
                        {image.original_name}
                      </p>
                      <p
                        style={{
                          margin: '0.125rem 0 0',
                          fontSize: '0.625rem',
                          color: '#9ca3af',
                        }}
                      >
                        {formatFileSize(image.size)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        display: 'flex',
                        borderTop: '1px solid #e5e7eb',
                      }}
                    >
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleDelete(image.id)}
                            disabled={isDeleting}
                            style={{
                              flex: 1,
                              padding: '0.375rem',
                              background: '#dc2626',
                              border: 'none',
                              cursor: isDeleting ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: 'white',
                            }}
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={{
                              flex: 1,
                              padding: '0.375rem',
                              background: '#f3f4f6',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: '#374151',
                            }}
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          {onInsert && (
                            <button
                              onClick={() => {
                                onInsert(image.url)
                                onClose()
                              }}
                              style={{
                                flex: 1,
                                padding: '0.375rem',
                                background: '#10b981',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: 'white',
                              }}
                            >
                              Insérer
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyUrl(image.url)}
                            style={{
                              flex: 1,
                              padding: '0.375rem',
                              background: '#f3f4f6',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: '#374151',
                            }}
                          >
                            Copier URL
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(image.id)}
                            style={{
                              padding: '0.375rem 0.5rem',
                              background: '#fee2e2',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
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
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
