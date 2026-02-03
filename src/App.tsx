import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MobileApp } from './MobileApp'
import { DesktopApp } from './DesktopApp'
import { ModalProvider, useModal } from './context/ModalContext'
import { AuthProvider } from './context/AuthContext'
import { Modal } from './components/Modal'
import { modalContentRegistry } from './components/modalContent'

// Lazy load admin page - only downloaded when accessing /admin route
const AdminPage = lazy(() =>
  import('./pages/Admin').then((m) => ({ default: m.AdminPage }))
)

// Minimum aspect ratio (width/height) to switch to desktop mode
const DESKTOP_MIN_ASPECT_RATIO = 1.5

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    const aspectRatio = window.innerWidth / window.innerHeight
    return aspectRatio >= DESKTOP_MIN_ASPECT_RATIO
  })

  useEffect(() => {
    const handleResize = () => {
      const aspectRatio = window.innerWidth / window.innerHeight
      setIsDesktop(aspectRatio >= DESKTOP_MIN_ASPECT_RATIO)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isDesktop
}

function ModalContainer() {
  const { openModal, clickOrigin, closeModal } = useModal()

  return (
    <Modal
      isOpen={openModal !== null}
      onClose={closeModal}
      clickOrigin={clickOrigin}
    >
      {openModal && modalContentRegistry[openModal]()}
    </Modal>
  )
}

function MainApp() {
  const isDesktop = useIsDesktop()

  return (
    <ModalProvider>
      {isDesktop ? <DesktopApp /> : <MobileApp />}
      <ModalContainer />
    </ModalProvider>
  )
}

function AdminPageLoader() {
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
            animation: 'admin-spin 0.8s linear infinite',
          }}
        />
        <span style={{ color: '#2D2D2D', fontWeight: 600 }}>Chargement...</span>
        <style>{`
          @keyframes admin-spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<AdminPageLoader />}>
                <AdminPage />
              </Suspense>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
