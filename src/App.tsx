import { CSSProperties, useEffect, useState, useCallback, useRef } from 'react'
import { Background } from './components/Background'
import { Bienvenue } from './components/Bienvenue'
import { Informations } from './components/Informations'
import { InspectionDesSacs } from './components/InspectionDesSacs'
import { Train } from './components/Train'
import { Chapiteau } from './components/Chapiteau'
import { Familles } from './components/Familles'
import { Concert } from './components/Concert'
import { Bouffe } from './components/Bouffe'
import { Journal } from './components/Journal'
import { Lettres } from './components/Lettres'
import { Hike } from './components/Hike'
import { Titre } from './components/Titre'
import { Contact } from './components/Contact'
import { Dons } from './components/Dons'

// Page dimensions from the background SVG (fixed coordinate system)
const PAGE_WIDTH = 756
const PAGE_HEIGHT = 12068

type ElementConfig = {
  bottomY: number
  width: number
  offsetX: number
}

const elements: Record<string, ElementConfig> = {
  titre:             { bottomY: 700,   width: 500, offsetX: 0 },
  bienvenue:         { bottomY: 2400,  width: 350, offsetX: 0 },
  informations:      { bottomY: 3550,  width: 380, offsetX: 0 },
  train:             { bottomY: 4720,  width: 420, offsetX: -90 },
  chapiteau:         { bottomY: 5310,  width: 550, offsetX: 0 },
  lettres:           { bottomY: 6100,  width: 400, offsetX: 0 },
  inspectionDesSacs: { bottomY: 7150,  width: 320, offsetX: 0 },
  hike:              { bottomY: 8320,  width: 220, offsetX: 140 },
  familles:          { bottomY: 9250,  width: 360, offsetX: 80 },
  concert:           { bottomY: 10100, width: 450, offsetX: 0 },
  bouffe:            { bottomY: 10800, width: 430, offsetX: -50 },
  journal:           { bottomY: 11800, width: 270, offsetX: 60 },
  contact:           { bottomY: 9660,  width: 150, offsetX: 180 },
  dons:              { bottomY: 11200,  width: 150, offsetX: -140 },
}

// Bulle offsets relative to each component (x, y from top-left of component, width)
type BulleOffset = { x: number; y: number; width: number }

const bulleOffsets: Record<string, BulleOffset> = {
  informations:      { x: 220,  y: 60,  width: 300 },
  train:             { x: 100,  y: 0,  width: 300 },
  chapiteau:         { x: 125,  y: 400,  width: 300 },
  lettres:           { x: 120,  y: 110,  width: 300 },
  inspectionDesSacs: { x: -150,  y: 50,  width: 300 },
  hike:              { x: 30,  y: -60,  width: 220 },
  concert:           { x: 70,  y: 400,  width: 300 },
  bouffe:            { x: 240,  y: 100,  width: 300 },
  journal:           { x: 70,  y: 50,  width: 300 },
  contact:           { x: 20,  y: -20,  width: 300 },
  dons:              { x: 0,  y: -70,  width: 300 },
}

// Bienvenue has two bulles
const bienvenueBulleOffsets = {
  inscription: { x: 50,  y: -30,  width: 300 },
  bienvenue:   { x: 240,   y: 30,  width: 300 },
}

// Familles has multiple bulles (the four acts)
const famillesBulleOffsets = {
  patatra:  { x: -90,  y: 160,  width: 300 },
  fantasia: { x: 150,   y: 150,  width: 300 },
  lamifa:   { x: 40,  y: -50,   width: 300 },
  zampazzi: { x: 230,   y: -50,   width: 300 },
}

/**
 * Navigation section config
 * - position: Y coordinate where BOTTOM OF SCREEN should align (in unscaled px)
 * - rangeUp/rangeDown: detection range around position for "active" state
 *
 * Active when: position - rangeDown <= screenBottom < position + rangeUp
 */
type NavSection = {
  id: string
  label: string
  position: number  // Bottom of screen aligns here when section is selected
  rangeUp: number   // Active detection extends this far above position
  rangeDown: number // Active detection extends this far below position
}

const navSections: NavSection[] = [
  { id: 'informations',      label: 'Infos',       position: 2700,  rangeUp: 500,  rangeDown: 500 },
  { id: 'bienvenue',         label: 'Bienvenue',   position: 3750,  rangeUp: 500,  rangeDown: 500 },
  { id: 'train',             label: 'Train',       position: 4950,  rangeUp: 500,  rangeDown: 100 },
  { id: 'chapiteau',         label: 'Chapiteau',   position: 5410,  rangeUp: 500,  rangeDown: 500 },
  { id: 'lettres',           label: 'Lettres',     position: 6100,  rangeUp: 500,  rangeDown: 500 },
  { id: 'inspectionDesSacs', label: 'Inspection',  position: 7150,  rangeUp: 500,  rangeDown: 500 },
  { id: 'hike',              label: 'Hike',        position: 8390,  rangeUp: 500,  rangeDown: 500 },
  { id: 'familles',          label: 'Familles',    position: 9350,  rangeUp: 500,  rangeDown: 500 },
  { id: 'concert',           label: 'Concert',     position: 10150, rangeUp: 500,  rangeDown: 500 },
  { id: 'bouffe',            label: 'Bouffe',      position: 10900, rangeUp: 500,  rangeDown: 500 },
  { id: 'journal',           label: 'Journal',     position: 11500, rangeUp: 500,  rangeDown: 500 },
]

