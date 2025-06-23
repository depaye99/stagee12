'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signIn, user, loading, error } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectTo = searchParams.get('redirectedFrom') || '/'

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      // Determine redirect based on user role
      const roleRedirects = {
        admin: '/admin',
        rh: '/rh',
        tuteur: '/tuteur',
        stagiaire: '/stagiaire'
      }

      const defaultRedirect = roleRedirects[user.role || 'stagiaire'] || '/stagiaire'
      const finalRedirect = redirectTo === '/' ? defaultRedirect : redirectTo

      router.replace(finalRedirect)
    }
  }, [user, loading, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setIsSubmitting(true)

    if (!email || !password) {
      setLocalError('Veuillez remplir tous les champs')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await signIn(email, password)

      if (!result.success) {
        setLocalError(result.error || 'Erreur de connexion')
      }
    } catch (err) {
      setLocalError('Une erreur inattendue s\'est produite')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl sm:text-2xl">BT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Connexion à votre compte
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Bridge Technologies - Système de gestion des stagiaires
          </p>
        </div>

        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm sm:text-base"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm sm:text-base"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
              <div className="text-red-600 text-sm text-center">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/auth/register" 
              className="text-blue-600 hover:text-blue-500 text-sm sm:text-base transition-colors"
            >
              Pas encore de compte ? S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}