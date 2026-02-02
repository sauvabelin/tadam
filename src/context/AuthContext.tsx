import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

const ADMIN_PASSWORD = 'acriter1912'
const AUTH_STORAGE_KEY = 'tadam-admin-auth'

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => boolean
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true')
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [isAuthenticated])

  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
