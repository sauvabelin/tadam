import { useState, useEffect } from 'react'
import {
  getJournaux,
  uploadJournal,
  updateJournalTitle,
  deleteJournal,
  type Journal,
} from '../../api/journalApi'

interface Props {
  isMobile: boolean
}

const MAX_SIZE = 10 * 1024 * 1024

export function JournalManager({ isMobile }: Props) {
  const [journaux, setJournaux] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getJournaux().then((res) => {
      if (cancelled) return
      if (res.ok) setJournaux(res.data)
      else setError(`Chargement: ${res.error}`)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleFile = (f: File | null) => {
    setFile(f)
    if (f && !title) setTitle(f.name.replace(/\.pdf$/i, ''))
  }

  const handleUpload = async () => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Fichier trop volumineux (max 10 Mo).')
      return
    }
    setUploading(true)
    setError(null)
    const res = await uploadJournal(file, title.trim() || file.name)
    setUploading(false)
    if (!res.ok) {
      setError(`Envoi: ${res.error}`)
      return
    }
    setJournaux((prev) => [res.data, ...prev])
    setFile(null)
    setTitle('')
  }

  const handleRename = async (id: number) => {
    const res = await updateJournalTitle(id, editTitle.trim())
    if (!res.ok) {
      setError(`Renommage: ${res.error}`)
      return
    }
    setJournaux((prev) => prev.map((j) => (j.id === id ? res.data : j)))
    setEditingId(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce journal ?')) return
    const res = await deleteJournal(id)
    if (!res.ok) {
      setError(`Suppression: ${res.error}`)
      return
    }
    setJournaux((prev) => prev.filter((j) => j.id !== id))
  }

  const card: React.CSSProperties = {
    background: '#FFFEF5',
    border: '3px solid #2D2D2D',
    borderRadius: '1rem',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
  }
  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    fontSize: '0.9rem',
    border: '2px solid #2D2D2D',
    borderRadius: '0.5rem',
    background: '#FFFEF5',
    fontFamily: 'inherit',
  }
  const btn: React.CSSProperties = {
    padding: '0.5rem 1rem',
    fontWeight: 700,
    color: '#FFFEF5',
    background: '#902212',
    border: '3px solid #2D2D2D',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
  }
  const fileBtn: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    background: '#ECE5DE',
    border: '2px solid #2D2D2D',
    borderRadius: '0.5rem',
    cursor: uploading ? 'wait' : 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#2D2D2D',
    whiteSpace: 'nowrap',
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
            fontWeight: 600,
            color: '#2D2D2D',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            x
          </button>
        </div>
      )}

      <div style={card}>
        <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: 800, color: '#2D2D2D', margin: '0 0 1rem' }}>
          Journaux
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={fileBtn}>
            {file ? 'Changer de PDF' : 'Choisir un PDF'}
            <input
              type="file"
              accept="application/pdf"
              disabled={uploading}
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {file && (
            <span
              style={{
                fontSize: '0.85rem',
                color: '#4a4a4a',
                maxWidth: '220px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={file.name}
            >
              {file.name}
            </span>
          )}
          <input
            type="text"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
          />
          <button onClick={handleUpload} disabled={!file || uploading} style={{ ...btn, opacity: !file || uploading ? 0.5 : 1 }}>
            {uploading ? 'Envoi…' : 'Ajouter'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chargement...</div>
        ) : journaux.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Aucun journal.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {journaux.map((j) => (
              <div
                key={j.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: '#FFFEF5',
                  border: '3px solid #2D2D2D',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                }}
              >
                {editingId === j.id ? (
                  <>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={() => handleRename(j.id)} style={btn}>OK</button>
                    <button onClick={() => setEditingId(null)} style={{ ...inputStyle, cursor: 'pointer' }}>Annuler</button>
                  </>
                ) : (
                  <>
                    <a href={j.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontWeight: 700, color: '#2D2D2D', textDecoration: 'none' }}>
                      {j.title}
                    </a>
                    <button
                      onClick={() => { setEditingId(j.id); setEditTitle(j.title) }}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      Renommer
                    </button>
                    <button
                      onClick={() => handleDelete(j.id)}
                      style={{ padding: '0.35rem 0.6rem', fontWeight: 600, background: '#FF6B6B', border: '2px solid #2D2D2D', borderRadius: '4px', cursor: 'pointer', color: '#2D2D2D' }}
                    >
                      Suppr.
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
