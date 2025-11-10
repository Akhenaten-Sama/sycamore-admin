import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Member } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      // Find user and populate member data
      const user = await User.findById(decoded.userId).populate('memberId')
      
      if (!user || !user.isActive) {
        return NextResponse.json(
          { message: 'Invalid token' },
          { status: 401 }
        )
      }

      const member = user.memberId as any

      // Return mobile-optimized user profile
      const userProfile = {
        id: user._id,
        memberId: member?._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        mustChangePassword: user.mustChangePassword || false,
        profileComplete: !!(member?.phone && member?.dateOfBirth && member?.address),
        avatar: member?.avatar,
        phone: member?.phone,
        dateJoined: member?.dateJoined,
        dateOfBirth: member?.dateOfBirth,
        maritalStatus: member?.maritalStatus,
        address: member?.address,
        isFirstTimer: member?.isFirstTimer,
        teamId: member?.teamId,
        communityIds: member?.communityIds || [],
        skills: member?.skills || [],
        interests: member?.interests || [],
        availability: member?.availability,
        emergencyContact: member?.emergencyContact,
        // User journey stats
        stats: {
          attendanceStreak: member?.attendanceStreak || 0,
          totalAttendance: member?.totalAttendance || 0,
          totalGiving: member?.totalGiving || 0,
          communitiesCount: member?.communityIds?.length || 0
        },
        lastActivityDate: member?.lastActivityDate,
        lastLogin: user.lastLogin
      }

      return NextResponse.json({
        success: true,
        user: userProfile
      }, { status: 200 })

    } catch (jwtError) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Mobile profile fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
