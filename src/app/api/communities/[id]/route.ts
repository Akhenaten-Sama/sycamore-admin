import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Community, Member } from '@/lib/models'

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
    console.log('Community PUT request - ID:', id)
    
    // Validate the ID
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid community ID provided' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    console.log('Community PUT request - Body:', body)
    
    const community = await Community.findById(id)
    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    // Track old members to detect changes
    const oldMembers = community.members.map((m: any) => m.toString())
    const newMembers = body.members || oldMembers

    // Update community fields
    if (body.name) community.name = body.name
    if (body.description) community.description = body.description
    if (body.type) community.type = body.type
    if (body.leaderId) community.leaderId = body.leaderId
    if (body.members) community.members = body.members
    if (body.isActive !== undefined) community.isActive = body.isActive
    if (body.isPrivate !== undefined) community.isPrivate = body.isPrivate
    if (body.inviteOnly !== undefined) community.inviteOnly = body.inviteOnly
    if (body.meetingSchedule !== undefined) community.meetingSchedule = body.meetingSchedule

    const updatedCommunity = await community.save()
    
    // Sync member's communityIds if members array changed
    if (body.members) {
      const communityId = updatedCommunity._id.toString()
      
      // Find members to add (in new but not in old)
      const membersToAdd = newMembers.filter((m: string) => !oldMembers.includes(m))
      
      // Find members to remove (in old but not in new)
      const membersToRemove = oldMembers.filter((m: string) => !newMembers.includes(m))
      
      // Add community to new members' communityIds
      if (membersToAdd.length > 0) {
        await Member.updateMany(
          { _id: { $in: membersToAdd } },
          { $addToSet: { communityIds: communityId } }
        )
        console.log(`Added community ${communityId} to ${membersToAdd.length} members`)
      }
      
      // Remove community from removed members' communityIds
      if (membersToRemove.length > 0) {
        await Member.updateMany(
          { _id: { $in: membersToRemove } },
          { $pull: { communityIds: communityId } }
        )
        console.log(`Removed community ${communityId} from ${membersToRemove.length} members`)
      }
    }
    
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
