import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Routes qui ne nécessitent JAMAIS d'authentification
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/statistics", // API publique
    "/_next",
    "/favicon",
    "/images",
    "/public",
  ]

  // Vérifier si c'est une route publique
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(path))

  if (isPublicPath) {
    return response
  }

  // Configuration Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase not configured, allowing access")
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    })

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Si pas d'utilisateur, rediriger vers login
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Si utilisateur connecté sur page de login, rediriger vers dashboard
    if (pathname === "/auth/login" || pathname === "/auth/register") {
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
