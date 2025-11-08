import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return corsResponse(
        { message: 'No token provided' },
        request,
        401
      )
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Find user
    const user = await User.findById(decoded.userId)
    
    if (!user || !user.isActive) {
      return corsResponse(
        { message: 'Invalid token' },
        request,
        401
      )
    }

    const { currentPassword, newPassword, isFirstTime } = await request.json()

    console.log('🔑 Password change request:', { 
      userId: user._id, 
      email: user.email,
      isFirstTime
    })

    if (!newPassword) {
      return corsResponse(
        { message: 'New password is required' },
        request,
        400
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return corsResponse(
        { message: 'Password must be at least 8 characters long' },
        request,
        400
      )
    }

    // For non-first-time changes, verify current password
    if (!isFirstTime) {
      if (!currentPassword) {
        return corsResponse(
          { message: 'Current password is required' },
          request,
          400
        )
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        return corsResponse(
          { message: 'Current password is incorrect' },
          request,
          401
        )
      }
    }

    // Check that new password is different from current (optional security measure)
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return corsResponse(
        { message: 'New password must be different from current password' },
        request,
        400
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password and clear mustChangePassword flag
    user.password = hashedPassword
    user.mustChangePassword = false
    user.loginAttempts = 0 // Reset login attempts
    user.lockoutUntil = undefined // Clear any lockout
    await user.save()

    console.log('✅ Password changed successfully for user:', user.email)

    return corsResponse({
      success: true,
      message: 'Password changed successfully'
    }, request, 200)

  } catch (error) {
    console.error('Password change error:', error)
    return corsResponse(
      { message: 'Failed to change password. Please try again.' },
      request,
      500
    )
  }
}