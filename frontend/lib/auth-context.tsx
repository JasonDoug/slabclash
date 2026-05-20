'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { authApi, type User, type LoginDto, type SignupDto } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginDto) => Promise<void>
  signup: (data: SignupDto) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('auth_token')
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('auth_token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (data: LoginDto) => {
    const response = await authApi.login(data)
    const { accessToken, user: userData } = response.data
    
    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    router.push('/collection')
  }, [router])

  const signup = useCallback(async (data: SignupDto) => {
    const response = await authApi.signup(data)
    const { accessToken, user: userData } = response.data
    
    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    router.push('/collection')
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
