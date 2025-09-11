import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Member } from '@/lib/models'

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

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email, password } = await request.json()

    console.log('📱 Mobile login attempt:', { email })

    if (!email || !password) {
      return createCorsResponse(
        { message: 'Email and password are required' },
        400
      )
    }

    // Find user by email and populate member data
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).populate('memberId')

    console.log('👤 User found:', user ? 'YES' : 'NO')
    console.log('👤 User ID:', user?._id)
    console.log('👤 Member ID from user:', user?.memberId?._id)
    console.log('👤 Member ID type:', typeof user?.memberId)
    
    if (user?.memberId) {
      console.log('👤 Member details:', {
        id: user.memberId._id,
        name: `${(user.memberId as any).firstName} ${(user.memberId as any).lastName}`,
        email: (user.memberId as any).email
      })
    } else {
      console.log('❌ No member associated with user')
    }

    if (!user) {
      return createCorsResponse(
        { message: 'Invalid email or password' },
        401
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return createCorsResponse(
        { message: 'Account is deactivated. Please contact support.' },
        401
      )
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const timeLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (1000 * 60))
      return createCorsResponse(
        { message: `Account locked. Try again in ${timeLeft} minutes.` },
        401
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log('❌ Mobile login failed - invalid password')
      
      // Increment login attempts
      user.loginAttempts += 1
      
      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000)
      }
      
      await user.save()

      return createCorsResponse(
        { message: 'Invalid email or password' },
        401
      )
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0
    user.lockoutUntil = undefined
    user.lastLogin = new Date()
    await user.save()

    // Update member last activity
    if (user.memberId) {
      await Member.findByIdAndUpdate(user.memberId, {
        lastActivityDate: new Date()
      })
    }

    // Generate JWT token with longer expiry for mobile
    const token = jwt.sign(
      { 
        userId: user._id,
        memberId: user.memberId?._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Get member data for mobile response
    const member = user.memberId as any

    // Mobile-optimized user response
    const userResponse = {
      id: user._id,
      memberId: member?._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      avatar: member?.avatar,
      phone: member?.phone,
      dateJoined: member?.dateJoined,
      isFirstTimer: member?.isFirstTimer,
      teamId: member?.teamId,
      communityIds: member?.communityIds || [],
      // User journey stats
      stats: {
        attendanceStreak: member?.attendanceStreak || 0,
        totalAttendance: member?.totalAttendance || 0,
        totalGiving: member?.totalGiving || 0,
        communitiesCount: member?.communityIds?.length || 0
      }
    }

    console.log('✅ Mobile login successful:', { 
      userId: user._id,
      email: user.email 
    })

    return createCorsResponse({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    }, 200)

  } catch (error) {
    console.error('Mobile login error:', error)
    return createCorsResponse(
      { message: 'Login failed. Please try again.' },
      500
    )
  }
}