function getElementStyle(config: ElementConfig): CSSProperties {
  const { bottomY, width, offsetX } = config
  return {
    position: 'absolute',
    top: bottomY,
    left: PAGE_WIDTH / 2 + offsetX,
    width: width,
    transform: 'translate(-50%, -100%)',
    transformOrigin: 'bottom center',
  }
}

function App() {
  const getScale = () => Math.min(window.innerWidth / PAGE_WIDTH, 1)
  const [scale, setScale] = useState(getScale)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [debugScrollBottom, setDebugScrollBottom] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const navRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Update indicator position when active section changes
  useEffect(() => {
    if (activeSection && buttonRefs.current[activeSection] && navRef.current) {
      const button = buttonRefs.current[activeSection]
      const nav = navRef.current
      if (button) {
        const navRect = nav.getBoundingClientRect()
        const buttonRect = button.getBoundingClientRect()
        setIndicatorStyle({
          left: buttonRect.left - navRect.left,
          width: buttonRect.width,
        })
      }
    }
  }, [activeSection])

  // Determine active section based on scroll position
  const updateActiveSection = useCallback(() => {
    const scrollTop = window.scrollY
    const viewportHeight = window.innerHeight
    const scrollBottom = (scrollTop + viewportHeight) / scale

    setDebugScrollBottom(Math.round(scrollBottom))

    for (const section of navSections) {
      const min = section.position - section.rangeDown
      const max = section.position + section.rangeUp
      if (scrollBottom >= min && scrollBottom < max) {
        setActiveSection(section.id)
        return
      }
    }
    setActiveSection(null)
  }, [scale])

  useEffect(() => {
    const updateScale = () => setScale(getScale())
    window.addEventListener('resize', updateScale)
    window.addEventListener('scroll', updateActiveSection)
    updateActiveSection()
    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('scroll', updateActiveSection)
    }
  }, [updateActiveSection])

  // Track mouse position in unscaled coordinates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / scale
        const y = (e.clientY - rect.top) / scale
        setMousePos({ x: Math.round(x), y: Math.round(y) })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [scale])

  const scrollToSection = (section: NavSection) => {
    const targetScrollBottom = section.position * scale
    const viewportHeight = window.innerHeight
    const targetScrollTop = targetScrollBottom - viewportHeight
    window.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' })
  }

  const scaledWidth = PAGE_WIDTH * scale
  const scaledHeight = PAGE_HEIGHT * scale

  return (
    <>
      {/* Debug Display */}
      <div
        style={{
          position: 'fixed',
          top: 60,
          left: 12,
          zIndex: 1001,
          padding: '6px 10px',
          borderRadius: 6,
          background: 'rgba(0, 0, 0, 0.75)',
          color: '#0f0',
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        bottom: {debugScrollBottom}<br />
        y: {mousePos.y}, x: {mousePos.x}
      </div>

      {/* Sticky Navigation Bar */}
      <nav
        ref={navRef}
        style={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: 4,
          padding: '8px 12px',
          borderRadius: 50,
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Animated sliding indicator */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            height: 'calc(100% - 16px)',
            borderRadius: 20,
            background: 'rgba(230, 57, 70, 0.85)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            opacity: activeSection ? 1 : 0,
          }}
        />

        {navSections.map((section) => (
          <button
            key={section.id}
            ref={(el) => { buttonRefs.current[section.id] = el }}
            onClick={() => scrollToSection(section)}
            style={{
              position: 'relative',
              padding: '6px 12px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeSection === section.id ? 600 : 400,
              background: 'transparent',
              color: activeSection === section.id ? '#fff' : '#333',
              transition: 'color 0.2s ease, font-weight 0.2s ease',
              zIndex: 1,
            }}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: scaledWidth,
          height: scaledHeight,
          margin: '0 auto',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 20px 10px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <Background
            className="absolute border-4"
            style={{ top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT }}
          />

          <Titre className="z-10" style={getElementStyle(elements.titre)} />
          <Informations className="z-10" style={getElementStyle(elements.informations)} bulleOffset={bulleOffsets.informations} />
          <Bienvenue className="z-10" style={getElementStyle(elements.bienvenue)} bulleOffsets={bienvenueBulleOffsets} />
          <Train className="z-10" style={getElementStyle(elements.train)} bulleOffset={bulleOffsets.train} />
          <Chapiteau className="z-10" style={getElementStyle(elements.chapiteau)} bulleOffset={bulleOffsets.chapiteau} />
          <Lettres className="z-10" style={getElementStyle(elements.lettres)} bulleOffset={bulleOffsets.lettres} />
          <InspectionDesSacs className="z-10" style={getElementStyle(elements.inspectionDesSacs)} bulleOffset={bulleOffsets.inspectionDesSacs} />
          <Hike className="z-10" style={getElementStyle(elements.hike)} bulleOffset={bulleOffsets.hike} />
          <Familles className="z-10" style={getElementStyle(elements.familles)} bulleOffsets={famillesBulleOffsets} />
          <Concert className="z-10" style={getElementStyle(elements.concert)} bulleOffset={bulleOffsets.concert} />
          <Bouffe className="z-10" style={getElementStyle(elements.bouffe)} bulleOffset={bulleOffsets.bouffe} />
          <Journal className="z-10" style={getElementStyle(elements.journal)} bulleOffset={bulleOffsets.journal} />
          <Contact className="z-10" style={getElementStyle(elements.contact)} bulleOffset={bulleOffsets.contact} />
          <Dons className="z-10" style={getElementStyle(elements.dons)} bulleOffset={bulleOffsets.dons} />
        </div>
      </div>
    </>
  )
}

export default App
