import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Team, Member } from '@/lib/models'
import mongoose from 'mongoose'

// Add member to team
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id: teamId } = await params
    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Validate team exists
    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    // Validate member exists
    const member = await Member.findById(memberId)
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Check if member is already in the team
    if (team.members.includes(new mongoose.Types.ObjectId(memberId))) {
      return NextResponse.json(
        { success: false, error: 'Member is already in this team' },
        { status: 400 }
      )
    }

    // Add member to team
    team.members.push(new mongoose.Types.ObjectId(memberId))
    await team.save()

    // Update member's teamId
    member.teamId = new mongoose.Types.ObjectId(teamId)
    await member.save()

    // Return updated team with populated members
    const updatedTeam = await Team.findById(teamId)
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: 'Member added to team successfully'
    })
  } catch (error) {
    console.error('Error adding member to team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add member to team' },
      { status: 500 }
    )
  }
}

// Remove member from team
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id: teamId } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Validate team exists
    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check if member is in the team
    const memberObjectId = new mongoose.Types.ObjectId(memberId)
    if (!team.members.some(id => id.equals(memberObjectId))) {
      return NextResponse.json(
        { success: false, error: 'Member is not in this team' },
        { status: 400 }
      )
    }

    // Remove member from team
    team.members = team.members.filter(id => !id.equals(memberObjectId))
    await team.save()

    // Clear member's teamId
    await Member.findByIdAndUpdate(memberId, { $unset: { teamId: '' } })

    // Return updated team with populated members
    const updatedTeam = await Team.findById(teamId)
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: 'Member removed from team successfully'
    })
  } catch (error) {
    console.error('Error removing member from team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove member from team' },
      { status: 500 }
    )
  }
}
