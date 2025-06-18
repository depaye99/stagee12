"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/layout/header"
import { Loader2 } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: string
  allowGuest?: boolean // Nouvelle prop pour permettre l'accès sans authentification
}

export function DashboardLayout({ children, requiredRole, allowGuest = false }: DashboardLayoutProps) {
  const { user, loading, error } = useAuth(requiredRole)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !allowGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Se reconnecter
          </a>
        </div>
      </div>
    )
  }

  // Si pas d'utilisateur mais accès invité autorisé, afficher quand même
  if (!user && allowGuest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-semibold">Application de gestion des stagiaires</h1>
              <a href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Se connecter
              </a>
            </div>
          </div>
        </div>
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    )
  }

  // Si pas d'utilisateur et accès invité non autorisé, rediriger
  if (!user && !allowGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder à cette page</p>
          <a href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Se connecter
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
