import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for these paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/debug') ||
    pathname.startsWith('/test') ||
    pathname.startsWith('/migrate') ||
    pathname.startsWith('/restore') ||
    pathname.startsWith('/diagnose') ||
    pathname.startsWith('/fix-') ||
    pathname === '/' ||
    pathname === '/not-found' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Extract short code (remove leading slash)
  const shortCode = pathname.slice(1)
  
  if (!shortCode) {
    return NextResponse.next()
  }

  try {
    // Call our API to get the redirect URL
    const apiUrl = new URL(`/api/redirect/${shortCode}`, request.url)
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'user-agent': request.headers.get('user-agent') || 'Unknown',
        'referer': request.headers.get('referer') || 'Direct',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'x-real-ip': request.headers.get('x-real-ip') || '',
      }
    })

    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location')
      if (location) {
        return NextResponse.redirect(location)
      }
    }
    
    // If not found or error, continue to page (which will show 404)
    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware redirect error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
