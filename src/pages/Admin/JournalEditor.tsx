import { useState, useEffect, useCallback } from 'react'
import {
  listJournalEntries,
  getJournalEntry,
  saveJournalEntry,
  deleteJournalEntry,
  exportJournalPdf,
  type JournalEntry,
  type JournalEntryMeta,
} from '../../api/journalApi'

interface JournalEditorProps {
  isMobile: boolean
}

function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-CH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function JournalEditor({ isMobile }: JournalEditorProps) {
  const [entries, setEntries] = useState<JournalEntryMeta[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editDate, setEditDate] = useState(today())
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')

  const loadEntries = useCallback(async () => {
    const all = await listJournalEntries()
    // Display most recent first in the list
    setEntries([...all].reverse())
  }, [])

  useEffect(() => {
    async function init() {
      setIsLoading(true)
      await loadEntries()
      setIsLoading(false)
    }
    init()
  }, [loadEntries])

  const selectEntry = async (meta: JournalEntryMeta) => {
    setIsNew(false)
    setSelectedDate(meta.entry_date)
    setError(null)
    setSaveSuccess(false)
    const entry = await getJournalEntry(meta.entry_date)
    if (entry) {
      setEditDate(entry.entry_date)
      setEditTitle(entry.title)
      setEditContent(entry.content ?? '')
    }
  }

  const startNew = () => {
    setIsNew(true)
    setSelectedDate(null)
    setEditDate(today())
    setEditTitle('')
    setEditContent('')
    setError(null)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!editDate) {
      setError('La date est requise')
      return
    }
    if (!editTitle.trim()) {
      setError('Le titre est requis')
      return
    }

    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    const saved = await saveJournalEntry(editDate, {
      title: editTitle.trim(),
      content: editContent,
    })

    if (saved) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      setIsNew(false)
      setSelectedDate(editDate)
      await loadEntries()
    } else {
      setError('Erreur lors de la sauvegarde')
    }

    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedDate) return
    if (!confirm(`Supprimer l'entrée du ${formatDateLabel(selectedDate)} ?`)) return

    setIsDeleting(true)
    setError(null)

    const ok = await deleteJournalEntry(selectedDate)

    if (ok) {
      setSelectedDate(null)
      setIsNew(false)
      setEditDate(today())
      setEditTitle('')
      setEditContent('')
      await loadEntries()
    } else {
      setError("Erreur lors de la suppression")
    }

    setIsDeleting(false)
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      await exportJournalPdf(exportFrom || undefined, exportTo || undefined)
    } catch {
      setError("Erreur lors de l'export PDF")
    }

    setIsExporting(false)
  }

  const hasEntry = selectedDate !== null && !isNew
  const canSave = Boolean(editDate && editTitle.trim())

  // ── Layout helpers ────────────────────────────────────────────────────────

  const cardStyle = {
    background: '#FFFEF5',
    border: '3px solid #2D2D2D',
    borderRadius: '1rem',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#2D2D2D',
    marginBottom: '0.375rem',
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '2px solid #2D2D2D',
    borderRadius: '0.5rem',
    background: '#FFFEF5',
    color: '#2D2D2D',
    fontSize: '0.95rem',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: '100%',
        gap: '1rem',
        minHeight: 0,
      }}
    >
      {/* Left panel: entry list */}
      <div
        style={{
          ...cardStyle,
          width: isMobile ? '100%' : '280px',
          minWidth: isMobile ? undefined : '280px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          maxHeight: isMobile ? '220px' : undefined,
        }}
      >
        {/* List header */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '2px solid #2D2D2D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ECE5DE',
            borderRadius: '0.875rem 0.875rem 0 0',
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2D2D2D' }}>
            Entrées ({entries.length})
          </span>
          <button
            onClick={startNew}
            style={{
              padding: '0.3rem 0.75rem',
              background: '#902212',
              color: '#FFFEF5',
              border: '2px solid #2D2D2D',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              boxShadow: '2px 2px 0px rgba(0,0,0,0.15)',
            }}
          >
            + Nouveau
          </button>
        </div>

        {/* Entry list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '1rem', color: '#888', fontSize: '0.875rem' }}>
              Chargement...
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '1rem', color: '#888', fontSize: '0.875rem' }}>
              Aucune entrée. Créez-en une !
            </div>
          ) : (
            entries.map((en) => (
              <button
                key={en.entry_date}
                onClick={() => selectEntry(en)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.625rem 1rem',
                  background: selectedDate === en.entry_date ? '#FF6B6B' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #ECE5DE',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedDate !== en.entry_date) {
                    e.currentTarget.style.background = '#f5f0eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDate !== en.entry_date) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: selectedDate === en.entry_date ? '#2D2D2D' : '#902212',
                  }}
                >
                  {formatDateLabel(en.entry_date)}
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#2D2D2D',
                    fontWeight: selectedDate === en.entry_date ? 700 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {en.title || '(sans titre)'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: editor */}
      <div
        style={{
          ...cardStyle,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Editor header */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '2px solid #2D2D2D',
            background: '#ECE5DE',
            borderRadius: '0.875rem 0.875rem 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#2D2D2D' }}>
            {isNew ? 'Nouvelle entrée' : hasEntry ? `Édition — ${formatDateLabel(selectedDate!)}` : 'Sélectionnez une entrée'}
          </h2>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Status badges */}
            {saveSuccess && (
              <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.625rem', background: '#90EE90', border: '2px solid #2D2D2D', borderRadius: '0.5rem', color: '#2D2D2D' }}>
                Sauvegardé
              </span>
            )}
            {error && (
              <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.625rem', background: '#FF6B6B', border: '2px solid #2D2D2D', borderRadius: '0.5rem', color: '#2D2D2D' }}>
                {error}
              </span>
            )}

            {/* Export button */}
            <button
              onClick={() => setShowExportPanel((v) => !v)}
              style={{
                padding: '0.375rem 0.875rem',
                background: showExportPanel ? '#2D2D2D' : '#FFFEF5',
                color: showExportPanel ? '#FFFEF5' : '#2D2D2D',
                border: '2px solid #2D2D2D',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '2px 2px 0px rgba(0,0,0,0.15)',
              }}
            >
              Exporter PDF
            </button>

            {/* Delete button (only when editing existing) */}
            {hasEntry && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '0.375rem 0.875rem',
                  background: '#FF6B6B',
                  color: '#2D2D2D',
                  border: '2px solid #2D2D2D',
                  borderRadius: '0.5rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  opacity: isDeleting ? 0.6 : 1,
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.15)',
                }}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            )}

            {/* Save button */}
            {(isNew || hasEntry) && (
              <button
                onClick={handleSave}
                disabled={isSaving || !canSave}
                style={{
                  padding: '0.375rem 0.875rem',
                  background: canSave && !isSaving ? '#902212' : '#9ca3af',
                  color: '#FFFEF5',
                  border: '2px solid #2D2D2D',
                  borderRadius: '0.5rem',
                  cursor: isSaving || !canSave ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  opacity: isSaving ? 0.7 : 1,
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.15)',
                }}
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            )}
          </div>
        </div>

        {/* Export panel */}
        {showExportPanel && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderBottom: '2px solid #2D2D2D',
              background: '#FFFEF5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2D2D2D' }}>
              Période (optionnel) :
            </span>
            <label style={{ fontSize: '0.8rem', color: '#555' }}>
              Du&nbsp;
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                style={{ ...inputStyle, width: 'auto', display: 'inline', padding: '0.25rem 0.5rem' }}
              />
            </label>
            <label style={{ fontSize: '0.8rem', color: '#555' }}>
              au&nbsp;
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                style={{ ...inputStyle, width: 'auto', display: 'inline', padding: '0.25rem 0.5rem' }}
              />
            </label>
            <button
              onClick={handleExport}
              disabled={isExporting}
              style={{
                padding: '0.35rem 0.875rem',
                background: '#902212',
                color: '#FFFEF5',
                border: '2px solid #2D2D2D',
                borderRadius: '0.5rem',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                opacity: isExporting ? 0.7 : 1,
              }}
            >
              {isExporting ? 'Génération...' : 'Télécharger PDF'}
            </button>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              (vide = toutes les entrées)
            </span>
          </div>
        )}

        {/* Form */}
        {isNew || hasEntry ? (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Date */}
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                disabled={hasEntry}
                style={{
                  ...inputStyle,
                  opacity: hasEntry ? 0.6 : 1,
                  cursor: hasEntry ? 'not-allowed' : 'text',
                }}
              />
              {hasEntry && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#888' }}>
                  La date ne peut pas être modifiée. Supprimez et recréez l'entrée si besoin.
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>Titre</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre de l'entrée"
                style={inputStyle}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>
                Contenu{' '}
                <span style={{ fontWeight: 400, color: '#888' }}>(Markdown)</span>
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Écrivez le contenu de l'entrée ici... (Markdown supporté : **gras**, *italique*, ## Titre, - liste...)"
                style={{
                  ...inputStyle,
                  flex: 1,
                  minHeight: '300px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <p style={{ margin: 0 }}>Sélectionnez une entrée dans la liste</p>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>ou cliquez sur « + Nouveau »</p>
          </div>
        )}
      </div>
    </div>
  )
}
