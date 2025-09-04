import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Community, Member } from '@/lib/models'

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
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all' // 'all', 'joined', 'available'
    
    let query: any = { isActive: true }
    
    if (type === 'joined') {
      query.members = memberData._id
    } else if (type === 'available') {
      query.members = { $ne: memberData._id }
    }
    
    // Get communities
    const communities = await Community.find(query)
      .populate('leaderId', 'firstName lastName avatar')
      .populate('members', 'firstName lastName avatar')
      .sort({ name: 1 })
    
    // Transform for mobile response
    const mobileCommunities = communities.map(community => ({
      id: community._id,
      name: community.name,
      description: community.description,
      type: community.type,
      leader: {
        id: (community as any).leaderId._id,
        name: `${(community as any).leaderId.firstName} ${(community as any).leaderId.lastName}`,
        avatar: (community as any).leaderId.avatar
      },
      memberCount: community.members.length,
      isJoined: community.members.some((m: any) => m._id.toString() === memberData._id.toString()),
      isLeader: (community as any).leaderId._id.toString() === memberData._id.toString(),
      meetingSchedule: community.meetingSchedule,
      recentMembers: community.members.slice(0, 3).map((member: any) => ({
        id: member._id,
        name: `${member.firstName} ${member.lastName}`,
        avatar: member.avatar
      }))
    }))

    return NextResponse.json({
      success: true,
      data: mobileCommunities
    })

  } catch (error) {
    console.error('Mobile communities error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}

// POST to join/leave a community
export async function POST(request: NextRequest) {
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
    const { communityId, action } = await request.json()
    
    if (!communityId || !action) {
      return NextResponse.json(
        { message: 'Community ID and action are required' },
        { status: 400 }
      )
    }

    if (!['join', 'leave'].includes(action)) {
      return NextResponse.json(
        { message: 'Action must be either "join" or "leave"' },
        { status: 400 }
      )
    }
    
    // Find the community
    const community = await Community.findById(communityId)
    if (!community) {
      return NextResponse.json(
        { message: 'Community not found' },
        { status: 404 }
      )
    }

    if (!community.isActive) {
      return NextResponse.json(
        { message: 'Community is not active' },
        { status: 400 }
      )
    }
    
    const memberIdStr = memberData._id.toString()
    const isMember = community.members.some((m: any) => m.toString() === memberIdStr)
    
    if (action === 'join') {
      if (isMember) {
        return NextResponse.json(
          { message: 'Already a member of this community' },
          { status: 400 }
        )
      }
      
      // Add member to community
      community.members.push(memberData._id)
      await community.save()
      
      // Update member's community list
      await Member.findByIdAndUpdate(memberData._id, {
        $addToSet: { communityIds: communityId }
      })
      
      return NextResponse.json({
        success: true,
        message: `Successfully joined ${community.name}`,
        data: {
          communityId: community._id,
          communityName: community.name,
          memberCount: community.members.length
        }
      })
      
    } else if (action === 'leave') {
      if (!isMember) {
        return NextResponse.json(
          { message: 'Not a member of this community' },
          { status: 400 }
        )
      }
      
      // Check if user is the leader
      if (community.leaderId.toString() === memberIdStr) {
        return NextResponse.json(
          { message: 'Community leaders cannot leave. Please transfer leadership first.' },
          { status: 400 }
        )
      }
      
      // Remove member from community
      community.members = community.members.filter((m: any) => m.toString() !== memberIdStr)
      await community.save()
      
      // Update member's community list
      await Member.findByIdAndUpdate(memberData._id, {
        $pull: { communityIds: communityId }
      })
      
      return NextResponse.json({
        success: true,
        message: `Successfully left ${community.name}`,
        data: {
          communityId: community._id,
          communityName: community.name,
          memberCount: community.members.length
        }
      })
    }

  } catch (error) {
    console.error('Mobile community action error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Failed to perform community action' },
      { status: 500 }
    )
  }
}
