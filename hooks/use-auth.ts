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
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          if (mounted) {
            router.push("/auth/login")
          }
          return
        }

        // Récupérer les informations utilisateur depuis la base
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userError || !userData) {
          console.error("User data error:", userError)
          if (mounted) {
            router.push("/auth/login")
          }
          return
        }

        // Vérifier le rôle si requis
        if (requiredRole && userData.role !== requiredRole) {
          const dashboardRoute = getDashboardRoute(userData.role)
          if (mounted) {
            router.push(dashboardRoute)
          }
          return
        }

        if (mounted) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.first_name || userData.email,
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
          })
        }
      } catch (err) {
        console.error("Auth error:", err)
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erreur d'authentification")
          router.push("/auth/login")
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
          router.push("/auth/login")
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
