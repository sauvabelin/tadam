import { useEffect, useRef, useState } from 'react'
// react-pageflip ships its own types; default export is the flipbook component.
import HTMLFlipBook from 'react-pageflip'
import { loadJournalPages } from './pdfJournal'
import type { Journal } from '../../api/journalApi'

interface Props {
  journal: Journal
  onBack: () => void
}

export function JournalViewer({ journal, onBack }: Props) {
  const [pages, setPages] = useState<string[] | null>(null)
  const [aspect, setAspect] = useState(0.707) // width/height, A4-ish default
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    let cancelled = false
    setPages(null)
    setError(false)
    loadJournalPages(journal.url)
      .then((imgs) => {
        if (cancelled) return
        setPages(imgs)
        if (imgs[0]) {
          const probe = new Image()
          probe.onload = () => !cancelled && setAspect(probe.width / probe.height)
          probe.src = imgs[0]
        }
      })
      .catch((e) => {
        console.error('JournalViewer load error', e)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [journal.url])

  // Track available space so the book fits the modal on any screen.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Fit a single page inside the container (leave room for the toolbar).
  const availH = Math.max(box.h - 64, 200)
  const availW = Math.max(box.w, 200)
  let pageH = availH
  let pageW = pageH * aspect
  // On wide screens a spread is 2 pages wide; keep the pair within the box.
  const maxPairW = availW
  if (pageW * 2 > maxPairW) {
    pageW = Math.floor(maxPairW / 2)
    pageH = Math.floor(pageW / aspect)
  }
  pageW = Math.floor(pageW)
  pageH = Math.floor(pageH)

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0, padding: '0.5rem 0.75rem' }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            fontWeight: 700,
            color: '#2D2D2D',
            background: '#ECE5DE',
            border: '2px solid #2D2D2D',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.15)',
          }}
        >
          ← Retour
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {error ? (
          <div style={{ color: '#dc2626' }}>Erreur lors du chargement du journal.</div>
        ) : !pages ? (
          <div style={{ color: '#6b7280' }}>Chargement…</div>
        ) : (
          // key forces a fresh flipbook when dimensions change (HTMLFlipBook is
          // not fully reactive to size prop changes).
          <HTMLFlipBook
            key={`${pageW}x${pageH}`}
            width={pageW}
            height={pageH}
            size="fixed"
            minWidth={0}
            maxWidth={10000}
            minHeight={0}
            maxHeight={10000}
            showCover
            drawShadow
            maxShadowOpacity={0.4}
            flippingTime={700}
            usePortrait
            startPage={0}
            startZIndex={0}
            autoSize={false}
            clickEventForward
            useMouseEvents
            swipeDistance={30}
            showPageCorners
            disableFlipByClick={false}
            mobileScrollSupport
            style={{}}
            className=""
          >
            {pages.map((src, i) => (
              <div key={i} style={{ background: '#FFFEF5', border: '1px solid #ECE5DE' }}>
                <img src={src} alt={`Page ${i + 1}`} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }} />
              </div>
            ))}
          </HTMLFlipBook>
        )}
      </div>
    </div>
  )
}
