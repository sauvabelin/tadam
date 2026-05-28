// Shared types for mobile and desktop apps

export type BulleId =
  | 'informations' | 'train' | 'chapiteau' | 'lettres'
  | 'inspectionDesSacs' | 'hike' | 'concert' | 'bouffe'
  | 'journal' | 'contact' | 'dons'
  | 'inscription' | 'bienvenue'
  | 'patatra' | 'fantasia' | 'lamifa' | 'zampazzi'
  | 'serigraphie'

// Category types for admin sidebar
export type BubbleCategory = 'pages'

export interface CategoryConfig {
  id: BubbleCategory
  label: string
  bubbles: BulleId[]
}

export const BUBBLE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'pages',
    label: 'Pages',
    bubbles: [
      'informations', 'train', 'chapiteau', 'lettres', 'inspectionDesSacs',
      'hike', 'concert', 'bouffe', 'journal', 'contact', 'dons',
      'inscription', 'bienvenue', 'patatra', 'fantasia', 'lamifa', 'zampazzi',
      'serigraphie'
    ]
  },
]

export type ElementConfig = {
  bottomY: number
  width: number
  offsetX: number
}

export type BulleOffset = {
  x: number
  y: number
  width: number
}

// Desktop uses x (center), y (bottom) positioning - same anchor as mobile
export type DesktopElementConfig = {
  x: number  // center X position
  y: number  // bottom Y position
  width: number
}

// Shared bulle offsets - used by both mobile and desktop
// Offsets are relative to the component's top-left corner in pixels
export const bulleOffsets: Record<string, BulleOffset> = {
  informations:      { x: 220,  y: 60,  width: 300 },
  train:             { x: 100,  y: 0,  width: 300 },
  lettres:           { x: 120,  y: 110,  width: 300 },
  inspectionDesSacs: { x: -150,  y: 50,  width: 300 },
  hike:              { x: 30,  y: -60,  width: 220 },
  concert:           { x: 70,  y: 400,  width: 300 },
  bouffe:            { x: 240,  y: 100,  width: 300 },
  journal:           { x: 70,  y: 50,  width: 300 },
  contact:           { x: 20,  y: -20,  width: 300 },
  dons:              { x: 0,  y: -70,  width: 300 },
}

// Chapiteau has two bulles (trailer + sérigraphie)
export const chapiteauBulleOffsets = {
  chapiteau:    { x: 140,  y: 550,  width: 400 },
  serigraphie:  { x: 190,  y: 280,  width: 300 },
}

// Bienvenue has two bulles
export const bienvenueBulleOffsets = {
  inscription: { x: 50,  y: -30,  width: 300 },
  bienvenue:   { x: 240,   y: 30,  width: 300 },
}

// Familles has multiple bulles (the four acts)
export const famillesBulleOffsets = {
  patatra:  { x: -90,  y: 160,  width: 300 },
  fantasia: { x: 150,   y: 150,  width: 300 },
  lamifa:   { x: 40,  y: -50,   width: 300 },
  zampazzi: { x: 230,   y: -50,   width: 300 },
}

// Shared component widths - must be same in mobile and desktop for bulle alignment
export const componentWidths: Record<string, number> = {
  titre:             500,
  bienvenue:         350,
  informations:      380,
  train:             420,
  chapiteau:         700,
  lettres:           400,
  inspectionDesSacs: 320,
  hike:              220,
  familles:          360,
  concert:           450,
  bouffe:            430,
  journal:           270,
  contact:           150,
  dons:              150,
}
