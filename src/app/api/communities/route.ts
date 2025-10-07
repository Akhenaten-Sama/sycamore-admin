import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Community } from '@/lib/models'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
}

function createCorsResponse(data: any, status: number) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const leaderId = searchParams.get('leaderId')
    const isActive = searchParams.get('isActive')

    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (type) {
      query.type = type
    }

    if (leaderId) {
      query.leaderId = leaderId
    }

    if (isActive !== null) {
      query.isActive = isActive === 'true'
    }

    const communities = await Community.find(query)
      .populate('leaderId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ name: 1 })

    return NextResponse.json({
      success: true,
      data: communities,
      total: communities.length
    })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    console.log('Community creation request body:', body)
    
    // Validate required fields
    if (!body.name || !body.description || !body.type || !body.leaderId) {
      return NextResponse.json(
        { success: false, error: 'Name, description, type, and leader ID are required' },
        { status: 400 }
      )
    }

    console.log('leaderId received:', body.leaderId, 'type:', typeof body.leaderId)

    const newCommunity = new Community({
      name: body.name,
      description: body.description,
      type: body.type,
      leaderId: body.leaderId,
      members: body.members || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      isPrivate: body.isPrivate !== undefined ? body.isPrivate : false,
      inviteOnly: body.inviteOnly !== undefined ? body.inviteOnly : false,
      meetingSchedule: body.meetingSchedule,
      joinRequests: [],
      invitedMembers: []
    })

    const savedCommunity = await newCommunity.save()
    
    // Populate the saved community
    const populatedCommunity = await Community.findById(savedCommunity._id)
      .populate('leaderId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedCommunity,
      message: 'Community created successfully'
    })
  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create community' },
      { status: 500 }
    )
  }
}
