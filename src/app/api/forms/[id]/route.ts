import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Form } from '@/lib/models'
import { verifyToken } from '@/lib/auth'

// GET /api/forms/[id] - Get a specific form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    const form = await Form.findById(id)
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: form._id,
        title: form.title,
        description: form.description,
        fields: form.fields,
        isActive: form.isActive,
        submissions: form.submissions || [],
        submissionCount: form.submissions?.length || 0,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/forms/[id] - Update a form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const authResult = await verifyToken(request)
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, fields, isActive } = body

    const form = await Form.findByIdAndUpdate(
      id,
      {
        title,
        description,
        fields,
        isActive,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: form
    })
  } catch (error) {
    console.error('Error updating form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/forms/[id] - Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const authResult = await verifyToken(request)
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const form = await Form.findByIdAndDelete(id)
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Form deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
