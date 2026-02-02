import { useEffect, useState } from 'react'
import { MobileApp } from './MobileApp'
import { DesktopApp } from './DesktopApp'

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

function App() {
  const isDesktop = useIsDesktop()

  return isDesktop ? <DesktopApp /> : <MobileApp />
}

export default App
