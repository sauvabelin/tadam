import { ReactNode } from 'react'
import { BulleId } from '../../types'
import { BubbleContent } from '../BubbleContent'
import { JournalViewer } from '../JournalViewer'
import { LettresContent } from '../postcards/LettresContent'

// Create a component factory for each bubble
const createBubbleContent = (id: BulleId) => () => <BubbleContent bubbleId={id} />

export const modalContentRegistry: Record<BulleId, () => ReactNode> = {
  informations: createBubbleContent('informations'),
  train: createBubbleContent('train'),
  chapiteau: () => (
    <div style={{ width: '100%', maxHeight: '80vh', aspectRatio: '16 / 9' }}>
      <iframe
        src="https://www.youtube-nocookie.com/embed/Kb3s3ss0E2w?autoplay=1"
        title="Chapiteau"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  ),
  lettres: () => <LettresContent />,
  inspectionDesSacs: createBubbleContent('inspectionDesSacs'),
  hike: createBubbleContent('hike'),
  concert: createBubbleContent('concert'),
  bouffe: createBubbleContent('bouffe'),
  journal: () => <JournalViewer />,
  contact: createBubbleContent('contact'),
  dons: createBubbleContent('dons'),
  inscription: createBubbleContent('inscription'),
  bienvenue: createBubbleContent('bienvenue'),
  patatra: createBubbleContent('patatra'),
  fantasia: createBubbleContent('fantasia'),
  lamifa: createBubbleContent('lamifa'),
  zampazzi: createBubbleContent('zampazzi'),
  serigraphie: createBubbleContent('serigraphie'),
}
