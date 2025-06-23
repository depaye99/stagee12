import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Variables d'environnement Supabase non configurées")
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookieOptions = {
            ...options,
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
          }

          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          const cookieOptions = {
            ...options,
            path: "/",
            maxAge: 0,
          }

          request.cookies.set({
            name,
            value: "",
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...cookieOptions,
          })
        },
      },
    })

    // Routes publiques qui ne nécessitent pas d'authentification
    const publicRoutes = ["/auth/login", "/auth/register", "/api/auth", "/", "/api"]
    const isPublicRoute = publicRoutes.some(
      (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/"),
    )

    // Pour les routes API, on laisse passer
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return response
    }

    // Si c'est une route publique, laisser passer
    if (isPublicRoute) {
      return response
    }

    // Vérifier la session utilisateur pour les routes protégées
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Si pas d'utilisateur sur route protégée, rediriger vers login
    if (!user) {
      console.log("🔒 Aucun utilisateur trouvé, redirection vers login depuis:", request.nextUrl.pathname)
      const loginUrl = new URL("/auth/login", request.url)
      const fullPath = request.nextUrl.pathname + request.nextUrl.search
      loginUrl.searchParams.set("redirectTo", fullPath)
      return NextResponse.redirect(loginUrl)
    }

    // Vérifier le rôle utilisateur pour les routes spécifiques
    try {
      const { data: profile } = await supabase.from("users").select("role, is_active").eq("id", user.id).single()

      if (!profile || !profile.is_active) {
        console.log("🚫 Utilisateur inactif ou profil non trouvé")
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("message", "Compte inactif")
        return NextResponse.redirect(loginUrl)
      }

      const userRole = profile.role
      const path = request.nextUrl.pathname

      // Vérification des permissions par rôle (sans redirection infinie)
      if (path.startsWith("/admin") && userRole !== "admin") {
        console.log("🚫 Accès admin refusé pour rôle:", userRole)
        return NextResponse.redirect(new URL(`/${userRole}`, request.url))
      }
      if (path.startsWith("/rh") && !["admin", "rh"].includes(userRole)) {
        console.log("🚫 Accès RH refusé pour rôle:", userRole)
        return NextResponse.redirect(new URL(`/${userRole}`, request.url))
      }
      if (path.startsWith("/tuteur") && !["admin", "tuteur"].includes(userRole)) {
        console.log("🚫 Accès tuteur refusé pour rôle:", userRole)
        return NextResponse.redirect(new URL(`/${userRole}`, request.url))
      }
      if (path.startsWith("/stagiaire") && !["admin", "stagiaire"].includes(userRole)) {
        console.log("🚫 Accès stagiaire refusé pour rôle:", userRole)
        return NextResponse.redirect(new URL(`/${userRole}`, request.url))
      }
    } catch (error) {
      console.warn("⚠️ Erreur vérification profil utilisateur:", error)
      // En cas d'erreur, laisser passer pour éviter les boucles
    }

    return response
  } catch (error) {
    console.error("❌ Erreur middleware:", error)
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|images).*)"],
}
