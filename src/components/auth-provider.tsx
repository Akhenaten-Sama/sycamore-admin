'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'admin' | 'team_leader' | 'member'
  permissions: string[]
  avatar?: string
  memberId?: string
  teamIds?: string[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: string | string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (!token || !userData) {
        setLoading(false)
        if (pathname !== '/login') {
          router.push('/login')
        }
        return
      }

      // Verify token with server
      const response = await fetch('/api/auth/logout', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setUser(JSON.parse(userData))
      } else {
        // Token invalid, clear storage and redirect
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (pathname !== '/login') {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.role === 'super_admin') return true
    return user.permissions.includes(permission)
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.role)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission 
}: { 
  children: React.ReactNode
  requiredRole?: string | string[]
  requiredPermission?: string
}) {
  const { user, hasRole, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/dashboard')
      return
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push('/dashboard')
      return
    }
  }, [user, requiredRole, requiredPermission, hasRole, hasPermission, router])

  if (!user) return null

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
