"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/layout/header"
import { Loader2 } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: string
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/auth/login")
          return
        }

        // Récupérer les informations utilisateur
        const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (!userData) {
          router.push("/auth/login")
          return
        }

        // Vérifier le rôle si requis
        if (requiredRole && userData.role !== requiredRole) {
          // Rediriger vers le dashboard approprié
          const dashboardRoute =
            userData.role === "admin"
              ? "/admin"
              : userData.role === "rh"
                ? "/rh"
                : userData.role === "tuteur"
                  ? "/tuteur"
                  : "/stagiaire"

          router.push(dashboardRoute)
          return
        }

        setUser(userData)
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
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
