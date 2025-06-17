import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Vérifier que les variables d'environnement existent
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Si les variables ne sont pas configurées, laisser passer sans authentification
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase environment variables not configured, skipping auth middleware")
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    })

    // Routes qui ne nécessitent jamais d'authentification
    const alwaysPublicRoutes = ["/", "/auth/login", "/auth/register"]

    // Routes API qui ne nécessitent pas d'authentification
    const publicApiRoutes = ["/api/auth/login", "/api/auth/register", "/api/auth/logout", "/api/statistics"]

    // Assets et routes système
    const systemRoutes = ["/_next/", "/favicon", "/images/", "/public/"]

    const pathname = request.nextUrl.pathname

    // Laisser passer les assets et routes système
    if (systemRoutes.some((route) => pathname.startsWith(route))) {
      return response
    }

    // Laisser passer les routes API publiques
    if (publicApiRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      return response
    }

    // Laisser passer les routes toujours publiques
    if (alwaysPublicRoutes.includes(pathname)) {
      return response
    }

    // Pour toutes les autres routes, vérifier l'authentification
    let user = null
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      user = authUser
    } catch (error) {
      console.warn("Could not get user in middleware:", error)
    }

    // Si pas d'utilisateur, rediriger vers login
    if (!user) {
      console.log("No user found, redirecting to login from:", pathname)
      const loginUrl = new URL("/auth/login", request.url)
      if (pathname !== "/auth/login") {
        loginUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search)
      }
      return NextResponse.redirect(loginUrl)
    }

    // Si utilisateur connecté et sur page de login/register, rediriger
    if (user && (pathname === "/auth/login" || pathname === "/auth/register")) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo")

      if (redirectTo && redirectTo !== "/auth/login" && redirectTo !== "/auth/register" && redirectTo.startsWith("/")) {
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }

      // Redirection par défaut
      return NextResponse.redirect(new URL("/stagiaire", request.url))
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
