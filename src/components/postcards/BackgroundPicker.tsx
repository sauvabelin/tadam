import { useState, useEffect } from 'react'
import { getPostcardBackgrounds, type PostcardBackground } from '../../api/postcardApi'

interface Props {
  selectedId: number | null
  onSelect: (id: number, imageUrl: string) => void
}

export function BackgroundPicker({ selectedId, onSelect }: Props) {
  const [backgrounds, setBackgrounds] = useState<PostcardBackground[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPostcardBackgrounds().then((result) => {
      if (result.ok) setBackgrounds(result.data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        Chargement des fonds...
      </div>
    )
  }

  if (backgrounds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        Aucun fond disponible pour le moment.
      </div>
    )
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#2D2D2D' }}>
        Choisis un fond pour ta carte postale
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {backgrounds.map((bg) => (
          <button
            key={bg.id}
            onClick={() => onSelect(bg.id, bg.image_url)}
            style={{
              padding: 0,
              background: '#FFFEF5',
              border: selectedId === bg.id ? '3px solid #902212' : '3px solid #ECE5DE',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.2s',
              boxShadow: selectedId === bg.id
                ? '4px 4px 0px rgba(144, 34, 18, 0.3)'
                : '2px 2px 0px rgba(0, 0, 0, 0.1)',
              transform: selectedId === bg.id ? 'translateY(-2px)' : 'none',
            }}
          >
            <div style={{ aspectRatio: '148 / 105', overflow: 'hidden' }}>
              <img
                src={bg.image_url}
                alt={bg.label || 'Fond'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            {bg.label && (
              <div
                style={{
                  padding: '0.375rem 0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#2D2D2D',
                  textAlign: 'center',
                  borderTop: '2px solid #ECE5DE',
                }}
              >
                {bg.label}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
