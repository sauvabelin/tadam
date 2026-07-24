import { useState, useEffect } from 'react'
import { getJournaux, type Journal } from '../../api/journalApi'
import { loadJournalCover } from './pdfJournal'
import { JournalViewer } from './JournalViewer'

function CoverCard({ journal, onOpen }: { journal: Journal; onOpen: () => void }) {
  const [cover, setCover] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadJournalCover(journal.url)
      .then((src) => !cancelled && setCover(src))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [journal.url])

  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: '#FFFEF5',
        border: '3px solid #2D2D2D',
        borderRadius: '0.75rem',
        padding: '0.6rem',
        cursor: 'pointer',
        boxShadow: '3px 3px 0px rgba(0,0,0,0.15)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '0.707',
          background: '#ECE5DE',
          border: '2px solid #2D2D2D',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cover ? (
          <img src={cover} alt={journal.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : failed ? (
          <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>PDF</span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>…</span>
        )}
      </div>
      <span style={{ fontWeight: 700, color: '#2D2D2D', fontSize: '0.9rem' }}>{journal.title}</span>
    </button>
  )
}

export function JournalContent() {
  const [journaux, setJournaux] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Journal | null>(null)

  useEffect(() => {
    let cancelled = false
    getJournaux().then((res) => {
      if (cancelled) return
      if (res.ok) setJournaux(res.data)
      else setError(res.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (selected) {
    return (
      <div style={{ height: '100%', minHeight: '60vh' }}>
        <JournalViewer journal={selected} onBack={() => setSelected(null)} />
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', height: '100%', overflow: 'auto' }}>
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Chargement…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#dc2626', padding: '2rem' }}>{error}</div>
      ) : journaux.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Aucun journal pour le moment.</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '1rem',
          }}
        >
          {journaux.map((j) => (
            <CoverCard key={j.id} journal={j} onOpen={() => setSelected(j)} />
          ))}
        </div>
      )}
    </div>
  )
}
