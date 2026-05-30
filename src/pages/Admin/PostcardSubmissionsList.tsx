import { useState, useEffect } from 'react'
import {
  listPostcards,
  listAllBackgrounds,
  deletePostcard,
  fetchExportPdf,
  type Postcard,
  type PostcardBackground,
} from '../../api/postcardApi'
import { PostcardPreview } from '../../components/postcards/PostcardPreview'

interface Props {
  isMobile: boolean
}

export function PostcardSubmissionsList({ isMobile }: Props) {
  const [postcards, setPostcards] = useState<Postcard[]>([])
  const [backgrounds, setBackgrounds] = useState<PostcardBackground[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [backgroundFilter, setBackgroundFilter] = useState<number | ''>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    // Guard against out-of-order resolution: rapid filter changes fire
    // overlapping fetches, and a stale one must not overwrite fresher data.
    let cancelled = false
    setLoading(true)
    Promise.all([
      listPostcards({
        from: fromDate || undefined,
        to: toDate || undefined,
        background_id: backgroundFilter || undefined,
      }),
      listAllBackgrounds(),
    ]).then(([pcs, bgs]) => {
      if (cancelled) return
      if (pcs.ok) setPostcards(pcs.data)
      else setError(`Chargement: ${pcs.error}`)
      if (bgs.ok) setBackgrounds(bgs.data)
      else setError(`Chargement: ${bgs.error}`)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [fromDate, toDate, backgroundFilter])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette carte postale ?')) return
    const result = await deletePostcard(id)
    if (!result.ok) {
      setError(`Suppression: ${result.error}`)
      return
    }
    setPostcards((prev) => prev.filter((p) => p.id !== id))
  }

  const handleExport = async (bgId: number) => {
    // window.open can't send the Bearer header; fetch the blob with auth and
    // trigger a download via a transient anchor.
    const result = await fetchExportPdf(bgId, fromDate || undefined, toDate || undefined)
    if (!result.ok) {
      setError(`Export: ${result.error}`)
      return
    }
    const url = URL.createObjectURL(result.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `postcards_bg${bgId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stripHtml = (html: string) => {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent || ''
  }

  // Group postcards by background for export buttons
  const backgroundsWithCards = backgrounds.filter((bg) =>
    postcards.some((p) => p.background_id === bg.id)
  )

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    border: '2px solid #2D2D2D',
    borderRadius: '0.5rem',
    background: '#FFFEF5',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          background: '#FFFEF5',
          border: '3px solid #2D2D2D',
          borderRadius: '1rem',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
          marginBottom: '1rem',
        }}
      >
        <h1
          style={{
            fontSize: isMobile ? '1.25rem' : '1.75rem',
            fontWeight: 800,
            color: '#2D2D2D',
            margin: '0 0 1rem',
          }}
        >
          Cartes postales soumises
        </h1>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#4a4a4a' }}>
              Du
            </label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#4a4a4a' }}>
              Au
            </label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#4a4a4a' }}>
              Fond
            </label>
            <select
              value={backgroundFilter}
              onChange={(e) => setBackgroundFilter(e.target.value ? Number(e.target.value) : '')}
              style={inputStyle}
            >
              <option value="">Tous</option>
              {backgrounds.map((bg) => (
                <option key={bg.id} value={bg.id}>
                  {bg.label || `Fond #${bg.id}`}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0]
              setFromDate(today + 'T00:00')
              setToDate(today + 'T23:59')
            }}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#2D2D2D',
              background: '#ECE5DE',
              border: '2px solid #2D2D2D',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Aujourd'hui
          </button>
        </div>

        {/* Export buttons */}
        {backgroundsWithCards.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4a4a4a', alignSelf: 'center' }}>
              Exporter PDF :
            </span>
            {backgroundsWithCards.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleExport(bg.id)}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: '#ECE5DE',
                  border: '2px solid #2D2D2D',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  color: '#2D2D2D',
                }}
              >
                {bg.label || `Fond #${bg.id}`} ({postcards.filter((p) => p.background_id === bg.id).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chargement...</div>
        ) : postcards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            Aucune carte postale trouvée.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {postcards.map((pc) => (
              <div
                key={pc.id}
                style={{
                  background: '#FFFEF5',
                  border: '3px solid #2D2D2D',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Summary row */}
                <div
                  onClick={() => setExpandedId(expandedId === pc.id ? null : pc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Thumbnail */}
                  {pc.background_image_url && (
                    <img
                      src={pc.background_image_url}
                      alt=""
                      style={{
                        width: '40px',
                        height: '28px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid #ECE5DE',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2D2D2D' }}>
                      {pc.role} {pc.name}
                      {pc.troupe && <span style={{ fontWeight: 400, color: '#6b7280' }}> - {pc.troupe}</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stripHtml(pc.message).substring(0, 80)}...
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {new Date(pc.created_at).toLocaleString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(pc.id)
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: '#FF6B6B',
                      border: '2px solid #2D2D2D',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#2D2D2D',
                      flexShrink: 0,
                    }}
                  >
                    Suppr.
                  </button>
                </div>

                {/* Expanded detail - realistic preview */}
                {expandedId === pc.id && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderTop: '2px solid #ECE5DE',
                      background: '#f9f8f3',
                    }}
                  >
                    <PostcardPreview
                      backgroundId={pc.background_id}
                      backgroundImageUrl={pc.background_image_url || ''}
                      message={pc.message}
                      role={pc.role}
                      name={pc.name}
                      troupe={pc.troupe || ''}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
