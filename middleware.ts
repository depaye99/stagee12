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
    const publicRoutes = ["/auth/login", "/auth/register", "/api/auth", "/", "/api"]
    const isPublicRoute = publicRoutes.some(
      (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/"),
    )

    // Pour les routes API, on laisse passer
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return response
    }

    // Rafraîchir la session si nécessaire
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.warn("Middleware user error:", userError)
    }

    // Si pas d'utilisateur et route privée, rediriger vers login
    if (!user && !isPublicRoute) {
      console.log("No user found, redirecting to login from:", request.nextUrl.pathname)
      const loginUrl = new URL("/auth/login", request.url)
      // Inclure les paramètres de requête existants
      const fullPath = request.nextUrl.pathname + request.nextUrl.search
      loginUrl.searchParams.set("redirectTo", fullPath)
      return NextResponse.redirect(loginUrl)
    }

    // Si utilisateur connecté et sur page de login, rediriger vers dashboard
    if (user && (request.nextUrl.pathname === "/auth/login" || request.nextUrl.pathname === "/auth/register")) {
      // Vérifier s'il y a un paramètre redirectTo
      const redirectTo = request.nextUrl.searchParams.get('redirectTo')
      
      if (redirectTo && redirectTo !== '/auth/login' && redirectTo !== '/auth/register') {
        console.log("User already logged in, redirecting to requested page:", redirectTo)
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }

      // Sinon, redirection basée sur le rôle
      let userRole = "stagiaire"
      try {
        const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
        userRole = userData?.role || user.user_metadata?.role || "stagiaire"
      } catch (error) {
        console.warn("Could not fetch user role from database:", error)
        userRole = user.user_metadata?.role || "stagiaire"
      }

      console.log("User already logged in, redirecting to dashboard:", userRole)
      const dashboardRoute =
        userRole === "admin" ? "/admin" : userRole === "rh" ? "/rh" : userRole === "tuteur" ? "/tuteur" : "/stagiaire"
      return NextResponse.redirect(new URL(dashboardRoute, request.url))
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|images).*)"],
}
