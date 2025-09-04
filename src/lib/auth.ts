import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import connectDB from './mongodb'
import { User } from './models'

export interface AuthUser {
  id: string
  email: string
  role: string
  memberId?: string
  teamIds?: string[]
}

export interface AuthResult {
  valid: boolean
  user?: AuthUser
  error?: string
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return { valid: false, error: 'No token provided' }
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return { valid: false, error: 'JWT secret not configured' }
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    
    // Get fresh user data from database
    await connectDB()
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user || !user.isActive) {
      return { valid: false, error: 'User not found or inactive' }
    }

    return {
      valid: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        memberId: user.memberId?.toString(),
        teamIds: user.teamIds?.map((id: any) => id.toString())
      }
    }
  } catch (error) {
    return { valid: false, error: 'Invalid token' }
  }
}

export function hasPermission(user: AuthUser, permission: string): boolean {
  // Super admin has all permissions
  if (user.role === 'super_admin') {
    return true
  }

  // Define role-based permissions
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'members.view', 'members.create', 'members.edit', 'members.delete',
      'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
      'events.view', 'events.create', 'events.edit', 'events.delete',
      'blog.view', 'blog.create', 'blog.edit', 'blog.delete',
      'form-submissions.view', 'form-submissions.export'
    ],
    team_leader: [
      'teams.view.own', 'members.view.team', 'tasks.create.team', 'tasks.view.team'
    ],
    member: [
      'profile.view', 'profile.edit'
    ]
  }

  const userPermissions = rolePermissions[user.role] || []
  return userPermissions.includes(permission)
}
