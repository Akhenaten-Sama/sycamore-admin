import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, User } from '@/lib/models'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check if test member already exists
    const existingMember = await Member.findOne({ email: 'test@example.com' })
    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: 'Test member already exists',
        member: {
          id: existingMember._id,
          name: `${existingMember.firstName} ${existingMember.lastName}`,
          email: existingMember.email
        }
      })
    }
    
    // Create a test member
    const testMember = new Member({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+1234567890',
      dateJoined: new Date(),
      isFirstTimer: false,
      isTeamLead: false,
      isAdmin: false,
      maritalStatus: 'single',
      communityIds: [],
      attendanceStreak: 5,
      totalAttendance: 12,
      totalGiving: 500,
      lastActivityDate: new Date()
    })

    const savedMember = await testMember.save()

    // Create a test user account
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const testUser = new User({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'member',
      permissions: ['read:own_profile', 'update:own_profile'],
      isActive: true,
      memberId: savedMember._id,
      lastLogin: new Date()
    })

    const savedUser = await testUser.save()

    // Link them
    savedMember.userId = savedUser._id as any
    await savedMember.save()

    return NextResponse.json({
      success: true,
      message: 'Test member created successfully',
      member: {
        id: savedMember._id,
        name: `${savedMember.firstName} ${savedMember.lastName}`,
        email: savedMember.email
      },
      user: {
        id: savedUser._id,
        email: savedUser.email
      }
    })

  } catch (error: any) {
    console.error('Error creating test member:', error)
    return NextResponse.json(
      { message: 'Failed to create test member', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Check if test member exists
    const testMember = await Member.findOne({ email: 'test@example.com' })
    
    return NextResponse.json({
      success: true,
      exists: !!testMember,
      member: testMember ? {
        id: testMember._id,
        name: `${testMember.firstName} ${testMember.lastName}`,
        email: testMember.email
      } : null,
      message: testMember ? 'Test member exists' : 'Test member not found. POST to this endpoint to create one.'
    })

  } catch (error: any) {
    console.error('Error checking test member:', error)
    return NextResponse.json(
      { message: 'Failed to check test member', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
