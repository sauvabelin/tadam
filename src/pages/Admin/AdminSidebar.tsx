import { useState } from 'react'
import { BulleId, BUBBLE_CATEGORIES, BubbleCategory } from '../../types'

export type AdminSection = BulleId | 'journal-entries'

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
  serigraphie: 'Concours de sérigraphie',
}

interface AdminSidebarProps {
  selectedSection: AdminSection
  onSelectSection: (section: AdminSection) => void
  onLogout: () => void
  isMobileOpen: boolean
  onMobileClose: () => void
  isMobile: boolean
}

export function AdminSidebar({
  selectedSection,
  onSelectSection,
  onLogout,
  isMobileOpen,
  onMobileClose,
  isMobile,
}: AdminSidebarProps) {
  // Start with all categories expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<BubbleCategory>>(
    new Set(BUBBLE_CATEGORIES.map(c => c.id))
  )

  const handleSelect = (section: AdminSection) => {
    onSelectSection(section)
    if (isMobile) {
      onMobileClose()
    }
  }

  const toggleCategory = (categoryId: BubbleCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '3px solid #2D2D2D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#902212',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: 0,
            color: '#FFFEF5',
            textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
          }}
        >
          Bulles
        </h2>
        {isMobile && (
          <button
            onClick={onMobileClose}
            style={{
              width: '32px',
              height: '32px',
              background: '#FF6B6B',
              border: '2px solid #2D2D2D',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#2D2D2D',
            }}
          >
            x
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
          background: '#FFFEF5',
        }}
      >
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {/* Journal entries section */}
          <li style={{ marginBottom: '0.75rem' }}>
            <button
              onClick={() => handleSelect('journal-entries')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '2px solid #2D2D2D',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '1rem',
                background: selectedSection === 'journal-entries' ? '#902212' : '#ECE5DE',
                color: selectedSection === 'journal-entries' ? '#FFFEF5' : '#2D2D2D',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.15)',
              }}
              onMouseEnter={(e) => {
                if (selectedSection !== 'journal-entries') {
                  e.currentTarget.style.background = '#d4ccc4'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSection !== 'journal-entries') {
                  e.currentTarget.style.background = '#ECE5DE'
                }
              }}
            >
              Entrées de journal
            </button>
          </li>

          {BUBBLE_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.id)
            const hasSelectedBubble =
              selectedSection !== 'journal-entries' &&
              category.bubbles.includes(selectedSection as BulleId)

            return (
              <li key={category.id} style={{ marginBottom: '0.5rem' }}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: '2px solid #2D2D2D',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '1rem',
                    background: hasSelectedBubble
                      ? '#902212'
                      : '#ECE5DE',
                    color: hasSelectedBubble ? '#FFFEF5' : '#2D2D2D',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.15)',
                  }}
                  onMouseEnter={(e) => {
                    if (!hasSelectedBubble) {
                      e.currentTarget.style.background = '#d4ccc4'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasSelectedBubble) {
                      e.currentTarget.style.background = '#ECE5DE'
                    }
                  }}
                >
                  <span>{category.label}</span>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    {'>'}
                  </span>
                </button>

                {/* Nested bubble items */}
                {isExpanded && (
                  <ul
                    style={{
                      listStyle: 'none',
                      margin: '0.5rem 0 0 0',
                      padding: '0 0 0 0.75rem',
                      borderLeft: '3px solid #902212',
                    }}
                  >
                    {category.bubbles.map((bubbleId) => (
                      <li key={bubbleId} style={{ marginBottom: '0.25rem' }}>
                        <button
                          onClick={() => handleSelect(bubbleId)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.625rem 1rem',
                            borderRadius: '0.5rem',
                            border: selectedSection === bubbleId
                              ? '2px solid #2D2D2D'
                              : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem',
                            background: selectedSection === bubbleId
                              ? '#FF6B6B'
                              : 'transparent',
                            color: selectedSection === bubbleId ? '#2D2D2D' : '#4a4a4a',
                            fontWeight: selectedSection === bubbleId ? 600 : 500,
                            boxShadow: selectedSection === bubbleId
                              ? '2px 2px 0px rgba(0, 0, 0, 0.15)'
                              : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedBubble !== bubbleId) {
                              e.currentTarget.style.background = '#f5f0eb'
                              e.currentTarget.style.color = '#2D2D2D'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedBubble !== bubbleId) {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = '#4a4a4a'
                            }
                          }}
                        >
                          {BUBBLE_LABELS[bubbleId]}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '1rem',
          borderTop: '3px solid #2D2D2D',
          background: '#ECE5DE',
        }}
      >
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: '#FF6B6B',
            border: '3px solid #2D2D2D',
            borderRadius: '0.5rem',
            color: '#2D2D2D',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '3px 3px 0px rgba(0, 0, 0, 0.2)'
          }}
        >
          Deconnexion
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
          background: '#FFFEF5',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '4px solid #2D2D2D',
          boxShadow: '4px 0 0 rgba(0, 0, 0, 0.1)',
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
          background: '#FFFEF5',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          borderRight: '4px solid #2D2D2D',
          boxShadow: isMobileOpen ? '8px 0 20px rgba(0, 0, 0, 0.3)' : 'none',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
