import { useState, useEffect } from 'react'
import {
  listAllBackgrounds,
  addBackground,
  updateBackground,
  deleteBackground,
  type PostcardBackground,
} from '../../api/postcardApi'
import { listImages, uploadImage, deleteImage, type ImageData } from '../../api/bubbleApi'
import { compressImage } from '../../utils/imageResize'

interface Props {
  isMobile: boolean
}

export function PostcardBackgroundManager({ isMobile }: Props) {
  const [backgrounds, setBackgrounds] = useState<PostcardBackground[]>([])
  const [loading, setLoading] = useState(true)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [images, setImages] = useState<ImageData[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBackgrounds = async () => {
    setLoading(true)
    const bgs = await listAllBackgrounds()
    setBackgrounds(bgs)
    setLoading(false)
  }

  useEffect(() => {
    fetchBackgrounds()
  }, [])

  const handleShowImagePicker = async () => {
    const imgs = await listImages()
    setImages(imgs)
    setShowImagePicker(true)
  }

  const handleUploadAndAdd = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const compressed = await compressImage(file)
      const { data: image, error: uploadError } = await uploadImage(compressed)
      if (image) {
        await addBackground(image.id)
        await fetchBackgrounds()
        setShowImagePicker(false)
      } else {
        setError(uploadError || "Erreur lors de l'upload")
      }
    } catch {
      setError("Erreur lors de la compression de l'image")
    }
    setUploading(false)
  }

  const handlePickExisting = async (imageId: number) => {
    await addBackground(imageId)
    await fetchBackgrounds()
    setShowImagePicker(false)
  }

  const handleDeleteImage = async (img: ImageData) => {
    if (!confirm(`Supprimer l'image "${img.original_name}" ?`)) return
    const ok = await deleteImage(img.id)
    if (ok) {
      setImages((prev) => prev.filter((i) => i.id !== img.id))
    }
  }

  const handleToggleActive = async (bg: PostcardBackground) => {
    await updateBackground(bg.id, { active: !bg.active })
    await fetchBackgrounds()
  }

  const handleUpdateLabel = async (bg: PostcardBackground, label: string) => {
    await updateBackground(bg.id, { label })
    setBackgrounds((prev) =>
      prev.map((b) => (b.id === bg.id ? { ...b, label } : b))
    )
  }

  const handleDelete = async (bg: PostcardBackground) => {
    if (!confirm('Supprimer ce fond ?')) return
    await deleteBackground(bg.id)
    await fetchBackgrounds()
  }

  // Image IDs used by backgrounds (can't delete these)
  const usedImageIds = new Set(backgrounds.map((bg) => bg.image_id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          padding: '1rem 1.25rem',
          background: '#FFFEF5',
          border: '3px solid #2D2D2D',
          borderRadius: '1rem',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <h1
          style={{
            fontSize: isMobile ? '1.25rem' : '1.75rem',
            fontWeight: 800,
            color: '#2D2D2D',
            margin: 0,
          }}
        >
          Fonds de cartes postales
        </h1>
        <button
          onClick={handleShowImagePicker}
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#FFFEF5',
            background: '#902212',
            border: '3px solid #2D2D2D',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.15)',
          }}
        >
          + Ajouter un fond
        </button>
      </div>

      {/* Error toast */}
      {error && (
        <div
          style={{
            marginBottom: '0.75rem',
            padding: '0.75rem 1rem',
            background: '#FF6B6B',
            border: '3px solid #2D2D2D',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#2D2D2D',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#2D2D2D',
              padding: '0 0.25rem',
            }}
          >
            x
          </button>
        </div>
      )}

      {/* Image picker overlay */}
      {showImagePicker && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: '#FFFEF5',
            border: '3px solid #2D2D2D',
            borderRadius: '1rem',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#2D2D2D' }}>
              Choisir ou uploader une image
            </h3>
            <button
              onClick={() => setShowImagePicker(false)}
              style={{
                background: '#FF6B6B',
                border: '2px solid #2D2D2D',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              x
            </button>
          </div>

          {/* Upload */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: '#ECE5DE',
                border: '2px solid #2D2D2D',
                borderRadius: '0.5rem',
                cursor: uploading ? 'wait' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {uploading ? 'Upload...' : 'Uploader une nouvelle image'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadAndAdd(file)
                }}
              />
            </label>
          </div>

          {/* Existing images grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '0.5rem',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {images.map((img) => {
              const isUsed = usedImageIds.has(img.id)
              return (
                <div
                  key={img.id}
                  style={{
                    position: 'relative',
                    border: isUsed ? '2px solid #902212' : '2px solid #ECE5DE',
                    borderRadius: '0.375rem',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => handlePickExisting(img.id)}
                    style={{
                      padding: 0,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'block',
                      width: '100%',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.original_name}
                      style={{ width: '100%', aspectRatio: '148/105', objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                  {isUsed ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: '#902212',
                        color: '#FFFEF5',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: '3px',
                      }}
                    >
                      Utilisé
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteImage(img)
                      }}
                      title="Supprimer l'image"
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '20px',
                        height: '20px',
                        background: '#FF6B6B',
                        border: '1px solid #2D2D2D',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#2D2D2D',
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      x
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Backgrounds grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chargement...</div>
        ) : backgrounds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            Aucun fond. Ajoutez-en un avec le bouton ci-dessus.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '140px' : '200px'}, 1fr))`,
              gap: '1rem',
            }}
          >
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                style={{
                  background: '#FFFEF5',
                  border: '3px solid #2D2D2D',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  opacity: bg.active ? 1 : 0.5,
                  boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div style={{ aspectRatio: '148 / 105', overflow: 'hidden' }}>
                  <img
                    src={bg.image_url}
                    alt={bg.label || 'Fond'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ padding: '0.5rem' }}>
                  <input
                    type="text"
                    value={bg.label || ''}
                    placeholder="Label..."
                    onChange={(e) => handleUpdateLabel(bg, e.target.value)}
                    onBlur={(e) => handleUpdateLabel(bg, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      border: '2px solid #ECE5DE',
                      borderRadius: '4px',
                      background: '#FFFEF5',
                      boxSizing: 'border-box',
                      marginBottom: '0.375rem',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      onClick={() => handleToggleActive(bg)}
                      style={{
                        flex: 1,
                        padding: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: bg.active ? '#90EE90' : '#ECE5DE',
                        border: '2px solid #2D2D2D',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {bg.active ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => handleDelete(bg)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: '#FF6B6B',
                        border: '2px solid #2D2D2D',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#2D2D2D',
                      }}
                    >
                      Suppr.
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
