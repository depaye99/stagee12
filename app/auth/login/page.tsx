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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Connexion
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte de gestion des stagiaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(localError || error) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {localError || error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link 
                href="/auth/register" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}