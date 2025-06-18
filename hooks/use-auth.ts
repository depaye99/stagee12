"use client"

import { useEffect, useState } from "react"
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
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        // Vérifier la session actuelle
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          if (mounted) {
            setError("Erreur de session")
            setLoading(false)
          }
          return
        }

        if (!session?.user) {
          console.log("No session found")
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        console.log("Session found for:", session.user.email)

        // Récupérer les informations utilisateur depuis la base
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        let userProfile: AuthUser

        if (userError || !userData) {
          console.warn("User not found in database, using session data")
          // Utiliser les données de session si pas de profil en base
          userProfile = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email!.split("@")[0],
            role: session.user.user_metadata?.role || "stagiaire",
            first_name: session.user.user_metadata?.first_name,
            last_name: session.user.user_metadata?.last_name,
          }
        } else {
          userProfile = {
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.first_name || userData.email.split("@")[0],
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
          }
        }

        if (mounted) {
          setUser(userProfile)
          setError(null)
          console.log("User authenticated:", userProfile.email, "Role:", userProfile.role)
        }
      } catch (err) {
        console.error("Auth check error:", err)
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
      console.log("Auth state changed:", event)

      if (event === "SIGNED_OUT" || !session) {
        if (mounted) {
          setUser(null)
          setError(null)
        }
      } else if (event === "SIGNED_IN" && session) {
        checkAuth()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading, error }
}
