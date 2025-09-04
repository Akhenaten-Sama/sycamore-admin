import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Team, Member } from '@/lib/models'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = authResult.user
    console.log('🔍 Looking for team for user:', user.email, 'role:', user.role)

    // Only team leaders can access this endpoint
    if (user.role !== 'team_leader') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only team leaders can access this endpoint.' },
        { status: 403 }
      )
    }

    // First, find the member record by email
    const member = await Member.findOne({ email: user.email })
    if (!member) {
      console.log('❌ No member found with email:', user.email)
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No member record found'
      })
    }

    console.log('👤 Found member:', member.firstName, member.lastName, 'ID:', member._id)

    // Find the team where this member is the team leader
    const team = await Team.findOne({ teamLeadId: member._id })
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email role')

    console.log('🔍 Team query result:', team ? `Found team: ${team.name}` : 'No team found')

    if (!team) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No team assigned'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: team._id,
        name: team.name,
        description: team.description,
        members: team.members.map((member: any) => ({
          id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          role: member.role
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching team leader\'s team:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
