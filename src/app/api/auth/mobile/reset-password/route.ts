import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { token, password } = await request.json()

    console.log('🔑 Password reset attempt with token:', token)

    if (!token || !password) {
      return corsResponse(
        { message: 'Token and new password are required' },
        request,
        400
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return corsResponse(
        { message: 'Password must be at least 6 characters long' },
        request,
        400
      )
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return corsResponse(
        { message: 'Invalid or expired reset token' },
        request,
        400
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset tokens
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordTokenExpiry = undefined
    user.mustChangePassword = false // Clear this flag since they just set a new password
    user.loginAttempts = 0 // Reset login attempts
    user.lockoutUntil = undefined // Clear any lockout
    await user.save()

    console.log('✅ Password reset successful for user:', user.email)

    return corsResponse({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    }, request, 200)

  } catch (error) {
    console.error('Reset password error:', error)
    return corsResponse(
      { message: 'Something went wrong. Please try again.' },
      request,
      500
    )
  }
}