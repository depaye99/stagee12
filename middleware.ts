import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Routes système - toujours autorisées
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes("/favicon") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/public/")
  ) {
    return response
  }

  // Routes publiques - pas d'authentification requise
  const publicRoutes = ["/", "/auth/login", "/auth/register"]
  if (publicRoutes.includes(pathname)) {
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

    // Vérifier l'authentification de manière non-bloquante
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Si pas d'utilisateur ET que c'est une route privée, rediriger vers login
    if (!user && !publicRoutes.includes(pathname)) {
      console.log("🚫 No user found, redirecting to login from:", pathname)
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(loginUrl)
    }

    console.log("✅ Access granted to:", pathname, user ? `(${user.email})` : "(no user)")
    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // En cas d'erreur, laisser passer pour éviter les blocages
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
