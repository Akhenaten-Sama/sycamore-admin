import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Team } from '@/lib/models'

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
