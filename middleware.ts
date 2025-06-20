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

    // Routes publiques qui ne nécessitent pas d'authentification
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/register",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/logout",
    ]

    const isPublicRoute = publicRoutes.some(
      (route) =>
        request.nextUrl.pathname === route ||
        request.nextUrl.pathname.startsWith("/api/") ||
        request.nextUrl.pathname.startsWith("/_next/") ||
        request.nextUrl.pathname.startsWith("/favicon"),
    )

    // Pour les routes API et assets, on laisse toujours passer
    if (
      request.nextUrl.pathname.startsWith("/api/") ||
      request.nextUrl.pathname.startsWith("/_next/") ||
      request.nextUrl.pathname.startsWith("/favicon")
    ) {
      return response
    }

    // Essayer de récupérer l'utilisateur (sans faire d'erreur si ça échoue)
    let user = null
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      user = authUser
    } catch (error) {
      console.warn("Could not get user in middleware:", error)
    }

    // Si pas d'utilisateur et route privée, rediriger vers login
    if (!user && !isPublicRoute) {
      const loginUrl = new URL("/auth/login", request.url)
      const fullPath = request.nextUrl.pathname + request.nextUrl.search
      if (fullPath !== "/auth/login") {
        loginUrl.searchParams.set("redirectTo", fullPath)
      }
      return NextResponse.redirect(loginUrl)
    }

    // Si utilisateur connecté et sur page de login/register, rediriger vers dashboard
    if (user && (request.nextUrl.pathname === "/auth/login" || request.nextUrl.pathname === "/auth/register")) {
      // Vérifier s'il y a un paramètre redirectTo valide
      const redirectTo = request.nextUrl.searchParams.get("redirectTo")

      if (redirectTo && redirectTo !== "/auth/login" && redirectTo !== "/auth/register" && redirectTo.startsWith("/")) {
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }

      // Redirection par défaut basée sur le rôle
      return NextResponse.redirect(new URL("/stagiaire", request.url))
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // En cas d'erreur, laisser passer pour éviter de bloquer l'app
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|images).*)"],
}
