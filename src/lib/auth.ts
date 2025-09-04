import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthResult {
  valid: boolean
  user?: {
    userId: string
    email: string
    role: string
    memberId?: string
  }
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value ||
                  request.cookies.get('token')?.value

    if (!token) {
      return { valid: false }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    return {
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        memberId: decoded.memberId
      }
    }
  } catch (error) {
    return { valid: false }
  }
}
