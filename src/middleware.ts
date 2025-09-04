import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login']

// Routes that require specific roles
const roleBasedRoutes: Record<string, string[]> = {
  '/admin-management': ['super_admin'],
  '/settings': ['super_admin', 'admin']
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for authentication token
  const token = request.cookies.get('token')?.value || 
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
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
