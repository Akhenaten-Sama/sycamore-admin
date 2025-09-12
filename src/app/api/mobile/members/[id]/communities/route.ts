import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member, Community } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: memberId } = await params

    // Get member data
    const member = await Member.findById(memberId).populate('communityIds')
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Get member's communities
    const memberCommunities = member.communityIds || []

    // Get all available communities for joining
    const allCommunities = await Community.find({ isActive: true })

    // Format response
    const memberCommunitiesData = memberCommunities.map((community: any) => ({
      id: community._id,
      name: community.name,
      description: community.description,
      category: (community as any).category,
      memberCount: (community as any).memberCount || 0,
      isJoined: true,
      image: (community as any).image || '/api/placeholder/200/150',
      joinedAt: member.dateJoined, // You might want to track this separately
    }))

    const availableCommunities = allCommunities
      .filter((community: any) => !memberCommunities.some((mc: any) => mc._id.toString() === community._id.toString()))
      .map((community: any) => ({
        id: community._id,
        name: community.name,
        description: community.description,
        category: community.category,
        memberCount: community.memberCount || 0,
        isJoined: false,
        image: community.image || '/api/placeholder/200/150',
      }))

    return NextResponse.json({
      memberCommunities: memberCommunitiesData,
      availableCommunities: availableCommunities,
      totalJoined: memberCommunitiesData.length,
    })

  } catch (error) {
    console.error('Error fetching member communities:', error)
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: memberId } = await params
    const { communityId } = await request.json()

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID required' }, { status: 400 })
    }

    // Get member and community
    const member = await Member.findById(memberId)
    const community = await Community.findById(communityId)

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Check if already joined
    const alreadyJoined = member.communityIds?.includes(communityId)
    if (alreadyJoined) {
      return NextResponse.json({ error: 'Already joined this community' }, { status: 400 })
    }

    // Add member to community
    member.communityIds = member.communityIds || []
    member.communityIds.push(communityId)
    await member.save()

    // Update community member count
    ;(community as any).memberCount = ((community as any).memberCount || 0) + 1
    await community.save()

    return NextResponse.json({ 
      message: 'Successfully joined community',
      community: {
        id: community._id,
        name: community.name,
        description: community.description,
        category: (community as any).category,
        memberCount: (community as any).memberCount,
        isJoined: true,
      }
    })

  } catch (error) {
    console.error('Error joining community:', error)
    return NextResponse.json({ error: 'Failed to join community' }, { status: 500 })
  }
}
