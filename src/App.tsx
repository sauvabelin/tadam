import { CSSProperties, useEffect, useState } from 'react'
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
// import { Contact } from './components/Contact'
// import { Dons } from './components/Dons'

// Page dimensions from the background SVG (fixed coordinate system)
const PAGE_WIDTH = 756
const PAGE_HEIGHT = 12868

/**
 * Element positioning config (all values in pixels within the 756x12868 coordinate system)
 * - bottomY: distance from page top to element's BOTTOM CENTER
 * - width: element width
 * - offsetX: horizontal offset from page center (positive = right)
 */
type ElementConfig = {
  bottomY: number
  width: number
  offsetX: number
}

const elements: Record<string, ElementConfig> = {
  informations:      { bottomY: 2800,  width: 380, offsetX: 0 },
  bienvenue:         { bottomY: 3950,  width: 350, offsetX: 0 },
  train:             { bottomY: 5150,  width: 420, offsetX: -90},
  chapiteau:         { bottomY: 5710,  width: 550, offsetX: 0 },
  lettres:           { bottomY: 6500,  width: 400, offsetX: 0 },
  inspectionDesSacs: { bottomY: 7550,  width: 320, offsetX: -50 },
  hike:              { bottomY: 8790,  width: 220, offsetX: 140 },
  familles:          { bottomY: 9750,  width: 360, offsetX: 80 },
  concert:           { bottomY: 10550, width: 450, offsetX: 0 },
  bouffe:            { bottomY: 11200, width: 430, offsetX: -50 },
  journal:           { bottomY: 11600, width: 270, offsetX: 60 },
  // contact:        { bottomY: 5575,  width: 175, offsetX: 0 },
  // dons:           { bottomY: 5734,  width: 110, offsetX: 0 },
}

/**
 * Generate style for bottom-center anchored element
 * Uses pixel values - the entire container will be scaled together
 */
function getElementStyle(config: ElementConfig): CSSProperties {
  const { bottomY, width, offsetX } = config

  return {
    position: 'absolute',
    top: bottomY,
    left: PAGE_WIDTH / 2 + offsetX,
    width: width,
    // Anchor at bottom center
    transform: 'translate(-50%, -100%)',
    // Transform origin for animations
    transformOrigin: 'bottom center',
  }
}

function App() {
  const getScale = () => Math.min(window.innerWidth / PAGE_WIDTH, 1)
  const [scale, setScale] = useState(getScale)

  useEffect(() => {
    const updateScale = () => setScale(getScale())
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return (
    <div
      className="overflow-x-hidden"
      style={{ backgroundColor: '#6b6b6bff', minHeight: '100vh' }}
    >
      {/* Wrapper with scaled dimensions for proper centering */}
      <div
        className="mx-auto"
        style={{
          width: PAGE_WIDTH * scale,
          height: PAGE_HEIGHT * scale,
        }}
      >
        {/* Scaled container - everything inside uses fixed pixel coordinates */}
        <div
          className="relative"
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
        {/* Background - exact size of coordinate system */}
        <Background
          className="absolute z-0"
          style={{ top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT }}
        />

        {/* Elements - all positioned in pixel coordinates, scale together with container */}
        <Informations
          className="z-10"
          style={getElementStyle(elements.informations)}
        />

        <Bienvenue
          className="z-10"
          style={getElementStyle(elements.bienvenue)}
        />

        <Train
          className="z-10"
          style={getElementStyle(elements.train)}
        />

        <Chapiteau
          className="z-10"
          style={getElementStyle(elements.chapiteau)}
        />

        <Lettres
          className="z-10"
          style={getElementStyle(elements.lettres)}
        />

        <InspectionDesSacs
          className="z-10"
          style={getElementStyle(elements.inspectionDesSacs)}
        />

        <Hike
          className="z-10"
          style={getElementStyle(elements.hike)}
        />

        <Familles
          className="z-10"
          style={getElementStyle(elements.familles)}
        />

        <Concert
          className="z-10"
          style={getElementStyle(elements.concert)}
        />

        <Bouffe
          className="z-10"
          style={getElementStyle(elements.bouffe)}
        />

        <Journal
          className="z-10"
          style={getElementStyle(elements.journal)}
        />
        </div>
      </div>
    </div>
  )
}

export default App
