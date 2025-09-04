import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RequestForm } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const createdBy = searchParams.get('createdBy')

    const query: any = {}

    if (type) {
      query.type = type
    }

    if (isActive !== null) {
      query.isActive = isActive === 'true'
    }

    if (createdBy) {
      query.createdBy = createdBy
    }

    const forms = await RequestForm.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: forms,
      total: forms.length
    })
  } catch (error) {
    console.error('Error fetching request forms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request forms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.type || !body.title || !body.description || !body.fields || !body.createdBy) {
      return NextResponse.json(
        { success: false, error: 'Type, title, description, fields, and creator ID are required' },
        { status: 400 }
      )
    }

    // Validate fields array
    if (!Array.isArray(body.fields)) {
      return NextResponse.json(
        { success: false, error: 'Fields must be an array' },
        { status: 400 }
      )
    }

    // Validate each field has required properties
    for (let i = 0; i < body.fields.length; i++) {
      const field = body.fields[i]
      if (!field.id || !field.label || !field.type) {
        return NextResponse.json(
          { success: false, error: `Field ${i + 1} is missing required properties (id, label, type)` },
          { status: 400 }
        )
      }
      
      if (field.label.trim() === '') {
        return NextResponse.json(
          { success: false, error: `Field ${i + 1} label cannot be empty` },
          { status: 400 }
        )
      }
    }

    const newForm = new RequestForm({
      type: body.type,
      title: body.title,
      description: body.description,
      fields: body.fields,
      isActive: body.isActive !== undefined ? body.isActive : true,
      requiresApproval: body.requiresApproval !== undefined ? body.requiresApproval : true,
      createdBy: body.createdBy
    })

    const savedForm = await newForm.save()
    
    // Populate the saved form
    const populatedForm = await RequestForm.findById(savedForm._id)
      .populate('createdBy', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedForm,
      message: 'Request form created successfully'
    })
  } catch (error: any) {
    console.error('Error creating request form:', error)
    
    // Handle mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { success: false, error: `Validation failed: ${validationErrors.join(', ')}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create request form' },
      { status: 500 }
    )
  }
}
