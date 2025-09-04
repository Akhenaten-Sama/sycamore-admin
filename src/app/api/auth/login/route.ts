import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    console.log('🌍 Environment check:')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('MONGODB_URI available:', !!process.env.MONGODB_URI)
    console.log('JWT_SECRET available:', !!process.env.JWT_SECRET)
    
    await connectDB()
    
    const { email, password } = await request.json()

    console.log('🔍 Login attempt:', { email, passwordLength: password?.length })

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).populate('memberId')

    console.log('👤 User found:', user ? 'YES' : 'NO')
    if (user) {
      console.log('📧 User email:', user.email)
      console.log('🔑 Stored hash:', user.password)
      console.log('✅ User active:', user.isActive)
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Account is deactivated. Please contact administrator.' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return NextResponse.json(
        { message: 'Account is temporarily locked. Please try again later.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    console.log('🔐 Password comparison:', {
      provided: password,
      hash: user.password,
      valid: isPasswordValid
    })

    if (!isPasswordValid) {
      console.log('❌ Password validation failed')
      // Increment login attempts
      user.loginAttempts += 1
      
      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }
      
      await user.save()

      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('✅ Login successful for:', user.email)

    // Reset login attempts on successful login
    user.loginAttempts = 0
    user.lockoutUntil = undefined
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Return user info (without password)
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

    // Create response with cookie
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        token,
        user: userResponse
      },
      { status: 200 }
    )

    // Set HTTP-only cookie for additional security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
