import { BulleId } from '../../types'

const BUBBLE_IDS: BulleId[] = [
  'informations',
  'train',
  'chapiteau',
  'lettres',
  'inspectionDesSacs',
  'hike',
  'concert',
  'bouffe',
  'journal',
  'contact',
  'dons',
  'inscription',
  'bienvenue',
  'patatra',
  'fantasia',
  'lamifa',
  'zampazzi',
]

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

interface AdminSidebarProps {
  selectedBubble: BulleId
  onSelectBubble: (id: BulleId) => void
  onLogout: () => void
  isMobileOpen: boolean
  onMobileClose: () => void
  isMobile: boolean
}

export function AdminSidebar({
  selectedBubble,
  onSelectBubble,
  onLogout,
  isMobileOpen,
  onMobileClose,
  isMobile,
}: AdminSidebarProps) {
  const handleSelect = (id: BulleId) => {
    onSelectBubble(id)
    if (isMobile) {
      onMobileClose()
    }
  }

  const sidebarContent = (
    <>
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
          Bulles
        </h2>
        {isMobile && (
          <button
            onClick={onMobileClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem',
        }}
      >
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {BUBBLE_IDS.map((id) => (
            <li key={id} style={{ marginBottom: '0.25rem' }}>
              <button
                onClick={() => handleSelect(id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  background:
                    selectedBubble === id
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'transparent',
                  color: selectedBubble === id ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: selectedBubble === id ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (selectedBubble !== id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.color = '#ffffff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedBubble !== id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              >
                {BUBBLE_LABELS[id]}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '0.5rem',
            color: '#fca5a5',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.borderColor = '#ef4444'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
          }}
        >
          Déconnexion
        </button>
      </div>
    </>
  )

  // Desktop: static sidebar
  if (!isMobile) {
    return (
      <aside
        style={{
          width: '280px',
          minWidth: '280px',
          height: '100dvh',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {sidebarContent}
      </aside>
    )
  }

  // Mobile: slide-out drawer
  return (
    <>
      {/* Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100dvh',
          width: '280px',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: isMobileOpen ? '4px 0 20px rgba(0, 0, 0, 0.3)' : 'none',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
