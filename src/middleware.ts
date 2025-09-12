import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/']

// Routes that require specific roles
const roleBasedRoutes: Record<string, string[]> = {
  '/admin-management': ['super_admin'],
  '/settings': ['super_admin', 'admin']
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS for all API routes
  if (pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'false',
        },
      })
    }

    // For non-preflight API requests, continue with normal processing
    // but we'll add CORS headers in the response
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'false')
    
    return response
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // TEMPORARILY DISABLED - just allow everything
  return NextResponse.next()

  /*
  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value || 
                request.cookies.get('token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Check role-based access
    if (roleBasedRoutes[pathname]) {
      const requiredRoles = roleBasedRoutes[pathname]
      if (!requiredRoles.includes(decoded.role)) {
        // Redirect to dashboard if user doesn't have required role
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // For team leaders, restrict to team-related pages
    if (decoded.role === 'team_leader' && !pathname.startsWith('/teams') && 
        !pathname.startsWith('/profile') && pathname !== '/dashboard') {
      return NextResponse.redirect(new URL('/teams', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  */
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
