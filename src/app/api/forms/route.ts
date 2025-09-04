import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Form, IForm } from '@/lib/models'
import { verifyToken } from '@/lib/auth'

// GET /api/forms - List all forms
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const authResult = await verifyToken(request)
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forms = await Form.find({}).sort({ createdAt: -1 })

    // Calculate submission count for each form
    const formsWithStats = forms.map((form: IForm) => ({
      id: form._id,
      title: form.title,
      description: form.description,
      fields: form.fields,
      isActive: form.isActive,
      submissionCount: form.submissions?.length || 0,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: formsWithStats
    })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/forms - Create new form
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const authResult = await verifyToken(request)
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, fields = [] } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const form = new Form({
      title,
      description,
      fields,
      isActive: true,
      submissions: [],
      createdBy: authResult.user.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await form.save()

    return NextResponse.json({
      success: true,
      data: {
        id: form._id,
        title: form.title,
        description: form.description,
        fields: form.fields,
        isActive: form.isActive,
        submissionCount: 0,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
