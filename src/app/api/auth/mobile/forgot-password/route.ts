import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User, Member } from '@/lib/models'
import { sendPasswordResetEmail } from '@/lib/email-service'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'
import crypto from 'crypto'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email } = await request.json()

    console.log('📧 Password reset request for:', email)

    if (!email) {
      return corsResponse(
        { message: 'Email is required' },
        request,
        400
      )
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).populate('memberId')

    if (!user) {
      // Don't reveal if email exists or not for security
      return corsResponse({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      }, request, 200)
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Save reset token to user
    user.resetPasswordToken = resetToken
    user.resetPasswordTokenExpiry = resetTokenExpiry
    await user.save()

    // Send password reset email
    try {
      const member = user.memberId as any
      const resetUrl = `${process.env.FRONTEND_URL || 'https://mobile.sycamore.church'}/reset-password?token=${resetToken}`
      
      await sendPasswordResetEmail(
        user.email, 
        member?.firstName || user.firstName,
        resetUrl
      )

      console.log('✅ Password reset email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Clear the reset token if email failed
      user.resetPasswordToken = undefined
      user.resetPasswordTokenExpiry = undefined
      await user.save()
      
      return corsResponse(
        { message: 'Failed to send password reset email. Please try again.' },
        request,
        500
      )
    }

    return corsResponse({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    }, request, 200)

  } catch (error) {
    console.error('Forgot password error:', error)
    return corsResponse(
      { message: 'Something went wrong. Please try again.' },
      request,
      500
    )
  }
}