import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Community, Member } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

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

// POST to invite members or manage join requests
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { user, member } = await verifyMobileToken(request)
    const { id } = await params
    
    if (!member) {
      return corsResponse(
        { message: 'Member profile not found' },
        request,
        404
      )
    }

    const memberData = member as any
    const communityId = id
    const { action, memberId, memberIds } = await request.json()
    
    if (!communityId || !action) {
      return corsResponse(
        { message: 'Community ID and action are required' },
        request,
        400
      )
    }

    // Find the community
    const community = await Community.findById(communityId)
      .populate('joinRequests', 'firstName lastName avatar email')
      .populate('invitedMembers', 'firstName lastName avatar email')
      .populate('members', 'firstName lastName avatar email')
    
    if (!community) {
      return corsResponse(
        { message: 'Community not found' },
        request,
        404
      )
    }

    // Check if user is the community leader
    const isLeader = community.leaderId.toString() === memberData._id.toString()
    if (!isLeader) {
      return corsResponse(
        { message: 'Only community leaders can manage invitations' },
        request,
        403
      )
    }

    switch (action) {
      case 'invite-member':
        if (!memberId && !memberIds) {
          return corsResponse(
            { message: 'Member ID or member IDs are required' },
            request,
            400
          )
        }

        const idsToInvite = memberIds || [memberId]
        const validMembers = []
        const errors = []

        for (const id of idsToInvite) {
          // Check if member exists
          const targetMember = await Member.findById(id)
          if (!targetMember) {
            errors.push(`Member ${id} not found`)
            continue
          }

          // Check if already a member
          if (community.members.some((m: any) => m._id.toString() === id)) {
            errors.push(`${targetMember.firstName} ${targetMember.lastName} is already a member`)
            continue
          }

          // Check if already invited
          if (community.invitedMembers?.some((m: any) => m._id.toString() === id)) {
            errors.push(`${targetMember.firstName} ${targetMember.lastName} is already invited`)
            continue
          }

          validMembers.push(id)
        }

        if (validMembers.length > 0) {
          community.invitedMembers = community.invitedMembers || []
          community.invitedMembers.push(...validMembers)
          await community.save()
        }

        return corsResponse({
          success: true,
          message: `${validMembers.length} member(s) invited successfully`,
          data: {
            invited: validMembers.length,
            errors: errors.length > 0 ? errors : undefined
          }
        }, request, 200)

      case 'approve-request':
        if (!memberId) {
          return corsResponse(
            { message: 'Member ID is required' },
            request,
            400
          )
        }

        // Check if member has a pending request
        const hasRequest = community.joinRequests?.some((m: any) => m._id.toString() === memberId)
        if (!hasRequest) {
          return corsResponse(
            { message: 'No pending join request from this member' },
            request,
            400
          )
        }

        // Add to members and remove from join requests
        community.members.push(memberId)
        community.joinRequests = community.joinRequests?.filter((m: any) => m._id.toString() !== memberId) || []
        await community.save()

        // Update member's community list
        await Member.findByIdAndUpdate(memberId, {
          $addToSet: { communityIds: communityId }
        })

        const approvedMember = await Member.findById(memberId)
        return corsResponse({
          success: true,
          message: `${approvedMember?.firstName} ${approvedMember?.lastName} has been approved to join ${community.name}`,
          data: {
            communityId: community._id,
            memberId,
            memberCount: community.members.length
          }
        }, request, 200)

      case 'reject-request':
        if (!memberId) {
          return corsResponse(
            { message: 'Member ID is required' },
            request,
            400
          )
        }

        // Remove from join requests
        const hadRequest = community.joinRequests?.some((m: any) => m._id.toString() === memberId)
        if (!hadRequest) {
          return corsResponse(
            { message: 'No pending join request from this member' },
            request,
            400
          )
        }

        community.joinRequests = community.joinRequests?.filter((m: any) => m._id.toString() !== memberId) || []
        await community.save()

        const rejectedMember = await Member.findById(memberId)
        return corsResponse({
          success: true,
          message: `Join request from ${rejectedMember?.firstName} ${rejectedMember?.lastName} has been rejected`,
          data: {
            communityId: community._id,
            memberId
          }
        }, request, 200)

      case 'remove-invitation':
        if (!memberId) {
          return corsResponse(
            { message: 'Member ID is required' },
            request,
            400
          )
        }

        // Remove from invited members
        const wasInvited = community.invitedMembers?.some((m: any) => m._id.toString() === memberId)
        if (!wasInvited) {
          return corsResponse(
            { message: 'Member was not invited' },
            request,
            400
          )
        }

        community.invitedMembers = community.invitedMembers?.filter((m: any) => m._id.toString() !== memberId) || []
        await community.save()

        return corsResponse({
          success: true,
          message: 'Invitation removed successfully',
          data: {
            communityId: community._id,
            memberId
          }
        }, request, 200)

      default:
        return corsResponse(
          { message: 'Invalid action' },
          request,
          400
        )
    }

  } catch (error) {
    console.error('Community management error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return corsResponse(
        { message: error.message },
        request,
        401
      )
    }
    
    return corsResponse(
      { message: 'Failed to manage community' },
      request,
      500
    )
  }
}

// GET community management data (join requests, invitations, etc.)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { user, member } = await verifyMobileToken(request)
    const { id } = await params
    
    if (!member) {
      return corsResponse(
        { message: 'Member profile not found' },
        request,
        404
      )
    }

    const memberData = member as any
    const communityId = id
    
    // Find the community
    const community = await Community.findById(communityId)
      .populate('joinRequests', 'firstName lastName avatar email')
      .populate('invitedMembers', 'firstName lastName avatar email')
      .populate('members', 'firstName lastName avatar email')
    
    if (!community) {
      return corsResponse(
        { message: 'Community not found' },
        request,
        404
      )
    }

    // Check if user is the community leader
    const isLeader = community.leaderId.toString() === memberData._id.toString()
    if (!isLeader) {
      return corsResponse(
        { message: 'Only community leaders can view management data' },
        request,
        403
      )
    }

    return corsResponse({
      success: true,
      data: {
        community: {
          id: community._id,
          name: community.name,
          isPrivate: community.isPrivate,
          inviteOnly: community.inviteOnly
        },
        joinRequests: community.joinRequests?.map((member: any) => ({
          id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          avatar: member.avatar,
          email: member.email
        })) || [],
        invitedMembers: community.invitedMembers?.map((member: any) => ({
          id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          avatar: member.avatar,
          email: member.email
        })) || [],
        currentMembers: community.members?.map((member: any) => ({
          id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          avatar: member.avatar,
          email: member.email
        })) || []
      }
    }, request, 200)

  } catch (error) {
    console.error('Community management data error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return corsResponse(
        { message: error.message },
        request,
        401
      )
    }
    
    return corsResponse(
      { message: 'Failed to fetch community management data' },
      request,
      500
    )
  }
}