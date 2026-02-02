import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown, MarkdownStorage } from 'tiptap-markdown'
import { BulleId } from '../../types'
import { Modal } from '../../components/Modal'

// Placeholder content for each bubble
const PLACEHOLDER_CONTENT: Record<BulleId, string> = {
  informations: `# Informations Générales

Bienvenue au festival Tadam !

## Dates
- Date de début: À définir
- Date de fin: À définir

## Lieu
Sauvabelin, Lausanne`,
  train: `# Journée des Parents

Informations sur la journée des parents...`,
  chapiteau: `# Trailer

Contenu du trailer à venir...`,
  lettres: `# Lettres

Contenu des lettres à venir...`,
  inspectionDesSacs: `# Inspection des Sacs

Liste des objets autorisés et interdits...`,
  hike: `# Hike

Informations sur la randonnée...`,
  concert: `# Concert

Programme du concert...`,
  bouffe: `# Bouffe

Menu et informations sur la nourriture...`,
  journal: `# Journal

Actualités du festival...`,
  contact: `# Contact

Pour nous contacter...`,
  dons: `# Dons

Informations sur les dons...`,
  inscription: `# Inscription

Comment s'inscrire...`,
  bienvenue: `# Bienvenue

Message de bienvenue...`,
  patatra: `# Patatra

Informations sur Patatra...`,
  fantasia: `# Fantasia

Informations sur Fantasia...`,
  lamifa: `# Lamifa

Informations sur Lamifa...`,
  zampazzi: `# Zampazzi

Informations sur Zampazzi...`,
}

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

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '0.375rem 0.5rem',
        background: isActive ? '#e5e7eb' : 'transparent',
        border: 'none',
        borderRadius: '0.25rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '2rem',
        height: '2rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#374151',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.background = '#f3f4f6'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = isActive ? '#e5e7eb' : 'transparent'
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
        width: '1px',
        height: '1.5rem',
        background: '#d1d5db',
        margin: '0 0.25rem',
      }}
    />
  )
}

export function BubbleEditor({ bubbleId, isMobile }: BubbleEditorProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Commencez à écrire...' }),
      Markdown,
    ],
    content: PLACEHOLDER_CONTENT[bubbleId] || '',
    editorProps: {
      attributes: {
        style: 'min-height: 100%; padding: 1rem; outline: none;',
      },
    },
  })

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(PLACEHOLDER_CONTENT[bubbleId] || '')
    }
  }, [bubbleId, editor])

  const handleSave = () => {
    if (!editor) return
    const storage = editor.storage as unknown as { markdown: MarkdownStorage }
    const markdown = storage.markdown.getMarkdown()
    console.log(`Saving content for ${bubbleId}:`, markdown)
    alert('Contenu sauvegardé (console.log)')
  }

  const handlePreview = () => {
    setIsPreviewOpen(true)
  }

  const addLink = () => {
    if (!editor) return
    const url = window.prompt('URL du lien:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    if (!editor) return
    const url = window.prompt("URL de l'image:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
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
        }}
      >
        <h1
          style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 700,
            color: '#1a1a2e',
            margin: 0,
          }}
        >
          {BUBBLE_LABELS[bubbleId]}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handlePreview}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: 500,
              color: '#ffffff',
              background: '#4b5563',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#374151'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4b5563'
            }}
          >
            Prévisualiser
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: 500,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Editor container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: '0.5rem',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFEF5',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.125rem',
            padding: '0.5rem',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            flexWrap: 'wrap',
          }}
        >
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Gras (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italique (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Barré"
          >
            <s>S</s>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Titre 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Titre 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Titre 3"
          >
            H3
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Liste à puces"
          >
            •
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Liste numérotée"
          >
            1.
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Citation"
          >
            "
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Bloc de code"
          >
            {'</>'}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link & Image */}
          <ToolbarButton
            onClick={addLink}
            isActive={editor.isActive('link')}
            title="Lien"
          >
            🔗
          </ToolbarButton>
          <ToolbarButton
            onClick={addImage}
            title="Image"
          >
            🖼
          </ToolbarButton>

          <ToolbarDivider />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Annuler (Ctrl+Z)"
          >
            ↶
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rétablir (Ctrl+Y)"
          >
            ↷
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

      {/* TipTap editor styles */}
      <style>{`
        .tiptap {
          height: 100%;
        }
        .tiptap:focus {
          outline: none;
        }
        .tiptap p {
          margin: 0.5em 0;
        }
        .tiptap h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 0.67em 0;
        }
        .tiptap h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.75em 0;
        }
        .tiptap h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.83em 0;
        }
        .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .tiptap li {
          margin: 0.25em 0;
        }
        .tiptap blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1em;
          margin: 0.5em 0;
          color: #6b7280;
        }
        .tiptap pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 0.75em 1em;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .tiptap code {
          background: #e5e7eb;
          padding: 0.125em 0.25em;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .tiptap pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .tiptap a {
          color: #2563eb;
          text-decoration: underline;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
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
          border-left: 3px solid #d1d5db;
          padding-left: 1em;
          margin: 0.5em 0;
          color: #6b7280;
        }
        .tiptap-preview pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 0.75em 1em;
          border-radius: 0.375rem;
          overflow-x: auto;
        }
        .tiptap-preview a {
          color: #2563eb;
          text-decoration: underline;
        }
        .tiptap-preview img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  )
}
