import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Anniversary } from '@/lib/models'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const anniversary = await Anniversary.findById(id)
      .populate('memberId', 'firstName lastName email')
    
    if (!anniversary) {
      return NextResponse.json(
        { success: false, error: 'Anniversary not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: anniversary
    })
  } catch (error) {
    console.error('Error fetching anniversary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch anniversary' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id } = await params
    
    const updateData = {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    }

    const updatedAnniversary = await Anniversary.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('memberId', 'firstName lastName email')

    if (!updatedAnniversary) {
      return NextResponse.json(
        { success: false, error: 'Anniversary not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedAnniversary,
      message: 'Anniversary updated successfully'
    })
  } catch (error) {
    console.error('Error updating anniversary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update anniversary' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const deletedAnniversary = await Anniversary.findByIdAndDelete(id)
    
    if (!deletedAnniversary) {
      return NextResponse.json(
        { success: false, error: 'Anniversary not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Anniversary deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting anniversary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete anniversary' },
      { status: 500 }
    )
  }
}
