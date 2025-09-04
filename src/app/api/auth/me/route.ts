import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get token from Authorization header or cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Get fresh user data
    const user = await User.findById(decoded.userId).select('-password').populate('memberId')

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'User not found or inactive' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return NextResponse.json(
        { message: 'Account is temporarily locked' },
        { status: 401 }
      )
    }

    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      avatar: user.avatar,
      memberId: user.memberId,
      teamIds: user.teamIds
    }

    return NextResponse.json({
      message: 'User authenticated',
      user: userResponse
    })

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    )
  }
}
