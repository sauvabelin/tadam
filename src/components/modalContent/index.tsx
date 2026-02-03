import { ReactNode } from 'react'
import { BulleId } from '../../types'
import { BubbleContent } from '../BubbleContent'

// Create a component factory for each bubble
const createBubbleContent = (id: BulleId) => () => <BubbleContent bubbleId={id} />

export const modalContentRegistry: Record<BulleId, () => ReactNode> = {
  informations: createBubbleContent('informations'),
  train: createBubbleContent('train'),
  chapiteau: createBubbleContent('chapiteau'),
  lettres: createBubbleContent('lettres'),
  inspectionDesSacs: createBubbleContent('inspectionDesSacs'),
  hike: createBubbleContent('hike'),
  concert: createBubbleContent('concert'),
  bouffe: createBubbleContent('bouffe'),
  journal: createBubbleContent('journal'),
  contact: createBubbleContent('contact'),
  dons: createBubbleContent('dons'),
  inscription: createBubbleContent('inscription'),
  bienvenue: createBubbleContent('bienvenue'),
  patatra: createBubbleContent('patatra'),
  fantasia: createBubbleContent('fantasia'),
  lamifa: createBubbleContent('lamifa'),
  zampazzi: createBubbleContent('zampazzi'),
}
