import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MobileApp } from './MobileApp'
import { DesktopApp } from './DesktopApp'
import { ModalProvider, useModal } from './context/ModalContext'
import { AuthProvider } from './context/AuthContext'
import { Modal } from './components/Modal'
import { modalContentRegistry } from './components/modalContent'
import { AdminPage } from './pages/Admin'

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
