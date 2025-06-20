'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/lib/supabase/database.types'
import { Loader2 } from 'lucide-react'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function RouteGuard({ 
  children, 
  requiredRole, 
  allowedRoles,
  redirectTo = '/auth/login' 
}: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.replace(redirectTo)
        return
      }

      // Check role permissions
      if (requiredRole || allowedRoles) {
        const userRole = user.role
        
        // Admin has access to everything
        if (userRole === 'admin') {
          return
        }

        // Check specific role requirement
        if (requiredRole && userRole !== requiredRole) {
          const roleRedirects = {
            admin: '/admin',
            rh: '/rh',
            tuteur: '/tuteur',
            stagiaire: '/stagiaire'
          }
          router.replace(roleRedirects[userRole || 'stagiaire'] || '/stagiaire')
          return
        }

        // Check allowed roles
        if (allowedRoles && !allowedRoles.includes(userRole || 'stagiaire')) {
          const roleRedirects = {
            admin: '/admin',
            rh: '/rh',
            tuteur: '/tuteur',
            stagiaire: '/stagiaire'
          }
          router.replace(roleRedirects[userRole || 'stagiaire'] || '/stagiaire')
          return
        }
      }
    }
  }, [user, loading, router, requiredRole, allowedRoles, redirectTo])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated or authorized
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    )
  }

  // Check role permissions again before rendering
  if (requiredRole || allowedRoles) {
    const userRole = user.role
    
    // Admin has access to everything
    if (userRole !== 'admin') {
      // Check specific role requirement
      if (requiredRole && userRole !== requiredRole) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Redirection...</p>
            </div>
          </div>
        )
      }

      // Check allowed roles
      if (allowedRoles && !allowedRoles.includes(userRole || 'stagiaire')) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Redirection...</p>
            </div>
          </div>
        )
      }
    }
  }

  return <>{children}</>
}
