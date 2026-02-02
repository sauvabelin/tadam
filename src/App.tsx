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
const PAGE_HEIGHT = 12068

type ElementConfig = {
  bottomY: number
  width: number
  offsetX: number
}

const elements: Record<string, ElementConfig> = {
  informations:      { bottomY: 2400,  width: 380, offsetX: 0 },
  bienvenue:         { bottomY: 3550,  width: 350, offsetX: 0 },
  train:             { bottomY: 4750,  width: 420, offsetX: -90 },
  chapiteau:         { bottomY: 5310,  width: 550, offsetX: 0 },
  lettres:           { bottomY: 6100,  width: 400, offsetX: 0 },
  inspectionDesSacs: { bottomY: 7150,  width: 320, offsetX: -50 },
  hike:              { bottomY: 8390,  width: 220, offsetX: 140 },
  familles:          { bottomY: 9350,  width: 360, offsetX: 80 },
  concert:           { bottomY: 10150, width: 450, offsetX: 0 },
  bouffe:            { bottomY: 10900, width: 430, offsetX: -50 },
  journal:           { bottomY: 11500, width: 270, offsetX: 60 },
}

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

  useEffect(() => {
    const updateScale = () => setScale(getScale())
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const scaledWidth = PAGE_WIDTH * scale
  const scaledHeight = PAGE_HEIGHT * scale

  return (
    <div
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

        <Informations className="z-10" style={getElementStyle(elements.informations)} />
        <Bienvenue className="z-10" style={getElementStyle(elements.bienvenue)} />
        <Train className="z-10" style={getElementStyle(elements.train)} />
        <Chapiteau className="z-10" style={getElementStyle(elements.chapiteau)} />
        <Lettres className="z-10" style={getElementStyle(elements.lettres)} />
        <InspectionDesSacs className="z-10" style={getElementStyle(elements.inspectionDesSacs)} />
        <Hike className="z-10" style={getElementStyle(elements.hike)} />
        <Familles className="z-10" style={getElementStyle(elements.familles)} />
        <Concert className="z-10" style={getElementStyle(elements.concert)} />
        <Bouffe className="z-10" style={getElementStyle(elements.bouffe)} />
        <Journal className="z-10" style={getElementStyle(elements.journal)} />
      </div>
    </div>
  )
}

export default App
