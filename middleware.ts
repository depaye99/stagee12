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

    // Routes publiques - pas d'authentification requise
    const publicRoutes = ["/", "/auth/login", "/auth/register"]

    // Routes système - toujours autorisées
    if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/api/auth/") ||
      pathname.includes("/favicon") ||
      pathname.startsWith("/images/") ||
      publicRoutes.includes(pathname)
    ) {
      return response
    }

    // Vérifier l'authentification pour les routes privées
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL("/auth/login", request.url)
      if (pathname !== "/auth/login") {
        loginUrl.searchParams.set("redirectTo", pathname)
      }
      return NextResponse.redirect(loginUrl)
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
