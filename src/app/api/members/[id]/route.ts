import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const member = await Member.findById(id).populate('teamId', 'name')
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: member
    })
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch member' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id } = await params
    
    // Check if email already exists (excluding current member)
    if (body.email) {
      const existingMember = await Member.findOne({ 
        email: body.email, 
        _id: { $ne: id } 
      })
      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'Member with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...body,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      weddingAnniversary: body.weddingAnniversary ? new Date(body.weddingAnniversary) : undefined,
    }

    const updatedMember = await Member.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('teamId', 'name')

    if (!updatedMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: 'Member updated successfully'
    })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const deletedMember = await Member.findByIdAndDelete(id)
    
    if (!deletedMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
