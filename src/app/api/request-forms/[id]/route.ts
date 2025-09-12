import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RequestForm } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    const form = await RequestForm.findById(id)
      .populate('createdBy', 'firstName lastName email')
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: form
    })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch form' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id } = await params
    
    const updatedForm = await RequestForm.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
    
    if (!updatedForm) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedForm,
      message: 'Form updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating form:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { success: false, error: `Validation failed: ${validationErrors.join(', ')}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update form' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    const deletedForm = await RequestForm.findByIdAndDelete(id)
    
    if (!deletedForm) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Form deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete form' },
      { status: 500 }
    )
  }
}
