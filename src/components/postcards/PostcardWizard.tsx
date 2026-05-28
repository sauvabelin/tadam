import { useState } from 'react'
import { BackgroundPicker } from './BackgroundPicker'
import { MessageEditor } from './MessageEditor'
import { PostcardPreview } from './PostcardPreview'
import { submitPostcard } from '../../api/postcardApi'
import { TROUPES, type Role } from '../../data/troupes'

interface Props {
  onClose: () => void
  onSent: () => void
}

const STEPS = ['Fond', 'Carte postale', 'Aperçu']

export function PostcardWizard({ onClose, onSent }: Props) {
  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [backgroundId, setBackgroundId] = useState<number | null>(null)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('')
  const [message, setMessage] = useState('')
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [troupe, setTroupe] = useState('')
  const [patrouille, setPatrouille] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const selectedTroupe = TROUPES.find((t) => t.id === troupe)
  const troupeLabel = selectedTroupe?.label || ''
  const patrouilleLabel = selectedTroupe?.patrouilles.find((p) => p.id === patrouille)?.label || ''

  const canNext = () => {
    if (step === 1) return backgroundId !== null
    if (step === 2) return message.replace(/<[^>]*>/g, '').trim().length > 0 && troupe !== '' && role !== '' && name.trim() !== ''
    return false
  }

  const goToStep = (target: number) => {
    setStep(target)
    setMaxReachedStep((prev) => Math.max(prev, target))
  }

  const handleStepClick = (stepNum: number) => {
    if (stepNum <= maxReachedStep) {
      setStep(stepNum)
    }
  }

  const handleBackgroundSelect = (id: number, imageUrl: string) => {
    setBackgroundId(id)
    setBackgroundImageUrl(imageUrl)
  }

  const handleSubmit = async () => {
    if (!backgroundId || !role || !name.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const result = await submitPostcard({
        background_id: backgroundId,
        message,
        role: role as Role,
        name: name.trim(),
        troupe: troupeLabel || undefined,
        patrouille: patrouilleLabel || undefined,
      })
      if (result.ok) {
        setSuccess(true)
      } else {
        setError(result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'role') setRole(value)
    if (field === 'name') setName(value)
    if (field === 'troupe') setTroupe(value)
    if (field === 'patrouille') setPatrouille(value)
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#x2709;&#xFE0F;</div>
        <h2 style={{ margin: '0 0 0.75rem', color: '#2D2D2D', fontWeight: 800 }}>
          Carte postale envoyée !
        </h2>
        <p style={{ color: '#4a4a4a', marginBottom: '1.5rem' }}>
          Merci ! Ta carte postale a bien été enregistrée.
        </p>
        <button
          onClick={onSent}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#FFFEF5',
            background: '#902212',
            border: '3px solid #2D2D2D',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.2)',
          }}
        >
          Fermer
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Step indicators (clickable) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          flexShrink: 0,
        }}
      >
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const isActive = stepNum === step
          const isDone = stepNum < step
          const isClickable = stepNum <= maxReachedStep
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                onClick={() => handleStepClick(stepNum)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: isClickable || isActive ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: isActive ? '#902212' : isDone ? '#90EE90' : '#ECE5DE',
                    color: isActive ? '#FFFEF5' : '#2D2D2D',
                    border: '2px solid #2D2D2D',
                    transition: 'all 0.15s',
                  }}
                >
                  {isDone ? '\u2713' : stepNum}
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#902212' : '#6b7280',
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: '2rem',
                    height: '2px',
                    background: isDone ? '#90EE90' : '#ECE5DE',
                    borderRadius: '1px',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 1rem 1rem' }}>
        {step === 1 && (
          <BackgroundPicker selectedId={backgroundId} onSelect={handleBackgroundSelect} />
        )}
        {step === 2 && (
          <MessageEditor
            initialContent={message}
            onChange={setMessage}
            address={{ role, name, troupe, patrouille }}
            onAddressChange={handleFieldChange}
          />
        )}
        {step === 3 && backgroundId && (
          <PostcardPreview
            backgroundId={backgroundId}
            backgroundImageUrl={backgroundImageUrl}
            message={message}
            role={role}
            name={name}
            troupe={troupeLabel}
            patrouille={patrouilleLabel}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '0.5rem 1rem',
            margin: '0 1rem',
            background: '#FF6B6B',
            border: '2px solid #2D2D2D',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#2D2D2D',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderTop: '2px solid #ECE5DE',
          flexShrink: 0,
        }}
      >
        <button
          onClick={step === 1 ? onClose : () => setStep(step - 1)}
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#2D2D2D',
            background: '#ECE5DE',
            border: '3px solid #2D2D2D',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          {step === 1 ? 'Annuler' : 'Retour'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => goToStep(step + 1)}
            disabled={!canNext()}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#FFFEF5',
              background: canNext() ? '#902212' : '#9ca3af',
              border: '3px solid #2D2D2D',
              borderRadius: '0.5rem',
              cursor: canNext() ? 'pointer' : 'not-allowed',
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.2)',
            }}
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#FFFEF5',
              background: !submitting ? '#902212' : '#9ca3af',
              border: '3px solid #2D2D2D',
              borderRadius: '0.5rem',
              cursor: !submitting ? 'pointer' : 'not-allowed',
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.2)',
            }}
          >
            {submitting ? 'Envoi...' : 'Envoyer'}
          </button>
        )}
      </div>
    </div>
  )
}
