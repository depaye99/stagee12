"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  first_name?: string
  last_name?: string
}

export function useAuth(requiredRole?: string) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session && mounted) {
          setLoading(false)
          return
        }

        if (session?.user && mounted) {
          // Récupérer les informations utilisateur
          const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          const userProfile = userData || {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.email!.split("@")[0],
            role: "stagiaire",
          }

          // Vérifier le rôle si requis
          if (requiredRole && userProfile.role !== requiredRole) {
            const dashboardRoute = getDashboardRoute(userProfile.role)
            router.push(dashboardRoute)
            return
          }

          setUser(userProfile)
        }
      } catch (err) {
        console.error("Auth error:", err)
        if (mounted) {
          setError("Erreur d'authentification")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (mounted) {
          setUser(null)
        }
      } else if (event === "SIGNED_IN" && session) {
        checkAuth()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase, requiredRole])

  return { user, loading, error }
}

function getDashboardRoute(role: string): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "rh":
      return "/rh"
    case "tuteur":
      return "/tuteur"
    case "stagiaire":
    default:
      return "/stagiaire"
  }
}
