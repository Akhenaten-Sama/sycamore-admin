import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member, User } from '@/lib/models'
import { sendWelcomeEmail } from '@/lib/email-service'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password,
      dateOfBirth,
      maritalStatus = 'single'
    } = await request.json()

    console.log('📱 Mobile registration attempt:', { 
      email, 
      firstName, 
      lastName, 
      phone 
    })

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingMember = await Member.findOne({ email: email.toLowerCase() })
    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingMember || existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create member record
    const member = new Member({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      dateJoined: new Date(),
      isFirstTimer: true,
      isTeamLead: false,
      isAdmin: false,
      maritalStatus,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      communityIds: [],
      attendanceStreak: 0,
      totalAttendance: 0,
      totalGiving: 0,
      lastActivityDate: new Date()
    })

    const savedMember = await member.save()

    // Create user account linked to member
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: 'member',
      permissions: ['read:own_profile', 'update:own_profile'],
      isActive: true, // For mobile, activate immediately
      memberId: savedMember._id,
      lastLogin: new Date()
    })

    const savedUser = await user.save()

    // Link user to member
    savedMember.userId = savedUser._id
    await savedMember.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: savedUser._id,
        memberId: savedMember._id,
        email: savedUser.email,
        role: savedUser.role,
        permissions: savedUser.permissions
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Longer expiry for mobile
    )

    // Prepare mobile-optimized response
    const userResponse = {
      id: savedUser._id,
      memberId: savedMember._id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      phone: savedMember.phone,
      role: savedUser.role,
      avatar: savedMember.avatar,
      dateJoined: savedMember.dateJoined,
      isFirstTimer: savedMember.isFirstTimer
    }

    try {
      // Send welcome email (optional, don't fail registration if this fails)
      await sendWelcomeEmail(email, firstName)
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError)
      // Continue with successful registration
    }

    console.log('✅ Mobile registration successful:', { 
      userId: savedUser._id, 
      memberId: savedMember._id,
      email 
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      token,
      user: userResponse
    }, { status: 201 })

  } catch (error) {
    console.error('Mobile registration error:', error)
    return NextResponse.json(
      { message: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
