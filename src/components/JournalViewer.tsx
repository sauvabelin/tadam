import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import {
  listJournalEntries,
  getJournalEntry,
  type JournalEntry,
  type JournalEntryMeta,
} from '../api/journalApi'
import { LoadingSpinner } from './LoadingSpinner'

function formatDate(dateStr: string): string {
  // Parse as local date to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function JournalViewer() {
  const [entries, setEntries] = useState<JournalEntryMeta[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEntry, setIsLoadingEntry] = useState(false)

  const loadEntry = useCallback(async (date: string) => {
    setIsLoadingEntry(true)
    const entry = await getJournalEntry(date)
    setCurrentEntry(entry)
    setIsLoadingEntry(false)
  }, [])

  useEffect(() => {
    async function init() {
      const all = await listJournalEntries()
      setEntries(all)
      if (all.length > 0) {
        const lastIdx = all.length - 1
        setCurrentIndex(lastIdx)
        await loadEntry(all[lastIdx].entry_date)
      }
      setIsLoading(false)
    }
    init()
  }, [loadEntry])

  const goTo = (index: number) => {
    if (index < 0 || index >= entries.length || index === currentIndex) return
    setCurrentIndex(index)
    loadEntry(entries[index].entry_date)
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px',
        }}
      >
        <LoadingSpinner size={48} color="#902212" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px',
          color: '#6b7280',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <p style={{ margin: 0, fontSize: '1.1rem' }}>Pas encore d'entrées de journal.</p>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Revenez bientôt !</p>
      </div>
    )
  }

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < entries.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Navigation header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: '2px solid #ECE5DE',
          gap: '0.75rem',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={!hasPrev}
          style={{
            padding: '0.4rem 0.9rem',
            background: hasPrev ? '#902212' : '#ECE5DE',
            color: hasPrev ? '#FFFEF5' : '#aaa',
            border: '2px solid',
            borderColor: hasPrev ? '#2D2D2D' : '#ccc',
            borderRadius: '0.5rem',
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.15s',
            boxShadow: hasPrev ? '2px 2px 0px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          ← Précédent
        </button>

        <span
          style={{
            fontSize: '0.8rem',
            color: '#888',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {currentIndex + 1} / {entries.length}
        </span>

        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={!hasNext}
          style={{
            padding: '0.4rem 0.9rem',
            background: hasNext ? '#902212' : '#ECE5DE',
            color: hasNext ? '#FFFEF5' : '#aaa',
            border: '2px solid',
            borderColor: hasNext ? '#2D2D2D' : '#ccc',
            borderRadius: '0.5rem',
            cursor: hasNext ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.15s',
            boxShadow: hasNext ? '2px 2px 0px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          Suivant →
        </button>
      </div>

      {/* Entry content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {isLoadingEntry ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '150px',
            }}
          >
            <LoadingSpinner size={36} color="#902212" />
          </div>
        ) : currentEntry ? (
          <>
            <p
              style={{
                margin: '0 0 0.25rem 0',
                fontSize: '0.85rem',
                color: '#902212',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {formatDate(currentEntry.entry_date)}
            </p>
            {currentEntry.title && (
              <h2
                style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#2D2D2D',
                  lineHeight: 1.2,
                }}
              >
                {currentEntry.title}
              </h2>
            )}
            <div className="bubble-content">
              {currentEntry.content ? (
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {currentEntry.content}
                </ReactMarkdown>
              ) : (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  Contenu en cours de rédaction...
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Date picker row: jump to any entry */}
      {entries.length > 1 && (
        <div
          style={{
            padding: '0.5rem 1rem',
            borderTop: '2px solid #ECE5DE',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>
            Aller à :
          </span>
          <select
            value={entries[currentIndex]?.entry_date ?? ''}
            onChange={(e) => {
              const idx = entries.findIndex((en) => en.entry_date === e.target.value)
              if (idx !== -1) goTo(idx)
            }}
            style={{
              fontSize: '0.8rem',
              padding: '0.25rem 0.5rem',
              border: '2px solid #2D2D2D',
              borderRadius: '0.375rem',
              background: '#FFFEF5',
              color: '#2D2D2D',
              cursor: 'pointer',
            }}
          >
            {entries.map((en) => (
              <option key={en.entry_date} value={en.entry_date}>
                {formatDate(en.entry_date)}{en.title ? ` — ${en.title}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <style>{`
        .bubble-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a1a2e;
        }
        .bubble-content h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; color: #1a1a2e; }
        .bubble-content h2 { font-size: 1.5em; font-weight: 600; margin: 0.75em 0 0.5em; color: #1a1a2e; }
        .bubble-content h3 { font-size: 1.25em; font-weight: 600; margin: 0.75em 0 0.5em; color: #1a1a2e; }
        .bubble-content p { margin: 0.75em 0; }
        .bubble-content ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .bubble-content ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .bubble-content li { margin: 0.25em 0; }
        .bubble-content blockquote { border-left: 4px solid #902212; padding-left: 1em; margin: 1em 0; color: #4b5563; font-style: italic; }
        .bubble-content pre { background: #1f2937; color: #f9fafb; padding: 1em; border-radius: 0.5rem; overflow-x: auto; margin: 1em 0; }
        .bubble-content code { background: #e5e7eb; padding: 0.2em 0.4em; border-radius: 0.25rem; font-size: 0.9em; }
        .bubble-content pre code { background: none; padding: 0; }
        .bubble-content a { color: #902212; text-decoration: underline; }
        .bubble-content img { max-width: 100%; height: auto; border-radius: 0.5rem; }
      `}</style>
    </div>
  )
}
