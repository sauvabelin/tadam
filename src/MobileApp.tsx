import { CSSProperties, useEffect, useState, useCallback, useRef } from 'react'
import { config } from './config'
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
import { ElementConfig, bulleOffsets, bienvenueBulleOffsets, famillesBulleOffsets, componentWidths } from './types'

// Page dimensions from the background SVG (fixed coordinate system)
const PAGE_WIDTH = 756
const PAGE_HEIGHT = 12068

const elements: Record<string, ElementConfig> = {
  titre:             { bottomY: 700,   width: componentWidths.titre, offsetX: 0 },
  bienvenue:         { bottomY: 2400,  width: componentWidths.bienvenue, offsetX: 0 },
  informations:      { bottomY: 3550,  width: componentWidths.informations, offsetX: 0 },
  train:             { bottomY: 4720,  width: componentWidths.train, offsetX: -90 },
  chapiteau:         { bottomY: 5360,  width: componentWidths.chapiteau, offsetX: 0 },
  lettres:           { bottomY: 6100,  width: componentWidths.lettres, offsetX: 0 },
  inspectionDesSacs: { bottomY: 7150,  width: componentWidths.inspectionDesSacs, offsetX: 0 },
  hike:              { bottomY: 8320,  width: componentWidths.hike, offsetX: 140 },
  familles:          { bottomY: 9250,  width: componentWidths.familles, offsetX: 80 },
  concert:           { bottomY: 10100, width: componentWidths.concert, offsetX: 0 },
  bouffe:            { bottomY: 10800, width: componentWidths.bouffe, offsetX: -50 },
  journal:           { bottomY: 11800, width: componentWidths.journal, offsetX: 60 },
  contact:           { bottomY: 9660,  width: componentWidths.contact, offsetX: 180 },
  dons:              { bottomY: 11200, width: componentWidths.dons, offsetX: -140 },
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
  { id: 'bienvenue',         label: 'Bienvenue',   position: 2690,  rangeUp: 500,  rangeDown: 500 },
  { id: 'informations',      label: 'Infos',       position: 3830,  rangeUp: 500,  rangeDown: 500 },
  { id: 'train',             label: 'Journée des parents',       position: 4950,  rangeUp: 500,  rangeDown: 100 },
  { id: 'chapiteau',         label: 'Trailer',   position: 5540,  rangeUp: 500,  rangeDown: 500 },
  { id: 'lettres',           label: 'Lettres',     position: 6340,  rangeUp: 500,  rangeDown: 500 },
  { id: 'inspectionDesSacs', label: 'Inspection des Sacs',  position: 7500,  rangeUp: 500,  rangeDown: 500 },
  { id: 'hike',              label: 'Hike',        position: 8750,  rangeUp: 500,  rangeDown: 500 },
  { id: 'familles',          label: 'Familles',    position: 9450,  rangeUp: 300,  rangeDown: 500 },
  { id: 'contact',           label: 'Contact',     position: 9900, rangeUp: 200,  rangeDown: 500 },
  { id: 'concert',           label: 'Concert',     position: 10250, rangeUp: 500,  rangeDown: 500 },
  { id: 'bouffe',            label: 'Bouffe',      position: 10940, rangeUp: 200,  rangeDown: 500 },
  { id: 'dons',              label: 'Dons',        position: 11400, rangeUp: 200,  rangeDown: 500 },
  { id: 'journal',           label: 'Journal',     position: 12000, rangeUp: 500,  rangeDown: 500 },
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

export function MobileApp() {
  const getScale = () => Math.min(window.innerWidth / PAGE_WIDTH, 1)
  const [scale, setScale] = useState(getScale)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [debugScrollBottom, setDebugScrollBottom] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [navBarVisible, setNavBarVisible] = useState(true)
  const navRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Check if nav bar fits in the screen
  useEffect(() => {
    const checkNavFit = () => {
      if (navRef.current) {
        const navWidth = navRef.current.scrollWidth
        setNavBarVisible(window.innerWidth >= navWidth + 24) // 24px for padding
      }
    }
    checkNavFit()
    window.addEventListener('resize', checkNavFit)
    return () => window.removeEventListener('resize', checkNavFit)
  }, [])

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
      {config.showDebug && (
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
      )}

      {/* Sticky Navigation Bar - hidden on small screens or via config */}
      <nav
        ref={navRef}
        style={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: config.showNavBar && navBarVisible ? 'flex' : 'none',
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
          overflow: 'hidden',
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
            className="absolute"
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

          {/* Inset shadow overlay - inside scaled content */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              boxShadow: 'inset 0 0 0 5px black, inset 0 0 20px 15px rgba(0, 0, 0, 0.3)',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />
        </div>
      </div>
    </>
  )
}
