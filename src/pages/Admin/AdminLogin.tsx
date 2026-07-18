import { useState, FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'

interface AdminLoginProps {
  onSuccess: () => void
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const success = await login(password)
      if (success) {
        onSuccess()
      } else {
        setError('Mot de passe incorrect')
        setPassword('')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `repeating-linear-gradient(
          90deg,
          #ECE5DE,
          #ECE5DE 40px,
          #902212 40px,
          #902212 80px
        )`,
        backgroundPosition: 'center',
        padding: '1rem',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#FFFEF5',
          padding: '2rem',
          borderRadius: '1rem',
          border: '4px solid #2D2D2D',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#2D2D2D',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          Admin Panel
        </h1>

        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#2D2D2D',
              marginBottom: '0.5rem',
            }}
          >
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              border: '3px solid #2D2D2D',
              borderRadius: '0.5rem',
              outline: 'none',
              background: '#FFFEF5',
              boxSizing: 'border-box',
              opacity: isSubmitting ? 0.7 : 1,
            }}
            placeholder="Entrez le mot de passe"
            autoFocus
          />
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: '#FF6B6B',
              border: '3px solid #2D2D2D',
              color: '#2D2D2D',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#FFFEF5',
            background: isSubmitting ? '#6b4a44' : '#902212',
            border: '3px solid #2D2D2D',
            borderRadius: '0.5rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {isSubmitting ? 'Connexion...' : 'Connexion'}
        </button>
      </form>
    </div>
  )
}
