import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { ImageResizeMarkdown } from '../../extensions/ImageResizeMarkdown'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown, MarkdownStorage } from 'tiptap-markdown'
import { BulleId } from '../../types'
import { Modal } from '../../components/Modal'
import {
  getBubble,
  saveBubble,
  createTab,
  saveTab,
  deleteTab,
  reorderTabs,
  type TabData,
} from '../../api/bubbleApi'
import { LinkModal } from '../../components/editor/LinkModal'
import { LinkPopover } from '../../components/editor/LinkPopover'
import { ImageUploadModal } from '../../components/editor/ImageUploadModal'

const BUBBLE_LABELS: Record<BulleId, string> = {
  informations: 'Informations',
  train: 'Train',
  chapiteau: 'Chapiteau',
  lettres: 'Lettres',
  inspectionDesSacs: 'Inspection des Sacs',
  hike: 'Hike',
  concert: 'Concert',
  bouffe: 'Bouffe',
  journal: 'Journal',
  contact: 'Contact',
  dons: 'Dons',
  inscription: 'Inscription',
  bienvenue: 'Bienvenue',
  patatra: 'Patatra',
  fantasia: 'Fantasia',
  lamifa: 'Lamifa',
  zampazzi: 'Zampazzi',
}

interface BubbleEditorProps {
  bubbleId: BulleId
  isMobile: boolean
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

// SVG Icons
const Icons = {
  bold: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  italic: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  strike: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M17.5 7.5A5 5 0 0 0 12 4c-2.76 0-5 1.5-5 4 0 1.5.5 2.5 2 3.5" />
      <path d="M8.5 15c0 2.5 2.24 5 5 5 2.76 0 5-1.5 5-4 0-1-.5-2-1.5-3" />
    </svg>
  ),
  h1: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8M4 6v12M12 6v12" />
      <path d="M17 12l3-2v10" />
    </svg>
  ),
  h2: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8M4 6v12M12 6v12" />
      <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </svg>
  ),
  h3: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8M4 6v12M12 6v12" />
      <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2c1.5 0 2.5 1 2.5 2.5 0 1.5-1.5 2.5-3.5 1.5" />
    </svg>
  ),
  bulletList: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="5" cy="6" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  orderedList: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <text x="3" y="8" fontSize="6" fill="currentColor" stroke="none">1</text>
      <text x="3" y="14" fontSize="6" fill="currentColor" stroke="none">2</text>
      <text x="3" y="20" fontSize="6" fill="currentColor" stroke="none">3</text>
    </svg>
  ),
  blockquote: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4" />
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  link: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  imageManager: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  undo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  redo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  ),
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '0.375rem',
        background: isActive ? '#FF6B6B' : '#FFFEF5',
        border: isActive ? '2px solid #2D2D2D' : '2px solid transparent',
        borderRadius: '0.375rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.25rem',
        height: '2.25rem',
        color: isActive ? '#2D2D2D' : '#4a4a4a',
        transition: 'all 0.15s',
        boxShadow: isActive ? '2px 2px 0px rgba(0, 0, 0, 0.15)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.background = '#ECE5DE'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = isActive ? '#FF6B6B' : '#FFFEF5'
        }
      }}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return (
    <div
      style={{
        width: '2px',
        height: '1.5rem',
        background: '#902212',
        margin: '0 0.5rem',
        borderRadius: '1px',
      }}
    />
  )
}

