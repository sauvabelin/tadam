import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const AUTH_STORAGE_KEY = 'tadam-admin-token'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem(AUTH_STORAGE_KEY)
  })
  const [isLoading, setIsLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = sessionStorage.getItem(AUTH_STORAGE_KEY)
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        if (response.ok) {
          setToken(storedToken)
        } else {
          // Token invalid, clear it
          sessionStorage.removeItem(AUTH_STORAGE_KEY)
          setToken(null)
        }
      } catch {
        // Network error, keep token for now
        setToken(storedToken)
      } finally {
        setIsLoading(false)
      }
    }

    verifyToken()
  }, [])

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem(AUTH_STORAGE_KEY, data.token)
        setToken(data.token)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    const storedToken = sessionStorage.getItem(AUTH_STORAGE_KEY)

    // Call server-side logout to invalidate token
    if (storedToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })
      } catch {
        // Ignore errors, still clear local state
      }
    }

    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: token !== null,
        isLoading,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
