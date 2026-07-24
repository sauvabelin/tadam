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

  // Fit the book inside the container (leave room for the toolbar + padding).
  // The book always renders as a two-page spread, so the pair must fit availW.
  const availH = Math.max(box.h - 88, 200)
  const availW = Math.max(box.w - 32, 200)
  let pageH = availH
  let pageW = pageH * aspect
  if (pageW * 2 > availW) {
    pageW = Math.floor(availW / 2)
    pageH = Math.floor(pageW / aspect)
  }
  pageW = Math.floor(pageW)
  pageH = Math.floor(pageH)

  // Show page 1 alone, then inner spreads, then the last page alone — while
  // keeping every page soft (paper-bend). showCover would give the layout but
  // forces the cover pages rigid (hardcover flip), so instead a leading blank
  // puts page 1 on the right by itself, and trailing blank(s) pad to an even
  // count so the final page also stands alone.
  const bookPages: (string | null)[] | null = pages
    ? (() => {
        const arr: (string | null)[] = [null, ...pages]
        while (arr.length % 2 !== 0) arr.push(null)
        return arr
      })()
    : null

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

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '16px',
          background: '#FFE218',
          borderRadius: '0.5rem',
        }}
      >
        {error ? (
          <div style={{ color: '#dc2626' }}>Erreur lors du chargement du journal.</div>
        ) : !bookPages ? (
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
            showCover={false}
            drawShadow
            maxShadowOpacity={0.5}
            flippingTime={700}
            usePortrait={false}
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
            {bookPages.map((src, i) => (
              <div
                key={i}
                data-density="soft"
                style={
                  src
                    ? { background: '#FFFEF5', border: '1px solid #2D2D2D', boxSizing: 'border-box' }
                    : // Blank facing page: match the yellow backdrop with no
                      // border so it disappears and the real page stands alone.
                      { background: '#FFE218', border: 'none', boxSizing: 'border-box' }
                }
              >
                {src ? (
                  <img src={src} alt={`Page ${i}`} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#FFE218' }} />
                )}
              </div>
            ))}
          </HTMLFlipBook>
        )}
      </div>
    </div>
  )
}
