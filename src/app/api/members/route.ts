import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, User } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const teamId = searchParams.get('teamId')
    const isFirstTimer = searchParams.get('isFirstTimer')

    const query: any = {}

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    if (teamId) {
      query.teamId = teamId
    }

    if (isFirstTimer === 'true') {
      query.isFirstTimer = true
    }

    const members = await Member.find(query)
      .populate('teamId', 'name')
      .sort({ createdAt: -1 })

    // Transform _id to id for frontend compatibility
    const transformedMembers = members.map(member => {
      const memberDoc = member as any // Cast to any to access MongoDB document properties
      return {
        ...memberDoc.toObject(),
        id: memberDoc._id.toString()
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedMembers,
      total: transformedMembers.length
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists in members or users
    const existingMember = await Member.findOne({ email: body.email })
    const existingUser = await User.findOne({ email: body.email })
    if (existingMember || existingUser) {
      return NextResponse.json(
        { success: false, error: 'Member with this email already exists' },
        { status: 400 }
      )
    }

    const newMember = new Member({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone || '',
      isFirstTimer: body.isFirstTimer || false,
      teamId: body.teamId || null,
      isTeamLead: body.isTeamLead || false,
      isAdmin: body.isAdmin || false,
      address: body.address,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      weddingAnniversary: body.weddingAnniversary ? new Date(body.weddingAnniversary) : undefined,
      maritalStatus: body.maritalStatus || 'single',
      emergencyContact: body.emergencyContact,
      dateJoined: new Date()
    })

    const savedMember = await newMember.save()

    // If createUserAccount is requested, create a user account with default password
    if (body.createUserAccount) {
      const bcrypt = require('bcryptjs')
      const crypto = require('crypto')
      
      // Generate a secure random password
      const tempPassword = crypto.randomBytes(8).toString('hex').substring(0, 8)
      const hashedPassword = await bcrypt.hash(tempPassword, 12)

      const newUser = new User({
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.isAdmin ? 'admin' : (body.isTeamLead ? 'team_leader' : 'member'),
        permissions: body.isAdmin ? ['*'] : (body.isTeamLead ? ['read:own_team', 'update:own_team'] : ['read:own_profile', 'update:own_profile']),
        isActive: true,
        mustChangePassword: true, // Force password change on first login
        memberId: savedMember._id
      })

      const savedUser = await newUser.save()

      // Link user to member
      savedMember.userId = savedUser._id as any
      await savedMember.save()

      // Send email with temporary password
      try {
        const { sendTempPasswordEmail } = await import('@/lib/email-service')
        await sendTempPasswordEmail(body.email, body.firstName, tempPassword)
        console.log(`✅ Temporary password email sent to: ${body.email}`)
      } catch (emailError) {
        console.error('❌ Failed to send temporary password email:', emailError)
        // Don't fail the user creation if email fails
      }

      return NextResponse.json({
        success: true,
        data: {
          member: savedMember,
          user: {
            id: savedUser._id,
            email: savedUser.email,
            mustChangePassword: true,
            // Password sent via email, not in response for security
            ...(process.env.NODE_ENV !== 'production' && { tempPassword })
          }
        },
        message: 'Member and user account created successfully. Login credentials sent via email.'
      })
    }

    return NextResponse.json({
      success: true,
      data: savedMember,
      message: 'Member created successfully'
    })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
