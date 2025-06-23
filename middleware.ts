import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { settingsService } from "@/lib/services/settings-service"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // **UTILISATION DES PARAMÈTRES SYSTÈME** - Timeout de session
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Vérifier le timeout de session basé sur les paramètres système
      const sessionTimeoutHours = await settingsService.getSetting("session_timeout_hours")
      const lastActivity = request.cookies.get("last_activity")?.value

      if (lastActivity) {
        const lastActivityTime = new Date(lastActivity)
        const now = new Date()
        const hoursDiff = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60 * 60)

        if (hoursDiff > sessionTimeoutHours) {
          console.log(`🕐 Session expirée après ${hoursDiff.toFixed(1)}h (limite: ${sessionTimeoutHours}h)`)

          // Déconnecter l'utilisateur
          await supabase.auth.signOut()

          // Rediriger vers la page de connexion
          const redirectUrl = new URL("/auth/login", request.url)
          redirectUrl.searchParams.set("message", "Session expirée")
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Mettre à jour l'activité
      supabaseResponse.cookies.set("last_activity", new Date().toISOString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 jours
      })
    }
  } catch (error) {
    console.error("Erreur middleware session timeout:", error)
  }

  // Routes protégées
  const protectedRoutes = ["/admin", "/rh", "/tuteur", "/stagiaire"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Vérifier le rôle pour les routes spécifiques
    const { data: profile } = await supabase.from("users").select("role, statut").eq("id", user.id).single()

    if (!profile || profile.statut !== "actif") {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    const userRole = profile.role
    const path = request.nextUrl.pathname

    // Vérification des permissions par rôle
    if (path.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (path.startsWith("/rh") && !["admin", "rh"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (path.startsWith("/tuteur") && !["admin", "tuteur"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (path.startsWith("/stagiaire") && !["admin", "stagiaire"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
