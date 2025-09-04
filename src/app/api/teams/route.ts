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
      return
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
      // Update existing user to team_leader role if not already
      if (existingUser.role !== 'team_leader') {
        existingUser.role = 'team_leader'
        await existingUser.save()
        console.log(`Updated existing user ${member.email} to team_leader role`)
      }
      return { isNewUser: false, password: null }
    }

    // Create new user account with default password
    const defaultPassword = 'teamlead123' // They can change this later
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    const newUser = new User({
      email: member.email,
      password: hashedPassword,
      firstName: member.firstName,
      lastName: member.lastName,
      role: 'team_leader',
      isActive: true,
      permissions: [], // Team leaders get specific permissions via role
      mustChangePassword: true, // Force them to change password on first login
      memberId: member._id, // Link to member profile
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

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const teams = await Team.find(query)
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ name: 1 })

    return NextResponse.json({
      success: true,
      data: teams,
      total: teams.length
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.description || !body.teamLeadId) {
      return NextResponse.json(
        { success: false, error: 'Name, description, and team lead are required' },
        { status: 400 }
      )
    }

    // Ensure team leader is included in members if not already
    let members = body.members || []
    if (!members.includes(body.teamLeadId)) {
      members.push(body.teamLeadId)
    }

    const newTeam = new Team({
      name: body.name,
      description: body.description,
      teamLeadId: body.teamLeadId,
      members: members
    })

    const savedTeam = await newTeam.save()

    // If a team leader is assigned, create a user account for them and assign to team
    if (body.teamLeadId) {
      const result = await createTeamLeaderAccount(body.teamLeadId, savedTeam._id?.toString())
      if (result && result.isNewUser && result.password) {
        console.log(`🔑 NEW TEAM LEADER CREDENTIALS:`)
        console.log(`Email: ${(await Member.findById(body.teamLeadId))?.email}`)
        console.log(`Password: ${result.password}`)
      }
    }
    
    // Populate the saved team
    const populatedTeam = await Team.findById(savedTeam._id)
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedTeam,
      message: 'Team created successfully'
    })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
