import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/logosmart.png', '/lumi-logo.svg', '/lumi-logo-white.svg']

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (PUBLIC_PATHS.some(p => path === p)) {
    return NextResponse.next()
  }

  // Skip API routes that are not auth — they check session themselves
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  console.log(`[AUTH] Middleware check for path ${path}. Session userId: ${session.userId || 'NONE'}`)

  if (!session.userId) {
    if (path !== '/login') {
      console.log(`[AUTH] No session, redirecting to /login from ${path}`)
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Role-based route guards
  if (path.startsWith('/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/quotes', req.url))
  }

  if (path.startsWith('/manager') && session.role === 'sales') {
    return NextResponse.redirect(new URL('/quotes', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$).*)'],
}
