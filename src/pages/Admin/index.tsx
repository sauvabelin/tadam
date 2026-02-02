import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AdminLogin } from './AdminLogin'
import { AdminSidebar } from './AdminSidebar'
import { BubbleEditor } from './BubbleEditor'
import { BulleId } from '../../types'

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

export function AdminPage() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [selectedBubble, setSelectedBubble] = useState<BulleId>('informations')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLoginSuccess = () => {
    // Re-render will happen automatically due to auth state change
  }

  const handleLogout = () => {
    logout()
  }

  const handleBackToSite = () => {
    navigate('/')
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={handleLoginSuccess} />
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        background: '#f3f4f6',
      }}
    >
      <AdminSidebar
        selectedBubble={selectedBubble}
        onSelectBubble={setSelectedBubble}
        onLogout={handleLogout}
        isMobile={isMobile}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1a1a2e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            <h1
              style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                fontWeight: 600,
                color: '#1a1a2e',
                margin: 0,
              }}
            >
              {isMobile ? 'Admin' : 'Admin - Éditeur de Bulles'}
            </h1>
          </div>
          <button
            onClick={handleBackToSite}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              color: '#667eea',
              background: 'none',
              border: '1px solid #667eea',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#667eea'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = '#667eea'
            }}
          >
            {isMobile ? 'Site' : 'Retour au site'}
          </button>
        </header>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? '1rem' : '1.5rem',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <BubbleEditor bubbleId={selectedBubble} isMobile={isMobile} />
        </div>
      </main>
    </div>
  )
}