export function BubbleEditor({ bubbleId, isMobile }: BubbleEditorProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Tab state
  const [tabs, setTabs] = useState<TabData[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [editingTabName, setEditingTabName] = useState<number | null>(null)
  const [editingTabNameValue, setEditingTabNameValue] = useState('')

  // Modal states
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Link popover state
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [linkPopoverPosition, setLinkPopoverPosition] = useState({ top: 0, left: 0 })

  // Force re-render on editor updates for toolbar state
  const [, forceUpdate] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      ImageResizeMarkdown,
      Placeholder.configure({ placeholder: 'Commencez à écrire...' }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        style: 'min-height: 100%; padding: 1.25rem; outline: none;',
      },
      handleClick: (view, pos, event) => {
        // Check if clicked on a link
        const { state } = view
        const { doc } = state
        const node = doc.resolve(pos)
        const marks = node.marks()
        const linkMark = marks.find((m) => m.type.name === 'link')

        if (linkMark) {
          const target = event.target as HTMLElement
          const rect = target.getBoundingClientRect()
          setLinkPopoverPosition({
            top: rect.bottom + 8,
            left: rect.left,
          })
          setLinkPopoverOpen(true)
          return true
        }

        setLinkPopoverOpen(false)
        return false
      },
    },
    onSelectionUpdate: () => {
      // Close popover when selection changes away from link
      if (editor && !editor.isActive('link')) {
        setLinkPopoverOpen(false)
      }
    },
    onUpdate: () => {
      // Force re-render to update toolbar button states (undo/redo)
      forceUpdate((n) => n + 1)
    },
  })

  // Load content from API
  const loadContent = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const bubble = await getBubble(bubbleId)
      const bubbleTabs = bubble?.tabs || []
      setTabs(bubbleTabs)

      if (editor) {
        if (bubbleTabs.length > 0) {
          // Load first tab's content
          setActiveTabId(bubbleTabs[0].id)
          editor.commands.setContent(bubbleTabs[0].content || '')
        } else {
          // No tabs: load bubble.content
          setActiveTabId(null)
          editor.commands.setContent(bubble?.content || '')
        }
      }
    } catch (err) {
      console.error('Failed to load bubble:', err)
      setError('Erreur lors du chargement')
      if (editor) {
        editor.commands.setContent('')
      }
    } finally {
      setIsLoading(false)
    }
  }, [bubbleId, editor])

  useEffect(() => {
    if (editor) {
      loadContent()
    }
  }, [bubbleId, editor, loadContent])

  const switchToTab = (tab: TabData) => {
    if (!editor || tab.id === activeTabId) return

    // Save current editor content to local state before switching
    const storage = editor.storage as unknown as { markdown: MarkdownStorage }
    const currentMarkdown = storage.markdown.getMarkdown()
    if (activeTabId !== null) {
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, content: currentMarkdown } : t)))
    }

    setActiveTabId(tab.id)
    editor.commands.setContent(tab.content || '')
  }

  const handleSave = async () => {
    if (!editor || isSaving) return

    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      const storage = editor.storage as unknown as { markdown: MarkdownStorage }
      const currentMarkdown = storage.markdown.getMarkdown()

      if (tabs.length > 0) {
        // Update active tab's content in local state first
        const updatedTabs = tabs.map((t) =>
          t.id === activeTabId ? { ...t, content: currentMarkdown } : t
        )
        setTabs(updatedTabs)

        // Save all tabs to the server
        let allOk = true
        for (const tab of updatedTabs) {
          const updated = await saveTab(bubbleId, tab.id, { content: tab.content ?? '' })
          if (!updated) {
            allOk = false
          }
        }

        if (allOk) {
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 2000)
        } else {
          setError('Erreur lors de la sauvegarde de certains onglets')
        }
      } else {
        // Save to bubble.content (no tabs mode)
        const result = await saveBubble(bubbleId, currentMarkdown)
        if (result.success) {
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 2000)
        } else {
          setError(result.error || 'Erreur lors de la sauvegarde')
        }
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTab = async () => {
    try {
      const tab = await createTab(bubbleId, 'Nouvel onglet')
      if (tab) {
        setTabs((prev) => [...prev, tab])
        // Switch to the new tab
        setActiveTabId(tab.id)
        if (editor) {
          editor.commands.setContent(tab.content || '')
        }
      }
    } catch (err) {
      console.error('Failed to create tab:', err)
      setError('Erreur lors de la création de l\'onglet')
    }
  }

  const handleDeleteTab = async (tabId: number) => {
    if (!confirm('Supprimer cet onglet ?')) return

    try {
      const success = await deleteTab(bubbleId, tabId)
      if (success) {
        const remaining = tabs.filter((t) => t.id !== tabId)
        setTabs(remaining)

        if (activeTabId === tabId) {
          if (remaining.length > 0) {
            // Switch to first remaining tab
            setActiveTabId(remaining[0].id)
            if (editor) {
              editor.commands.setContent(remaining[0].content || '')
            }
          } else {
            // No tabs left, revert to bubble.content mode
            setActiveTabId(null)
            const bubble = await getBubble(bubbleId)
            if (editor) {
              editor.commands.setContent(bubble?.content || '')
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete tab:', err)
      setError('Erreur lors de la suppression de l\'onglet')
    }
  }

  const handleRenameTab = async (tabId: number, newName: string) => {
    if (!newName.trim()) return
    try {
      const updated = await saveTab(bubbleId, tabId, { tab_name: newName.trim() })
      if (updated) {
        setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, tab_name: newName.trim() } : t)))
      }
    } catch (err) {
      console.error('Failed to rename tab:', err)
    }
    setEditingTabName(null)
  }

  const handleMoveTab = async (tabId: number, direction: 'up' | 'down') => {
    const idx = tabs.findIndex((t) => t.id === tabId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= tabs.length) return

    const newTabs = [...tabs]
    ;[newTabs[idx], newTabs[swapIdx]] = [newTabs[swapIdx], newTabs[idx]]
    setTabs(newTabs)

    try {
      await reorderTabs(bubbleId, newTabs.map((t) => t.id))
    } catch (err) {
      console.error('Failed to reorder tabs:', err)
    }
  }

  const handlePreview = () => {
    setIsPreviewOpen(true)
  }

  const addLink = () => {
    if (!editor) return

    // If text is selected and already has link, open popover instead
    if (editor.isActive('link')) {
      const { view } = editor
      const { state } = view
      const { from } = state.selection
      const coords = view.coordsAtPos(from)
      setLinkPopoverPosition({
        top: coords.bottom + 8,
        left: coords.left,
      })
      setLinkPopoverOpen(true)
    } else {
      setIsLinkModalOpen(true)
    }
  }

  const handleLinkSubmit = (url: string) => {
    if (!editor) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  const addImage = () => {
    setIsImageModalOpen(true)
  }

  const handleImageInsert = (url: string, alt?: string) => {
    if (!editor) return
    const isSvg = url.toLowerCase().endsWith('.svg')
    // SVGs need a default width since they often lack intrinsic dimensions
    const attrs = isSvg
      ? { src: url, alt: alt || '', containerStyle: 'width: 300px' }
      : { src: url, alt: alt || '' }
    editor.chain().focus().setImage(attrs).run()
  }

  if (!editor) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          background: '#FFFEF5',
          border: '3px solid #2D2D2D',
          borderRadius: '1rem',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
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
          {BUBBLE_LABELS[bubbleId]}
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Status indicators */}
          {isLoading && (
            <span
              style={{
                color: '#6b7280',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.375rem 0.75rem',
                background: '#ECE5DE',
                borderRadius: '0.5rem',
              }}
            >
              Chargement...
            </span>
          )}
          {error && (
            <span
              style={{
                color: '#2D2D2D',
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.375rem 0.75rem',
                background: '#FF6B6B',
                borderRadius: '0.5rem',
                border: '2px solid #2D2D2D',
              }}
            >
              {error}
            </span>
          )}
          {saveSuccess && (
            <span
              style={{
                color: '#2D2D2D',
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.375rem 0.75rem',
                background: '#90EE90',
                borderRadius: '0.5rem',
                border: '2px solid #2D2D2D',
              }}
            >
              Sauvegardé
            </span>
          )}

          <button
            onClick={handlePreview}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: 600,
              color: '#2D2D2D',
              background: '#ECE5DE',
              border: '3px solid #2D2D2D',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '3px 3px 0px rgba(0, 0, 0, 0.15)'
            }}
          >
            Prévisualiser
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: 600,
              color: '#FFFEF5',
              background: isSaving ? '#9ca3af' : '#902212',
              border: '3px solid #2D2D2D',
              borderRadius: '0.5rem',
              cursor: isSaving || isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isSaving || isLoading ? 0.7 : 1,
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.15)',
            }}
            onMouseEnter={(e) => {
              if (!isSaving && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving && !isLoading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '3px 3px 0px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab, idx) => (
          <div
            key={tab.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.5rem 0.4rem 1rem',
              background: activeTabId === tab.id ? '#902212' : '#FFFEF5',
              border: '3px solid #2D2D2D',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTabId === tab.id
                ? '3px 3px 0px rgba(0, 0, 0, 0.2)'
                : '2px 2px 0px rgba(0, 0, 0, 0.1)',
            }}
            onClick={() => switchToTab(tab)}
          >
            {editingTabName === tab.id ? (
              <input
                autoFocus
                value={editingTabNameValue}
                onChange={(e) => setEditingTabNameValue(e.target.value)}
                onBlur={() => handleRenameTab(tab.id, editingTabNameValue)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameTab(tab.id, editingTabNameValue)
                  if (e.key === 'Escape') setEditingTabName(null)
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: '2px solid #902212',
                  borderRadius: '0.5rem',
                  padding: '0.125rem 0.5rem',
                  background: '#FFFEF5',
                  outline: 'none',
                  width: '110px',
                  color: '#2D2D2D',
                }}
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingTabName(tab.id)
                  setEditingTabNameValue(tab.tab_name)
                }}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: activeTabId === tab.id ? '#FFFEF5' : '#2D2D2D',
                  userSelect: 'none',
                }}
              >
                {tab.tab_name}
              </span>
            )}

            {/* Move arrows */}
            {idx > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleMoveTab(tab.id, 'up') }}
                title="Déplacer à gauche"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                  fontSize: '0.65rem',
                  color: activeTabId === tab.id ? '#FFFEF5' : '#6b7280',
                  lineHeight: 1, opacity: 0.7,
                }}
              >
                &#9664;
              </button>
            )}
            {idx < tabs.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleMoveTab(tab.id, 'down') }}
                title="Déplacer à droite"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                  fontSize: '0.65rem',
                  color: activeTabId === tab.id ? '#FFFEF5' : '#6b7280',
                  lineHeight: 1, opacity: 0.7,
                }}
              >
                &#9654;
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteTab(tab.id) }}
              title="Supprimer l'onglet"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: activeTabId === tab.id ? 'rgba(255,255,255,0.25)' : '#ECE5DE',
                border: 'none', cursor: 'pointer',
                width: '1.25rem', height: '1.25rem',
                borderRadius: '50%',
                fontSize: '0.8rem',
                color: activeTabId === tab.id ? '#FFFEF5' : '#902212',
                lineHeight: 1, fontWeight: 700,
              }}
            >
              &times;
            </button>
          </div>
        ))}

        {/* Add tab button */}
        <button
          onClick={handleAddTab}
          title="Ajouter un onglet"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.25rem',
            height: '2.25rem',
            background: '#ECE5DE',
            border: '3px solid #2D2D2D',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#902212',
            lineHeight: 1,
            boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          +
        </button>
      </div>

      {/* Editor container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '3px solid #2D2D2D',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFEF5',
          opacity: isLoading ? 0.6 : 1,
          transition: 'opacity 0.2s',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.625rem 0.75rem',
            background: '#ECE5DE',
            borderBottom: '3px solid #2D2D2D',
            flexWrap: 'wrap',
          }}
        >
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Gras (Ctrl+B)"
          >
            {Icons.bold}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italique (Ctrl+I)"
          >
            {Icons.italic}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Barré"
          >
            {Icons.strike}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Titre 1"
          >
            {Icons.h1}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Titre 2"
          >
            {Icons.h2}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Titre 3"
          >
            {Icons.h3}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Liste à puces"
          >
            {Icons.bulletList}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Liste numérotée"
          >
            {Icons.orderedList}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Citation"
          >
            {Icons.blockquote}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Bloc de code"
          >
            {Icons.code}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link & Image */}
          <ToolbarButton
            onClick={addLink}
            isActive={editor.isActive('link')}
            title="Lien (Ctrl+K)"
          >
            {Icons.link}
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Image">
            {Icons.image}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Annuler (Ctrl+Z)"
          >
            {Icons.undo}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rétablir (Ctrl+Y)"
          >
            {Icons.redo}
          </ToolbarButton>
        </div>

        {/* Editor content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#FFFEF5',
          }}
        >
          <EditorContent
            editor={editor}
            style={{
              height: '100%',
            }}
          />
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        clickOrigin={{ x: window.innerWidth / 2, y: window.innerHeight / 2 }}
      >
        <div
          className="tiptap-preview"
          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          style={{
            padding: '1rem',
          }}
        />
      </Modal>

      {/* Link Modal */}
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSubmit={handleLinkSubmit}
      />

      {/* Link Popover */}
      <LinkPopover
        editor={editor}
        isOpen={linkPopoverOpen}
        onClose={() => setLinkPopoverOpen(false)}
        position={linkPopoverPosition}
      />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsert={handleImageInsert}
        bubbleId={bubbleId}
      />

      {/* TipTap editor styles */}
      <style>{`
        .tiptap {
          height: 100%;
          font-size: 1rem;
          line-height: 1.75;
        }
        .tiptap:focus {
          outline: none;
        }
        .tiptap p {
          margin: 0.75em 0;
        }
        .tiptap h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 1em 0 0.5em;
          line-height: 1.2;
        }
        .tiptap h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 1em 0 0.5em;
          line-height: 1.3;
        }
        .tiptap h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 1em 0 0.5em;
          line-height: 1.4;
        }
        .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.75em 0;
        }
        .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.75em 0;
        }
        .tiptap li {
          margin: 0.375em 0;
        }
        .tiptap blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1.25em;
          margin: 1em 0;
          color: #4b5563;
          font-style: italic;
        }
        .tiptap pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1em 1.25em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1em 0;
          font-size: 0.9em;
        }
        .tiptap code {
          background: #e5e7eb;
          padding: 0.125em 0.375em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        .tiptap pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .tiptap a,
        .tiptap .editor-link {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.15s;
        }
        .tiptap a:hover,
        .tiptap .editor-link:hover {
          color: #1d4ed8;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .tiptap-preview h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 0.67em 0;
        }
        .tiptap-preview h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.75em 0;
        }
        .tiptap-preview h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.83em 0;
        }
        .tiptap-preview ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .tiptap-preview ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .tiptap-preview blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1.25em;
          margin: 1em 0;
          color: #4b5563;
          font-style: italic;
        }
        .tiptap-preview pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1em 1.25em;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .tiptap-preview a {
          color: #2563eb;
          text-decoration: underline;
        }
        .tiptap-preview img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  )
}
