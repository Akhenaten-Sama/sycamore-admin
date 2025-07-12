import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'
import { dataStore } from '@/lib/data-store'

// Try to use MongoDB, fall back to in-memory if connection fails
let useInMemory = false

async function tryConnectDB() {
  try {
    await connectDB()
    return true
  } catch (error) {
    console.log('📝 Using in-memory storage (MongoDB not available)')
    useInMemory = true
    return false
  }
}

export async function GET(request: NextRequest) {
  const isConnected = await tryConnectDB()
  
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const teamId = searchParams.get('teamId')
    const isFirstTimer = searchParams.get('isFirstTimer')

    if (isConnected && !useInMemory) {
      // Use MongoDB
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

      return NextResponse.json({
        success: true,
        data: members,
        total: members.length,
        source: 'mongodb'
      })
    } else {
      // Use in-memory storage
      let filteredMembers = dataStore.members

      if (search) {
        filteredMembers = filteredMembers.filter(member =>
          `${member.firstName} ${member.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          member.email.toLowerCase().includes(search.toLowerCase())
        )
      }

      if (teamId) {
        filteredMembers = filteredMembers.filter(member => member.teamId === teamId)
      }

      if (isFirstTimer === 'true') {
        filteredMembers = filteredMembers.filter(member => member.isFirstTimer)
      }

      return NextResponse.json({
        success: true,
        data: filteredMembers,
        total: filteredMembers.length,
        source: 'memory'
      })
    }
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const isConnected = await tryConnectDB()
  
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    if (isConnected && !useInMemory) {
      // Use MongoDB
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
        message: 'Member created successfully',
        source: 'mongodb'
      })
    } else {
      // Use in-memory storage
      const existingMember = dataStore.members.find(m => m.email === body.email)
      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'Member with this email already exists' },
          { status: 400 }
        )
      }

      const newMember = {
        id: Date.now().toString(),
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || '',
        dateJoined: new Date(),
        isFirstTimer: body.isFirstTimer || false,
        teamId: body.teamId,
        isTeamLead: body.isTeamLead || false,
        isAdmin: body.isAdmin || false,
        address: body.address,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        weddingAnniversary: body.weddingAnniversary ? new Date(body.weddingAnniversary) : undefined,
        maritalStatus: body.maritalStatus || 'single',
        emergencyContact: body.emergencyContact,
      }

      dataStore.members.push(newMember)

      return NextResponse.json({
        success: true,
        data: newMember,
        message: 'Member created successfully',
        source: 'memory'
      })
    }
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
