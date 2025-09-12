import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

function createCorsResponse(data: any, status: number) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization) {
      return createCorsResponse(
        { message: 'Authorization header is required' },
        401
      )
    }

    const token = authorization.replace('Bearer ', '')
    
    if (!token) {
      return createCorsResponse(
        { message: 'Token is required' },
        401
      )
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    await connectDB()
    
    // Find the user
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user) {
      return createCorsResponse(
        { message: 'User not found' },
        404
      )
    }

    if (!user.isActive) {
      return createCorsResponse(
        { message: 'Account is deactivated' },
        401
      )
    }

    // Get member data
    const member = user.memberId as any

    // Return user info (excluding password)
    const userInfo = {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      member: member ? {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        membershipStatus: member.membershipStatus,
        profilePicture: member.profilePicture
      } : null
    }

    return createCorsResponse(
      { 
        message: 'Token is valid',
        user: userInfo
      },
      200
    )

  } catch (error) {
    console.error('❌ Token verification error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return createCorsResponse(
        { message: 'Invalid token' },
        401
      )
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return createCorsResponse(
        { message: 'Token has expired' },
        401
      )
    }

    return createCorsResponse(
      { message: 'Internal server error' },
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return createCorsResponse(
        { message: 'Token is required' },
        400
      )
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    await connectDB()
    
    // Find the user
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user) {
      return createCorsResponse(
        { message: 'User not found' },
        404
      )
    }

    if (!user.isActive) {
      return createCorsResponse(
        { message: 'Account is deactivated' },
        401
      )
    }

    // Get member data
    const member2 = user.memberId as any

    // Return user info (excluding password)
    const userInfo = {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      member: member2 ? {
        id: member2._id,
        firstName: member2.firstName,
        lastName: member2.lastName,
        email: member2.email,
        phone: member2.phone,
        membershipStatus: member2.membershipStatus,
        profilePicture: member2.profilePicture
      } : null
    }

    return createCorsResponse(
      { 
        message: 'Token is valid',
        user: userInfo,
        valid: true
      },
      200
    )

  } catch (error) {
    console.error('❌ Token verification error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return createCorsResponse(
        { message: 'Invalid token', valid: false },
        401
      )
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return createCorsResponse(
        { message: 'Token has expired', valid: false },
        401
      )
    }

    return createCorsResponse(
      { message: 'Internal server error', valid: false },
      500
    )
  }
}