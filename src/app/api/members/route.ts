import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

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

    // Check if email already exists
    const existingMember = await Member.findOne({ email: body.email })
    if (existingMember) {
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
      emergencyContact: body.emergencyContact
    })

    const savedMember = await newMember.save()

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
