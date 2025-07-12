import { NextRequest, NextResponse } from 'next/server'
import { Member } from '@/types'
import { dataStore } from '@/lib/data-store'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const member = dataStore.members.find(m => m.id === params.id)
    
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const memberIndex = dataStore.members.findIndex(m => m.id === params.id)
    
    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Check if email already exists (excluding current member)
    if (body.email) {
      const existingMember = dataStore.members.find(m => m.email === body.email && m.id !== params.id)
      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'Member with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updatedMember: Member = {
      ...dataStore.members[memberIndex],
      firstName: body.firstName || dataStore.members[memberIndex].firstName,
      lastName: body.lastName || dataStore.members[memberIndex].lastName,
      email: body.email || dataStore.members[memberIndex].email,
      phone: body.phone || dataStore.members[memberIndex].phone,
      isFirstTimer: body.isFirstTimer !== undefined ? body.isFirstTimer : dataStore.members[memberIndex].isFirstTimer,
      teamId: body.teamId !== undefined ? body.teamId : dataStore.members[memberIndex].teamId,
      isTeamLead: body.isTeamLead !== undefined ? body.isTeamLead : dataStore.members[memberIndex].isTeamLead,
      isAdmin: body.isAdmin !== undefined ? body.isAdmin : dataStore.members[memberIndex].isAdmin,
      address: body.address !== undefined ? body.address : dataStore.members[memberIndex].address,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : dataStore.members[memberIndex].dateOfBirth,
      weddingAnniversary: body.weddingAnniversary ? new Date(body.weddingAnniversary) : dataStore.members[memberIndex].weddingAnniversary,
      maritalStatus: body.maritalStatus || dataStore.members[memberIndex].maritalStatus,
      emergencyContact: body.emergencyContact !== undefined ? body.emergencyContact : dataStore.members[memberIndex].emergencyContact,
    }

    dataStore.members[memberIndex] = updatedMember

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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const memberIndex = dataStore.members.findIndex(m => m.id === params.id)
    
    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    dataStore.members.splice(memberIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
