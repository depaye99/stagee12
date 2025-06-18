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
    console.warn("⚠️ Supabase environment variables not configured")
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

    const pathname = request.nextUrl.pathname

    // Routes qui ne nécessitent jamais d'authentification
    const publicRoutes = ["/", "/auth/login", "/auth/register"]
    const publicApiRoutes = ["/api/auth/"]
    const systemRoutes = ["/_next/", "/favicon", "/images/", "/public/"]

    // Laisser passer les routes système
    if (systemRoutes.some((route) => pathname.startsWith(route))) {
      return response
    }

    // Laisser passer les API d'authentification
    if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
      return response
    }

    // Laisser passer les routes publiques
    if (publicRoutes.includes(pathname)) {
      return response
    }

    // Vérifier l'authentification pour toutes les autres routes
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.warn("🔍 Middleware auth error:", error.message)
    }

    if (!user) {
      console.log("🚫 No user found, redirecting to login from:", pathname)
      const loginUrl = new URL("/auth/login", request.url)
      if (pathname !== "/auth/login") {
        loginUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search)
      }
      return NextResponse.redirect(loginUrl)
    }

    console.log("✅ User authenticated in middleware:", user.email)

    // Si utilisateur connecté et sur page de login/register, rediriger vers dashboard
    if (pathname === "/auth/login" || pathname === "/auth/register") {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo")

      if (redirectTo && redirectTo !== "/auth/login" && redirectTo !== "/auth/register" && redirectTo.startsWith("/")) {
        console.log("🔄 Redirecting authenticated user to:", redirectTo)
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }

      console.log("🔄 Redirecting authenticated user to default dashboard")
      return NextResponse.redirect(new URL("/stagiaire", request.url))
    }

    return response
  } catch (error) {
    console.error("💥 Middleware error:", error)
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
