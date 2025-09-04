import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Team, Member, User } from '@/lib/models'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

// Helper function to create a user account for a team leader
async function createTeamLeaderAccount(memberId: string, teamId?: string) {
  try {
    // Get the member details
    const member = await Member.findById(memberId)
    if (!member) {
      console.error('Member not found:', memberId)
      return { isNewUser: false, password: null }
    }

    // Update member's teamId if provided
    if (teamId) {
      member.teamId = new mongoose.Types.ObjectId(teamId)
      await member.save()
      console.log(`Updated member ${member.email} teamId to ${teamId}`)
    }

    // Check if user account already exists
    const existingUser = await User.findOne({ email: member.email })
    if (existingUser) {
      // For existing users (including admins), don't change their password
      // Just update their role to team_leader if not already
      if (existingUser.role !== 'team_leader') {
        // If they're an admin, keep them as admin but note they're also a team leader
        if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
          console.log(`Admin ${member.email} is now also a team leader (keeping admin role)`)
          return { isNewUser: false, password: null }
        } else {
          existingUser.role = 'team_leader'
          await existingUser.save()
          console.log(`Updated existing user ${member.email} to team_leader role`)
        }
      }
      return { isNewUser: false, password: null }
    }

    // Create new user account with default password (only for new users)
    const defaultPassword = 'teamlead123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    const newUser = new User({
      email: member.email,
      password: hashedPassword,
      firstName: member.firstName,
      lastName: member.lastName,
      role: 'team_leader',
      isActive: true,
      permissions: [],
      mustChangePassword: true,
      memberId: member._id,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await newUser.save()
    console.log(`Created new team leader account for: ${member.email} with default password: ${defaultPassword}`)
    
    return { isNewUser: true, password: defaultPassword }
    
  } catch (error) {
    console.error('Error creating team leader account:', error)
    return { isNewUser: false, password: null }
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const team = await Team.findById(id)
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: team
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id } = await params

    // Check if team leader is being changed
    const currentTeam = await Team.findById(id)
    const teamLeaderChanged = body.teamLeadId && 
      currentTeam?.teamLeadId?.toString() !== body.teamLeadId

    // Ensure team leader is included in members if not already
    if (body.teamLeadId && body.members && !body.members.includes(body.teamLeadId)) {
      body.members.push(body.teamLeadId)
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')

    if (!updatedTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    // If team leader was changed, create user account for new team leader
    if (teamLeaderChanged) {
      const result = await createTeamLeaderAccount(body.teamLeadId, id)
      if (result && result.isNewUser && result.password) {
        console.log(`🔑 NEW TEAM LEADER CREDENTIALS:`)
        console.log(`Email: ${(await Member.findById(body.teamLeadId))?.email}`)
        console.log(`Password: ${result.password}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully'
    })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const deletedTeam = await Team.findByIdAndDelete(id)
    
    if (!deletedTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}
