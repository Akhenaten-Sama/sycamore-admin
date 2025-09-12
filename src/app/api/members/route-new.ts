import { NextRequest, NextResponse } from 'next/server'
import { Member } from '@/types'
import { dataStore } from '@/lib/data-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const teamId = searchParams.get('teamId')
    const isFirstTimer = searchParams.get('isFirstTimer')

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
      total: filteredMembers.length
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingMember = dataStore.members.find(m => m.email === body.email)
    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member with this email already exists' },
        { status: 400 }
      )
    }

    const newMember: Member = {
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
      // Add missing required properties
      communityIds: body.communityIds || [],
      attendanceStreak: 0,
      totalAttendance: 0,
      totalGiving: 0,
    }

    dataStore.members.push(newMember)

    return NextResponse.json({
      success: true,
      data: newMember,
      message: 'Member created successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
