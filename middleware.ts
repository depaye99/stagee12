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
            maxAge: 60 * 60 * 24 * 7, // 7 jours
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

    // Routes publiques
    const publicRoutes = ["/auth/login", "/auth/register", "/api/auth", "/"]
    const isPublicRoute = publicRoutes.some(
      (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/"),
    )

    // Laisser passer les routes API
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return response
    }

    // Vérifier la session utilisateur
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Si pas d'utilisateur et route privée, rediriger vers login
    if (!user && !isPublicRoute) {
      console.log("Aucun utilisateur trouvé, redirection vers login depuis:", request.nextUrl.pathname)
      const loginUrl = new URL("/auth/login", request.url)
      const fullPath = request.nextUrl.pathname + request.nextUrl.search
      loginUrl.searchParams.set("redirectTo", fullPath)
      return NextResponse.redirect(loginUrl)
    }

    // Si utilisateur connecté et sur page de login/register
    if (user && (request.nextUrl.pathname === "/auth/login" || request.nextUrl.pathname === "/auth/register")) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo")

      if (
        redirectTo &&
        redirectTo !== "/auth/login" &&
        redirectTo !== "/auth/register" &&
        redirectTo !== "/" &&
        !redirectTo.includes("/auth/") &&
        redirectTo.startsWith("/")
      ) {
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }

      // Déterminer le rôle et rediriger vers le bon dashboard
      let userRole = "stagiaire"
      try {
        if (user.user_metadata?.role) {
          userRole = user.user_metadata.role
        } else {
          const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

          if (userData?.role) {
            userRole = userData.role
          }
        }
      } catch (error) {
        console.warn("Impossible de récupérer le rôle, utilisation du fallback:", error)
      }

      let dashboardRoute = "/stagiaire"
      switch (userRole) {
        case "admin":
          dashboardRoute = "/admin"
          break
        case "rh":
          dashboardRoute = "/rh"
          break
        case "tuteur":
          dashboardRoute = "/tuteur"
          break
        default:
          dashboardRoute = "/stagiaire"
      }

      return NextResponse.redirect(new URL(dashboardRoute, request.url))
    }

    return response
  } catch (error) {
    console.error("Erreur middleware:", error)
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|images).*)"],
}
