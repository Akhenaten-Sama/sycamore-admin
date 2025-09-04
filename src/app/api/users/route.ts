import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import { User, Role } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const users = await User.find({ role: { $in: ['super_admin', 'admin', 'team_leader'] } })
      .populate('memberId', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 })

    return NextResponse.json(
      { success: true, data: users },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      permissions,
      isActive,
      teamIds,
      memberId
    } = await request.json()

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role,
      permissions: permissions || [],
      isActive: isActive !== undefined ? isActive : true,
      teamIds: teamIds || [],
      memberId: memberId || null,
      loginAttempts: 0
    })

    await user.save()

    // Return user without password
    const userResponse = await User.findById(user._id)
      .populate('memberId', 'firstName lastName email')
      .select('-password')

    return NextResponse.json(
      { success: true, data: userResponse },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
