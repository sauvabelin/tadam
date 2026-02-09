import { useEffect, useRef } from 'react'

const CLOUD_SVGS = [
  '/assets/Nuages/Fichier 1.svg',
  '/assets/Nuages/Fichier 2.svg',
  '/assets/Nuages/Fichier 3.svg',
  '/assets/Nuages/Fichier 4.svg',
  '/assets/Nuages/Fichier 5.svg',
]

const SCENE_WIDTH = 2728.91
const SKY_MAX_Y = 280

interface Cloud {
  src: string
  x: number
  y: number
  baseY: number
  width: number
  speed: number
  opacity: number
  noiseOffset: number
  noiseSpeed: number
  yPhase: number
  yFreq: number
  yAmp: number
}

// Fixed initial positions so clouds are always in the same spot on load,
// but each one gets unique noise/bob params for organic random movement
const INITIAL_CLOUDS: Cloud[] = [
  { src: CLOUD_SVGS[0], x: 200,  y: 60,  baseY: 60,  width: 280, speed: 0.15, opacity: 0.85, noiseOffset: 42,   noiseSpeed: 0.00025, yPhase: 0,    yFreq: 0.00025, yAmp: 15 },
  { src: CLOUD_SVGS[1], x: 800,  y: 140, baseY: 140, width: 220, speed: 0.10, opacity: 0.70, noiseOffset: 317,  noiseSpeed: 0.00015, yPhase: 1.8,  yFreq: 0.00035, yAmp: 10 },
  { src: CLOUD_SVGS[2], x: 1500, y: 40,  baseY: 40,  width: 320, speed: 0.12, opacity: 0.90, noiseOffset: 158,  noiseSpeed: 0.00030, yPhase: 3.5,  yFreq: 0.00020, yAmp: 20 },
  { src: CLOUD_SVGS[3], x: 2100, y: 120, baseY: 120, width: 250, speed: 0.08, opacity: 0.75, noiseOffset: 731,  noiseSpeed: 0.00012, yPhase: 5.1,  yFreq: 0.00030, yAmp: 12 },
  { src: CLOUD_SVGS[4], x: 500,  y: 180, baseY: 80, width: 200, speed: 0.18, opacity: 0.65, noiseOffset: 504,  noiseSpeed: 0.00035, yPhase: 2.3,  yFreq: 0.00018, yAmp: 22 },
  { src: CLOUD_SVGS[2], x: 2400, y: 140, baseY: 220, width: 180, speed: 0.09, opacity: 0.60, noiseOffset: 892,  noiseSpeed: 0.00020, yPhase: 4.7,  yFreq: 0.00038, yAmp: 8  },
  { src: CLOUD_SVGS[0], x: 1100, y: 90,  baseY: 90,  width: 260, speed: 0.13, opacity: 0.80, noiseOffset: 215,  noiseSpeed: 0.00028, yPhase: 0.9,  yFreq: 0.00022, yAmp: 18 },
]

// Layered sine waves give smooth, organic, non-repeating-looking motion
function smoothNoise(t: number): number {
  return (
    Math.sin(t * 1.0) * 0.5 +
    Math.sin(t * 2.3 + 1.7) * 0.3 +
    Math.sin(t * 4.1 + 3.2) * 0.2
  )
}

export function Clouds() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cloudsRef = useRef<Cloud[]>([])
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const animRef = useRef<number>(0)

  // Initialize clouds once from hardcoded positions
  if (cloudsRef.current.length === 0) {
    cloudsRef.current = INITIAL_CLOUDS.map(c => ({ ...c }))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = SCENE_WIDTH
    canvas.height = SKY_MAX_Y + 100

    // Preload all cloud images, then start animating
    const loadPromises = CLOUD_SVGS.map(src => {
      if (imagesRef.current.has(src)) return Promise.resolve()
      return new Promise<void>(resolve => {
        const img = new Image()
        img.onload = () => {
          imagesRef.current.set(src, img)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = src
      })
    })

    let alive = true

    Promise.all(loadPromises).then(() => {
      if (alive) animRef.current = requestAnimationFrame(animate)
    })

    function animate(time: number) {
      if (!alive || !ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const cloud of cloudsRef.current) {
        // Horizontal: smooth noise gives organic wind that varies per cloud
        const noise = smoothNoise(time * cloud.noiseSpeed + cloud.noiseOffset)
        cloud.x += noise * cloud.speed

        // Wrap around edges
        if (cloud.x > SCENE_WIDTH + cloud.width * 0.2) {
          cloud.x = -cloud.width
        } else if (cloud.x < -cloud.width) {
          cloud.x = SCENE_WIDTH + cloud.width * 0.2
        }

        // Vertical: gentle sine bob
        cloud.y = cloud.baseY + Math.sin(time * cloud.yFreq + cloud.yPhase) * cloud.yAmp

        // Draw
        const img = imagesRef.current.get(cloud.src)
        if (img) {
          ctx.globalAlpha = cloud.opacity
          const aspect = img.naturalHeight / img.naturalWidth
          ctx.drawImage(img, cloud.x, cloud.y, cloud.width, cloud.width * aspect)
        }
      }

      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(animate)
    }

    return () => {
      alive = false
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: SCENE_WIDTH,
        height: SKY_MAX_Y + 100,
        pointerEvents: 'none',
      }}
    />
  )
}
