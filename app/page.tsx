'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else {
        // Redirect to appropriate dashboard based on role
        const roleRedirects = {
          admin: '/admin',
          rh: '/rh',
          tuteur: '/tuteur',
          stagiaire: '/stagiaire'
        }

        const redirect = roleRedirects[user.role || 'stagiaire'] || '/stagiaire'
        router.replace(redirect)
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  )
}
