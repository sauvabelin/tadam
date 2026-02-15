import { useState } from 'react'
import { BubbleContent } from '../BubbleContent'
import { PostcardWizard } from './PostcardWizard'
import { useModal } from '../../context/ModalContext'

export function LettresContent() {
  const [showWizard, setShowWizard] = useState(false)
  const { closeModal } = useModal()

  if (showWizard) {
    return <PostcardWizard onClose={() => setShowWizard(false)} onSent={closeModal} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BubbleContent bubbleId="lettres" />

      <div style={{ padding: '1rem', flexShrink: 0, borderTop: '2px solid #ECE5DE' }}>
        <button
          onClick={() => setShowWizard(true)}
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#FFFEF5',
            background: '#902212',
            border: '3px solid #2D2D2D',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '5px 5px 0px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.2)'
          }}
        >
          Créer une carte postale
        </button>
      </div>
    </div>
  )
}
