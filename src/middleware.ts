import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/admin/dashboard')

  // Not logged in → redirect to login
  if (isAdminRoute && !isLoginPage && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Logged in → redirect away from login page
  if (isLoginPage && user) {
    const { data: admin } = await supabase.from('admins').select('role').eq('id', user.id).single()
    if (admin?.role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/admin/scanner', request.url))
    }
  }

  // Regular admin trying to access dashboard → redirect to scanner
  if (isDashboardRoute && user) {
    const { data: admin } = await supabase.from('admins').select('role').eq('id', user.id).single()
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/scanner', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*']
}