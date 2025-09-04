import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Team, Member } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyMobileToken(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user')
    }
    
    return { user, member: user.memberId }
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, member } = await verifyMobileToken(request)
    
    if (!member) {
      return NextResponse.json(
        { message: 'Member profile not found' },
        { status: 404 }
      )
    }

    const memberData = member as any
    
    // Get teams where user is a member or leader
    const teams = await Team.find({
      $or: [
        { members: memberData._id },
        { teamLeadId: memberData._id }
      ]
    })
    .populate('teamLeadId', 'firstName lastName avatar')
    .populate('members', 'firstName lastName avatar')

    // Transform teams for mobile response
    const mobileTeams = teams.map(team => ({
      id: team._id,
      name: team.name,
      description: team.description,
      leader: {
        id: (team as any).teamLeadId._id,
        name: `${(team as any).teamLeadId.firstName} ${(team as any).teamLeadId.lastName}`,
        avatar: (team as any).teamLeadId.avatar
      },
      memberCount: team.members.length,
      isLeader: (team as any).teamLeadId._id.toString() === memberData._id.toString(),
      members: team.members.slice(0, 5).map((member: any) => ({
        id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        avatar: member.avatar
      }))
    }))

    return NextResponse.json({
      success: true,
      data: mobileTeams
    })

  } catch (error) {
    console.error('Mobile teams error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}
