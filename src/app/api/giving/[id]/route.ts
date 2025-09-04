import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Giving } from '@/lib/models'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const giving = await Giving.findById(id)
      .populate('memberId', 'firstName lastName email')
    
    if (!giving) {
      return NextResponse.json(
        { success: false, error: 'Giving record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: giving
    })
  } catch (error) {
    console.error('Error fetching giving record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch giving record' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    
    const giving = await Giving.findById(id)
    if (!giving) {
      return NextResponse.json(
        { success: false, error: 'Giving record not found' },
        { status: 404 }
      )
    }

    // Update giving record fields
    if (body.amount) giving.amount = body.amount
    if (body.currency) giving.currency = body.currency
    if (body.method) giving.method = body.method
    if (body.category) giving.category = body.category
    if (body.description !== undefined) giving.description = body.description
    if (body.date) giving.date = new Date(body.date)
    if (body.isRecurring !== undefined) giving.isRecurring = body.isRecurring
    if (body.recurringFrequency !== undefined) giving.recurringFrequency = body.recurringFrequency

    const updatedGiving = await giving.save()
    
    // Populate the updated giving record
    const populatedGiving = await Giving.findById(updatedGiving._id)
      .populate('memberId', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedGiving,
      message: 'Giving record updated successfully'
    })
  } catch (error) {
    console.error('Error updating giving record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update giving record' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const giving = await Giving.findByIdAndDelete(id)
    
    if (!giving) {
      return NextResponse.json(
        { success: false, error: 'Giving record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Giving record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting giving record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete giving record' },
      { status: 500 }
    )
  }
}
