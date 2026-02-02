import { ReactNode } from 'react'
import { BulleId } from '../../types'

// Temporary "under construction" iframe component
const ConstructionIframe = () => (
  <iframe
    src="/construction.html"
    style={{
      width: '100%',
      height: 'calc(100vh - 100px)',
      border: 'none',
      borderRadius: '16px',
    }}
    title="En construction"
  />
)

export const modalContentRegistry: Record<BulleId, () => ReactNode> = {
  informations: ConstructionIframe,
  train: ConstructionIframe,
  chapiteau: ConstructionIframe,
  lettres: ConstructionIframe,
  inspectionDesSacs: ConstructionIframe,
  hike: ConstructionIframe,
  concert: ConstructionIframe,
  bouffe: ConstructionIframe,
  journal: ConstructionIframe,
  contact: ConstructionIframe,
  dons: ConstructionIframe,
  inscription: ConstructionIframe,
  bienvenue: ConstructionIframe,
  patatra: ConstructionIframe,
  fantasia: ConstructionIframe,
  lamifa: ConstructionIframe,
  zampazzi: ConstructionIframe,
}
