import { NextRequest, NextResponse } from 'next/server'
import { Member } from '@/types'
import { dataStore } from '@/lib/data-store'

// Mock database - in a real app, this would be a database
let members: Member[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    dateJoined: new Date('2023-01-15'),
    isFirstTimer: false,
    teamId: '1',
    isTeamLead: false,
    isAdmin: false,
    dateOfBirth: new Date('1990-05-15'),
    address: '123 Main St, City',
    maritalStatus: 'single',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    dateJoined: new Date('2022-11-20'),
    isFirstTimer: false,
    teamId: '1',
    isTeamLead: true,
    isAdmin: false,
    dateOfBirth: new Date('1985-08-22'),
    weddingAnniversary: new Date('2015-06-10'),
    maritalStatus: 'married',
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    phone: '+1234567892',
    dateJoined: new Date('2024-01-01'),
    isFirstTimer: true,
    isTeamLead: false,
    isAdmin: false,
    dateOfBirth: new Date('1992-12-03'),
    maritalStatus: 'divorced',
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1234567893',
    dateJoined: new Date('2021-09-10'),
    isFirstTimer: false,
    teamId: '2',
    isTeamLead: false,
    isAdmin: true,
    dateOfBirth: new Date('1988-03-17'),
    maritalStatus: 'single',
  },
]

// GET /api/members - Get all members
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

// POST /api/members - Create new member
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
