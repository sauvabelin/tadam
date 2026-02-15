import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { TROUPES, ROLES } from '../../data/troupes'

const CARD_ASPECT = 148 / 105

interface AddressFields {
  role: string
  name: string
  troupe: string
  patrouille: string
}

interface Props {
  initialContent: string
  onChange: (html: string) => void
  address: AddressFields
  onAddressChange: (field: string, value: string) => void
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '3px 6px',
  fontSize: '10px',
  border: '1px solid #ccc',
  borderRadius: '3px',
  background: 'rgba(255, 254, 245, 0.6)',
  color: '#2D2D2D',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

function ToolbarBtn({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '0.25rem',
        background: isActive ? '#FF6B6B' : '#FFFEF5',
        border: isActive ? '2px solid #2D2D2D' : '2px solid transparent',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2rem',
        height: '2rem',
        color: isActive ? '#2D2D2D' : '#4a4a4a',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = '#ECE5DE'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = '#FFFEF5'
      }}
    >
      {children}
    </button>
  )
}

export function MessageEditor({ initialContent, onChange, address, onAddressChange }: Props) {
  const [showEmoji, setShowEmoji] = useState(false)
  const [isOverflow, setIsOverflow] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)
  const messageAreaRef = useRef<HTMLDivElement>(null)
  const selectedTroupe = TROUPES.find((t) => t.id === address.troupe) ?? null

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: 'Écris ton message ici...' }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      checkOverflow()
    },
    editorProps: {
      attributes: {
        style: 'height: 100%; padding: 10px; outline: none; font-size: 16px; line-height: 1.5; overflow-y: auto;',
      },
    },
  })

  const checkOverflow = () => {
    if (!messageAreaRef.current) return
    const el = messageAreaRef.current.querySelector('.tiptap')
    if (!el) return
    setIsOverflow(el.scrollHeight > messageAreaRef.current.clientHeight + 2)
  }

  useEffect(() => {
    checkOverflow()
  }, [editor])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (!editor) return
    editor.chain().focus().insertContent(emojiData.emoji).run()
    setShowEmoji(false)
  }

  if (!editor) return null

  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700, color: '#2D2D2D' }}>
        Compose ta carte postale
      </h3>

      {/* Card wrapper - centered, A6 proportions */}
      <div style={{ maxWidth: `${Math.round(360 * CARD_ASPECT)}px`, margin: '0 auto' }}>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.375rem 0.5rem',
          background: '#ECE5DE',
          border: '3px solid #2D2D2D',
          borderBottom: 'none',
          borderRadius: '0.75rem 0.75rem 0 0',
          flexWrap: 'wrap',
          position: 'relative',
        }}
      >
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Gras"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italique"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </ToolbarBtn>

        <div style={{ width: '2px', height: '1.25rem', background: '#902212', margin: '0 0.375rem', borderRadius: '1px' }} />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Liste"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="5" cy="6" r="1" fill="currentColor" />
            <circle cx="5" cy="12" r="1" fill="currentColor" />
            <circle cx="5" cy="18" r="1" fill="currentColor" />
          </svg>
        </ToolbarBtn>

        <div style={{ width: '2px', height: '1.25rem', background: '#902212', margin: '0 0.375rem', borderRadius: '1px' }} />

        {/* Emoji toggle */}
        <div style={{ position: 'relative' }} ref={emojiRef}>
          <ToolbarBtn
            onClick={() => setShowEmoji(!showEmoji)}
            isActive={showEmoji}
            title="Emoji"
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>&#x1F600;</span>
          </ToolbarBtn>
          {showEmoji && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setShowEmoji(false)}
              />
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 11, marginTop: '4px' }}>
                <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={300} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Postcard back side */}
      <div
        style={{
          border: '3px solid #2D2D2D',
          borderRadius: '0 0 0.75rem 0.75rem',
          overflow: 'hidden',
          background: '#FFFEF5',
          boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: String(CARD_ASPECT),
            display: 'flex',
            position: 'relative',
          }}
        >
          {/* Left half: message area */}
          <div
            ref={messageAreaRef}
            style={{
              flex: '0 0 50%',
              overflow: 'hidden',
              borderRight: '1px dashed #aaa',
              position: 'relative',
            }}
          >
            <EditorContent editor={editor} style={{ height: '100%' }} />

            {isOverflow && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '4px 8px',
                  background: 'rgba(220, 38, 38, 0.9)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                Texte trop long ! Il sera coupé à l'impression.
              </div>
            )}
          </div>

          {/* Right half: address form fields */}
          <div
            style={{
              flex: '0 0 50%',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              background: '#fefcf3',
            }}
          >
            {/* Stamp placeholder */}
            <div style={{ alignSelf: 'flex-end', marginBottom: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '1.5px dashed #bbb',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  color: '#bbb',
                }}
              >
                Timbre
              </div>
            </div>

            {/* Address form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center' }}>
              <div>
                <select
                  value={address.role}
                  onChange={(e) => onAddressChange('role', e.target.value)}
                  style={fieldStyle}
                >
                  <option value="">Rôle *</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={address.name}
                  onChange={(e) => onAddressChange('name', e.target.value)}
                  placeholder="Prénom et nom *"
                  style={fieldStyle}
                />
              </div>

              <div>
                <select
                  value={address.troupe}
                  onChange={(e) => {
                    onAddressChange('troupe', e.target.value)
                    onAddressChange('patrouille', '')
                  }}
                  style={fieldStyle}
                >
                  <option value="">Unité *</option>
                  {TROUPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              {selectedTroupe && selectedTroupe.patrouilles.length > 0 && (
                <div>
                  <select
                    value={address.patrouille}
                    onChange={(e) => onAddressChange('patrouille', e.target.value)}
                    style={fieldStyle}
                  >
                    <option value="">Sous-Unité (optionnel)</option>
                    {selectedTroupe.patrouilles.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Center divider line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: '1px',
              background: '#ccc',
            }}
          />
        </div>
      </div>

      {isOverflow && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
          Le texte dépasse la zone imprimable. Raccourcis ton message pour qu'il tienne sur la carte.
        </p>
      )}

      </div>{/* end card wrapper */}

      <style>{`
        .tiptap {
          font-size: 16px;
          line-height: 1.5;
          height: 100%;
        }
        .tiptap:focus { outline: none; }
        .tiptap p { margin: 0.35em 0; }
        .tiptap ul { list-style-type: disc; padding-left: 1.2em; margin: 0.35em 0; }
        .tiptap ol { list-style-type: decimal; padding-left: 1.2em; margin: 0.35em 0; }
        .tiptap li { margin: 0.15em 0; }
        .tiptap blockquote {
          border-left: 2px solid #902212;
          padding-left: 0.75em;
          margin: 0.35em 0;
          color: #4b5563;
          font-style: italic;
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
