import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AdminLogin } from './AdminLogin'
import { BulleId } from '../../types'

export type AdminSection = 'postcardBackgrounds' | 'postcardSubmissions' | null

// Lazy load the heavy editor components - only downloaded after authentication
const AdminSidebar = lazy(() =>
  import('./AdminSidebar').then((m) => ({ default: m.AdminSidebar }))
)
const BubbleEditor = lazy(() =>
  import('./BubbleEditor').then((m) => ({ default: m.BubbleEditor }))
)
const PostcardBackgroundManager = lazy(() =>
  import('./PostcardBackgroundManager').then((m) => ({ default: m.PostcardBackgroundManager }))
)
const PostcardSubmissionsList = lazy(() =>
  import('./PostcardSubmissionsList').then((m) => ({ default: m.PostcardSubmissionsList }))
)

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

function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        background: '#ECE5DE',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #ECE5DE',
          borderTopColor: '#902212',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function AuthLoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `repeating-linear-gradient(
          90deg,
          #ECE5DE,
          #ECE5DE 40px,
          #902212 40px,
          #902212 80px
        )`,
      }}
    >
      <div
        style={{
          background: '#FFFEF5',
          padding: '2rem',
          borderRadius: '1rem',
          border: '4px solid #2D2D2D',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '4px solid #ECE5DE',
            borderTopColor: '#902212',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ color: '#2D2D2D', fontWeight: 600 }}>Vérification...</span>
      </div>
    </div>
  )
}

export function AdminPage() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [selectedBubble, setSelectedBubble] = useState<BulleId | null>('informations')
  const [adminSection, setAdminSection] = useState<AdminSection>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSelectBubble = (id: BulleId) => {
    setSelectedBubble(id)
    setAdminSection(null)
  }

  const handleSetAdminSection = (section: AdminSection) => {
    setAdminSection(section)
    setSelectedBubble(null)
  }

  const handleLoginSuccess = () => {
    // Re-render will happen automatically due to auth state change
  }

  const handleLogout = () => {
    logout()
  }

  const handleBackToSite = () => {
    navigate('/')
  }

  // Show loading screen while verifying token
  if (isLoading) {
    return <AuthLoadingScreen />
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
        background: '#ECE5DE',
      }}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <AdminSidebar
          selectedBubble={selectedBubble}
          onSelectBubble={handleSelectBubble}
          adminSection={adminSection}
          onSetAdminSection={handleSetAdminSection}
          onLogout={handleLogout}
          isMobile={isMobile}
          isMobileOpen={isSidebarOpen}
          onMobileClose={() => setIsSidebarOpen(false)}
        />
      </Suspense>

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
            background: '#902212',
            borderBottom: '4px solid #2D2D2D',
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
                  background: '#FFFEF5',
                  border: '2px solid #2D2D2D',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2D2D2D"
                  strokeWidth="2.5"
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
                fontSize: isMobile ? '1.125rem' : '1.5rem',
                fontWeight: 800,
                color: '#FFFEF5',
                margin: 0,
                textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              }}
            >
              {isMobile ? 'Admin' : 'Éditeur de Bulles'}
            </h1>
          </div>
          <button
            onClick={handleBackToSite}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1.25rem',
              fontSize: isMobile ? '0.8rem' : '0.95rem',
              fontWeight: 600,
              color: '#2D2D2D',
              background: '#FFFEF5',
              border: '3px solid #2D2D2D',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
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
            background: '#ECE5DE',
          }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            {adminSection === 'postcardBackgrounds' ? (
              <PostcardBackgroundManager isMobile={isMobile} />
            ) : adminSection === 'postcardSubmissions' ? (
              <PostcardSubmissionsList isMobile={isMobile} />
            ) : selectedBubble ? (
              <BubbleEditor bubbleId={selectedBubble} isMobile={isMobile} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                Sélectionnez une bulle ou une section.
              </div>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
