import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured')
    return res
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        res.cookies.delete({ name, ...options })
      },
    },
  })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/api/auth/callback']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // API routes that don't need auth checks
  const apiRoutes = ['/api/auth/', '/api/test-supabase']
  const isApiRoute = apiRoutes.some(route => pathname.startsWith(route))

  // If user is not logged in and trying to access protected route
  if (!session && !isPublicRoute && !isApiRoute && pathname !== '/') {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (session && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Role-based route protection
  if (session?.user) {
    const userRole = session.user.user_metadata?.role || 'stagiaire'

    // Check if user is trying to access a role-specific route
    const roleRoutes = {
      admin: ['/admin'],
      rh: ['/rh'],
      tuteur: ['/tuteur'],
      stagiaire: ['/stagiaire']
    }

    // Find which role route user is trying to access
    const accessingRole = Object.keys(roleRoutes).find(role => 
      roleRoutes[role as keyof typeof roleRoutes].some(route => pathname.startsWith(route))
    )

    // If user is accessing a role route they don't have permission for
    if (accessingRole && userRole !== accessingRole && userRole !== 'admin') {
      // Redirect to their appropriate dashboard
      const roleRedirects = {
        admin: '/admin',
        rh: '/rh',
        tuteur: '/tuteur',
        stagiaire: '/stagiaire'
      }
      return NextResponse.redirect(new URL(roleRedirects[userRole as keyof typeof roleRedirects] || '/stagiaire', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
