import { NextRequest, NextResponse } from 'next/server'
import { Member } from '@/types'

// Mock database - in a real app, this would be a database
const members: Member[] = [
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

// GET /api/members/[id] - Get single member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = members.find(m => m.id === params.id)
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: member
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch member' },
      { status: 500 }
    )
  }
}

// PUT /api/members/[id] - Update member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const memberIndex = members.findIndex(m => m.id === params.id)
    
    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it already exists
    if (body.email && body.email !== members[memberIndex].email) {
      const existingMember = members.find(m => m.email === body.email && m.id !== params.id)
      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'Member with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updatedMember: Member = {
      ...members[memberIndex],
      ...body,
      id: params.id, // Ensure ID doesn't change
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : members[memberIndex].dateOfBirth,
      weddingAnniversary: body.weddingAnniversary ? new Date(body.weddingAnniversary) : members[memberIndex].weddingAnniversary,
    }

    members[memberIndex] = updatedMember

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: 'Member updated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE /api/members/[id] - Delete member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberIndex = members.findIndex(m => m.id === params.id)
    
    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    const deletedMember = members.splice(memberIndex, 1)[0]

    return NextResponse.json({
      success: true,
      data: deletedMember,
      message: 'Member deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
