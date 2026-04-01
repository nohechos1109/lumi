import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware function to handle pass-through of static assets and potential auth logic.
// By defining this, we take explicit control over what Next.js intercepts.
export function middleware(request: NextRequest) {
  // If the request reaches here, it's not excluded by the matcher.
  // We just allow it to continue for now.
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones that should be static:
     * - api (API routes)
     * - _next/static (Next.js static assets)
     * - _next/image (Next.js image optimization)
     * - favicon.ico (system files)
     * - and most importantly, any file ending with common image extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.ico$).*)',
  ],
}
