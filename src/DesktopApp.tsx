import { CSSProperties, useEffect, useState, useRef } from 'react'
import { config } from './config'
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
import { Contact } from './components/Contact'
import { Dons } from './components/Dons'
import { DesktopElementConfig, bulleOffsets, bienvenueBulleOffsets, famillesBulleOffsets, componentWidths } from './types'

// Desktop background dimensions from Ordi_Fond.svg viewBox
const PAGE_WIDTH = 2728.91
const PAGE_HEIGHT = 1535.45

// Desktop element positions (x = center X, y = bottom Y)
// Same anchor logic as mobile: bottom-center of component
// Width is shared with mobile to ensure bulle alignment
// These are placeholder positions - user will manually adjust x, y
const elements: Record<string, DesktopElementConfig> = {
  bienvenue:         { x: 950,  y: 1500,  width: componentWidths.bienvenue },
  informations:      { x: 1700,  y: 1500,  width: componentWidths.informations },
  train:             { x: 1200, y: 550,  width: componentWidths.train },
  chapiteau:         { x: 1600, y: 950,  width: componentWidths.chapiteau },
  lettres:           { x: 2300, y: 1500,  width: componentWidths.lettres },
  inspectionDesSacs: { x: 400,  y: 1400,  width: componentWidths.inspectionDesSacs },
  hike:              { x: 2000,  y: 310,  width: componentWidths.hike },
  familles:          { x: 2200, y: 1100,  width: componentWidths.familles },
  concert:           { x: 950, y: 900,  width: componentWidths.concert },
  bouffe:            { x: 500, y: 580,  width: componentWidths.bouffe },
  journal:           { x: 300, y: 950,  width: componentWidths.journal },
  contact:           { x: 2520,  y: 900, width: componentWidths.contact },
  dons:              { x: 1900,  y: 680, width: componentWidths.dons },
}

function getElementStyle(config: DesktopElementConfig): CSSProperties {
  const { x, y, width } = config
  return {
    position: 'absolute',
    left: x,
    top: y,
    width: width,
    transform: 'translate(-50%, -100%)',
    transformOrigin: 'bottom center',
  }
}

export function DesktopApp() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate scale based on width only, allow vertical scroll if needed
  useEffect(() => {
    const updateScale = () => {
      setScale(window.innerWidth / PAGE_WIDTH)
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // Track mouse position in unscaled SVG coordinates
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

  const scaledWidth = PAGE_WIDTH * scale
  const scaledHeight = PAGE_HEIGHT * scale

  return (
    <>
      {/* Debug Display */}
      {config.showDebug && (
        <div
          style={{
            position: 'fixed',
            top: 12,
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
          Desktop Mode<br />
          y: {mousePos.y}, x: {mousePos.x}
        </div>
      )}

      {/* Main Content */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: scaledWidth,
          height: scaledHeight,
          margin: '0 auto',
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
          {/* Desktop Background */}
          <img
            src="/assets/Ordi_Fond.svg"
            alt="Background"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
            }}
          />

          <Informations className="z-10" style={getElementStyle(elements.informations)} bulleOffset={bulleOffsets.informations} />
          <Bienvenue className="z-10" style={getElementStyle(elements.bienvenue)} bulleOffsets={bienvenueBulleOffsets} />
          <Train className="z-11" style={getElementStyle(elements.train)} bulleOffset={bulleOffsets.train} />
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

        {/* Inset shadow overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            boxShadow: 'inset 0 0 20px 10px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </>
  )
}
