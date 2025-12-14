import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Testimony } from '@/lib/models'

// GET /api/testimonies/[id] - Get a single testimony
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const testimony = await Testimony.findById(id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')

    if (!testimony) {
      return NextResponse.json(
        { success: false, error: 'Testimony not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: testimony
    })
  } catch (error) {
    console.error('Error fetching testimony:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimony' },
      { status: 500 }
    )
  }
}

// PUT /api/testimonies/[id] - Update testimony (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const body = await request.json()
    
    const updateData: any = {}
    
    if (body.isApproved !== undefined) {
      updateData.isApproved = body.isApproved
      if (body.isApproved) {
        updateData.approvedAt = new Date()
        updateData.approvedBy = body.approvedBy
      }
    }
    
    if (body.rejectionReason !== undefined) {
      updateData.rejectionReason = body.rejectionReason
    }
    
    if (body.isPublic !== undefined) {
      updateData.isPublic = body.isPublic
    }

    const updatedTestimony = await Testimony.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('submittedBy', 'firstName lastName email')
     .populate('approvedBy', 'firstName lastName email')

    if (!updatedTestimony) {
      return NextResponse.json(
        { success: false, error: 'Testimony not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Testimony updated successfully',
      data: updatedTestimony
    })
  } catch (error) {
    console.error('Error updating testimony:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update testimony' },
      { status: 500 }
    )
  }
}

// DELETE /api/testimonies/[id] - Delete a testimony
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const deletedTestimony = await Testimony.findByIdAndDelete(id)

    if (!deletedTestimony) {
      return NextResponse.json(
        { success: false, error: 'Testimony not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Testimony deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting testimony:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete testimony' },
      { status: 500 }
    )
  }
}
