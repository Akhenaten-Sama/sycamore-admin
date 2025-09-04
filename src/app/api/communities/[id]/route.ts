import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Community } from '@/lib/models'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const community = await Community.findById(id)
      .populate('leaderId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
    
    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: community
    })
  } catch (error) {
    console.error('Error fetching community:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch community' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    
    const community = await Community.findById(id)
    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    // Update community fields
    if (body.name) community.name = body.name
    if (body.description) community.description = body.description
    if (body.type) community.type = body.type
    if (body.leaderId) community.leaderId = body.leaderId
    if (body.members) community.members = body.members
    if (body.isActive !== undefined) community.isActive = body.isActive
    if (body.meetingSchedule !== undefined) community.meetingSchedule = body.meetingSchedule

    const updatedCommunity = await community.save()
    
    // Populate the updated community
    const populatedCommunity = await Community.findById(updatedCommunity._id)
      .populate('leaderId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedCommunity,
      message: 'Community updated successfully'
    })
  } catch (error) {
    console.error('Error updating community:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update community' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const community = await Community.findByIdAndDelete(id)
    
    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Community deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting community:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete community' },
      { status: 500 }
    )
  }
}
