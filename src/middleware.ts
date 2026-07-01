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

  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  const isDashboard = request.nextUrl.pathname.startsWith('/admin/dashboard')
  const isScanner = request.nextUrl.pathname.startsWith('/admin/scanner')

  // Not logged in → redirect to login
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Logged in on login page → redirect based on role
  if (user && isLoginPage) {
    const { data: admin } = await supabase.from('admins').select('role').eq('id', user.id).single()
    if (admin?.role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/admin/scanner', request.url))
  }

  // Regular admin trying to access dashboard → redirect to scanner
  if (user && isDashboard) {
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