import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  uploadImage,
  listImages,
  getUnusedImages,
  deleteImage,
  cleanupUnusedImages,
  ImageData,
} from '../../api/bubbleApi'
import { compressImage } from '../../utils/imageResize'

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (url: string, alt?: string) => void
  bubbleId?: string
}

type TabType = 'upload' | 'url' | 'collection'

export function ImageUploadModal({
  isOpen,
  onClose,
  onInsert,
  bubbleId,
}: ImageUploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<ImageData | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [altText, setAltText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Collection state
  const [images, setImages] = useState<ImageData[]>([])
  const [unusedIds, setUnusedIds] = useState<Set<number>>(new Set())
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unused'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadImages = useCallback(async () => {
    setIsLoadingImages(true)
    try {
      const [allImages, unused] = await Promise.all([listImages(), getUnusedImages()])
      setImages(allImages)
      setUnusedIds(new Set(unused.map((img) => img.id)))
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setIsLoadingImages(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen && activeTab === 'collection') {
      loadImages()
    }
  }, [isOpen, activeTab, loadImages])

  const resetState = useCallback(() => {
    setPreview(null)
    setUploadedImage(null)
    setUrlInput('')
    setAltText('')
    setError(null)
    setIsUploading(false)
    setIsDragging(false)
    setSearchTerm('')
    setFilter('all')
    setDeleteConfirm(null)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null)

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      if (!validTypes.includes(file.type)) {
        setError('Format non valide. Utilisez JPG, PNG, GIF, WebP ou SVG.')
        return
      }

      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Compress and upload file
      setIsUploading(true)
      const compressed = await compressImage(file)
      const { data, error: uploadError } = await uploadImage(compressed, bubbleId)
      setIsUploading(false)

      if (data) {
        setUploadedImage(data)
        // Refresh collection if loaded
        if (images.length > 0) {
          loadImages()
        }
      } else {
        setError(uploadError || "Erreur lors de l'upload")
        setPreview(null)
      }
    },
    [bubbleId, images.length, loadImages]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInsert = useCallback(() => {
    if (activeTab === 'upload' && uploadedImage) {
      onInsert(uploadedImage.url, altText || undefined)
      handleClose()
    } else if (activeTab === 'url' && urlInput.trim()) {
      onInsert(urlInput.trim(), altText || undefined)
      handleClose()
    }
  }, [activeTab, uploadedImage, urlInput, altText, onInsert, handleClose])

  const handleInsertFromCollection = useCallback(
    (url: string) => {
      onInsert(url)
      handleClose()
    },
    [onInsert, handleClose]
  )

  const handleDelete = useCallback(async (id: number) => {
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
  }, [])

  const handleCleanupUnused = useCallback(async () => {
    if (!confirm('Supprimer toutes les images non utilisées ?')) return

    setIsDeleting(true)
    const count = await cleanupUnusedImages()
    setIsDeleting(false)

    if (count > 0) {
      await loadImages()
    }
  }, [loadImages])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isOpen) return null

  const canInsert =
    (activeTab === 'upload' && uploadedImage !== null) ||
    (activeTab === 'url' && urlInput.trim() !== '')

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
        onClick={handleClose}
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
          maxWidth: activeTab === 'collection' ? '800px' : '500px',
          maxHeight: '85vh',
          backgroundColor: '#FFFEF5',
          borderRadius: '16px',
          border: '3px solid #2D2D2D',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-width 0.2s ease',
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
            Ajouter une image
          </h2>
          <button
            onClick={handleClose}
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

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #e5e7eb',
          }}
        >
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'upload' ? '#FFFEF5' : '#f3f4f6',
              border: 'none',
              borderBottom:
                activeTab === 'upload' ? '3px solid #902212' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'upload' ? 600 : 400,
              color: activeTab === 'upload' ? '#902212' : '#6b7280',
            }}
          >
            Uploader
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'collection' ? '#FFFEF5' : '#f3f4f6',
              border: 'none',
              borderBottom:
                activeTab === 'collection' ? '3px solid #902212' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'collection' ? 600 : 400,
              color: activeTab === 'collection' ? '#902212' : '#6b7280',
            }}
          >
            Collection
          </button>
          <button
            onClick={() => setActiveTab('url')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'url' ? '#FFFEF5' : '#f3f4f6',
              border: 'none',
              borderBottom:
                activeTab === 'url' ? '3px solid #902212' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'url' ? 600 : 400,
              color: activeTab === 'url' ? '#902212' : '#6b7280',
            }}
          >
            URL externe
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'upload' && (
            <div style={{ padding: '1.25rem' }}>
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#902212' : '#d1d5db'}`,
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragging ? '#fef2f2' : '#f9fafb',
                  transition: 'all 0.2s',
                }}
              >
                {preview ? (
                  <div>
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                      }}
                    />
                    {isUploading && (
                      <p style={{ color: '#6b7280', margin: 0 }}>Upload en cours...</p>
                    )}
                    {uploadedImage && (
                      <p style={{ color: '#10b981', margin: 0 }}>Upload réussi</p>
                    )}
                  </div>
                ) : (
                  <>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      style={{ marginBottom: '0.75rem' }}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p style={{ color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                      Glissez une image ici
                    </p>
                    <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.875rem' }}>
                      ou cliquez pour parcourir
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                style={{ display: 'none' }}
              />

              {/* Alt text input */}
              <div style={{ marginTop: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Texte alternatif (optionnel)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Description de l'image"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Error message */}
              {error && (
                <p
                  style={{
                    color: '#ef4444',
                    marginTop: '0.75rem',
                    marginBottom: 0,
                    fontSize: '0.875rem',
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div style={{ padding: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                URL de l'image
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />

              {/* Alt text input */}
              <div style={{ marginTop: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Texte alternatif (optionnel)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Description de l'image"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'collection' && (
            <>
              {/* Collection toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.25rem',
                  borderBottom: '1px solid #e5e7eb',
                  flexWrap: 'wrap',
                }}
              >
                {/* Search */}
                <div style={{ flex: 1, minWidth: '150px' }}>
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
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    onClick={() => setFilter('all')}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: filter === 'all' ? '#902212' : 'white',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      color: filter === 'all' ? 'white' : '#374151',
                    }}
                  >
                    Toutes ({images.length})
                  </button>
                  <button
                    onClick={() => setFilter('unused')}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: filter === 'unused' ? '#dc2626' : 'white',
                      border: `2px solid ${filter === 'unused' ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.75rem',
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
                      padding: '0.375rem 0.75rem',
                      background: '#fee2e2',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
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

              {/* Image grid */}
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '1rem 1.25rem',
                }}
              >
                {isLoadingImages ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    Chargement...
                  </div>
                ) : filteredImages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    {searchTerm ? 'Aucun résultat' : 'Aucune image uploadée'}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: '0.75rem',
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
                            onClick={() => !isConfirming && handleInsertFromCollection(image.url)}
                            style={{
                              aspectRatio: '1',
                              background: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              cursor: isConfirming ? 'default' : 'pointer',
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
                                top: '0.25rem',
                                right: '0.25rem',
                                background: '#dc2626',
                                color: 'white',
                                fontSize: '0.5rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.25rem',
                                borderRadius: '3px',
                              }}
                            >
                              Non utilisée
                            </div>
                          )}

                          {/* Info */}
                          <div style={{ padding: '0.375rem' }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.625rem',
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
                                margin: 0,
                                fontSize: '0.5rem',
                                color: '#9ca3af',
                              }}
                            >
                              {formatFileSize(image.size)}
                            </p>
                          </div>

                          {/* Delete action */}
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
                                    padding: '0.25rem',
                                    background: '#dc2626',
                                    border: 'none',
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    fontSize: '0.625rem',
                                    fontWeight: 500,
                                    color: 'white',
                                  }}
                                >
                                  Oui
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  style={{
                                    flex: 1,
                                    padding: '0.25rem',
                                    background: '#f3f4f6',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.625rem',
                                    fontWeight: 500,
                                    color: '#374151',
                                  }}
                                >
                                  Non
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirm(image.id)
                                }}
                                style={{
                                  flex: 1,
                                  padding: '0.25rem',
                                  background: '#fee2e2',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.625rem',
                                  fontWeight: 500,
                                  color: '#dc2626',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer - only for upload/url tabs */}
        {activeTab !== 'collection' && (
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
              onClick={handleClose}
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
              onClick={handleInsert}
              disabled={!canInsert || isUploading}
              style={{
                padding: '0.625rem 1.25rem',
                background: canInsert && !isUploading ? '#902212' : '#d1d5db',
                border: 'none',
                borderRadius: '8px',
                cursor: canInsert && !isUploading ? 'pointer' : 'not-allowed',
                fontWeight: 500,
                color: 'white',
              }}
            >
              Insérer
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
