import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization) {
      return corsResponse(
        { message: 'Authorization header is required' },
        request,
        401
      )
    }

    const token = authorization.replace('Bearer ', '')
    
    if (!token) {
      return corsResponse(
        { message: 'Token is required' },
        request,
        401
      )
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    await connectDB()
    
    // Find the user
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user) {
      return corsResponse(
        { message: 'User not found' }, request,
        404
      )
    }

    if (!user.isActive) {
      return corsResponse(
        { message: 'Account is deactivated' }, request,
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

    return corsResponse(
      { 
        message: 'Token is valid',
        user: userInfo
      }, request,
      200
    )

  } catch (error) {
    console.error('❌ Token verification error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return corsResponse(
        { message: 'Invalid token' }, request,
        401
      )
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return corsResponse(
        { message: 'Token has expired' }, request,
        401
      )
    }

    return corsResponse(
      { message: 'Internal server error' }, request,
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return corsResponse(
        { message: 'Token is required' }, request,
        400
      )
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    await connectDB()
    
    // Find the user
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user) {
      return corsResponse(
        { message: 'User not found' }, request,
        404
      )
    }

    if (!user.isActive) {
      return corsResponse(
        { message: 'Account is deactivated' }, request,
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

    return corsResponse(
      { 
        message: 'Token is valid',
        user: userInfo,
        valid: true
      }, request,
      200
    )

  } catch (error) {
    console.error('❌ Token verification error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return corsResponse(
        { message: 'Invalid token', valid: false }, request,
        401
      )
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return corsResponse(
        { message: 'Token has expired', valid: false }, request,
        401
      )
    }

    return corsResponse(
      { message: 'Internal server error', valid: false }, request,
      500
    )
  }
}