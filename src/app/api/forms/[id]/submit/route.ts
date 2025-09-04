import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Form } from '@/lib/models'

// POST /api/forms/[id]/submit - Submit a response to a form
export async function POST(
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

    if (!form.isActive) {
      return NextResponse.json({ error: 'Form is not active' }, { status: 400 })
    }

    const body = await request.json()
    const { responses, submitterName, submitterEmail } = body

    // Validate that all required fields are filled
    const requiredFields = form.fields.filter(field => field.required)
    for (const field of requiredFields) {
      if (!responses[field.id] || (typeof responses[field.id] === 'string' && responses[field.id].trim() === '')) {
        return NextResponse.json({ 
          error: `Field "${field.label}" is required` 
        }, { status: 400 })
      }
    }

    // Create submission object
    const submission = {
      id: new Date().getTime().toString(), // Generate a unique ID
      data: responses,
      submittedAt: new Date(),
      submitterName,
      submitterEmail
    }

    // Add submission to form
    form.submissions = form.submissions || []
    form.submissions.push(submission)
    await form.save()

    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully'
    })
  } catch (error) {
    console.error('Error submitting form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
