import { useState, useEffect, useCallback } from 'react'
import { getPostcardPreview, type PostcardSubmission } from '../../api/postcardApi'
import type { Role } from '../../data/troupes'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const CARD_ASPECT = 148 / 105

interface Props {
  backgroundId: number
  backgroundImageUrl: string
  message: string
  role: string
  name: string
  troupe: string
}

export function PostcardPreview({
  backgroundId,
  backgroundImageUrl,
  message,
  role,
  name,
  troupe,
}: Props) {
  const [flipped, setFlipped] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const renderPdfToImage = useCallback(async (pdfBlob: Blob): Promise<string> => {
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)

    // Render at 2x for crisp display
    const scale = 2
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({ canvas, viewport }).promise

    return canvas.toDataURL('image/png')
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchPreview = async () => {
      setLoading(true)
      setError(false)

      // role typed as string here because callers (wizard) hold raw form state;
      // the cast is safe — preview is only reached after the role select is set.
      const data: PostcardSubmission = {
        background_id: backgroundId,
        message,
        role: role as Role,
        name: name.trim(),
        troupe: troupe || undefined,
      }

      try {
        const result = await getPostcardPreview(data)
        if (cancelled) return

        if (result.ok) {
          const dataUrl = await renderPdfToImage(result.data)
          if (cancelled) return
          setImageUrl(dataUrl)
        } else {
          setError(true)
        }
      } catch (e) {
        console.error('PostcardPreview render error:', e)
        if (!cancelled) setError(true)
      }
      if (!cancelled) setLoading(false)
    }

    // Debounce: every keystroke triggers this effect; without a wait the
    // server re-renders a PDF per character and burns the rate limiter.
    const timer = setTimeout(fetchPreview, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [backgroundId, message, role, name, troupe, renderPdfToImage])

  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700, color: '#2D2D2D', textAlign: 'center' }}>
        Aperçu de ta carte
      </h3>

      {/* Card container with 3D flip. Responsive + proportion-correct: a 780px
          desktop cap that scales down via 100% on narrower screens. True
          physical size isn't portable (CSS has no real-DPI unit), so we don't
          chase cm — the A6 aspect ratio keeps proportions exact on every
          display, and this preview is a rendered image of the true-A6 PDF. */}
      <div
        style={{
          perspective: '1000px',
          width: 'min(780px, 100%)',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: String(CARD_ASPECT),
            transition: 'transform 0.6s',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'none',
          }}
        >
          {/* Back side (default) - rendered PDF image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              border: '3px solid #2D2D2D',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              background: '#FFFEF5',
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.1)',
            }}
          >
            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#888',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid #ECE5DE',
                    borderTop: '3px solid #902212',
                    borderRadius: '50%',
                    animation: 'postcardSpin 0.8s linear infinite',
                    margin: '0 auto 8px',
                  }} />
                  Chargement...
                </div>
              </div>
            )}
            {error && !loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  padding: '1rem',
                  textAlign: 'center',
                }}
              >
                Erreur lors de la génération de l'aperçu.
              </div>
            )}
            {imageUrl && !loading && (
              <img
                src={imageUrl}
                alt="Verso de la carte"
                style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
              />
            )}
          </div>

          {/* Front side - background image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              border: '3px solid #2D2D2D',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.1)',
            }}
          >
            <img
              src={backgroundImageUrl}
              alt="Recto de la carte"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        </div>
      </div>

      {/* Flip button */}
      <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
        <button
          onClick={() => setFlipped(!flipped)}
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#2D2D2D',
            background: '#ECE5DE',
            border: '2px solid #2D2D2D',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ddd5c8' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ECE5DE' }}
        >
          {flipped ? 'Voir le verso' : 'Voir le recto'}
        </button>
      </div>

      <style>{`
        @keyframes postcardSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
