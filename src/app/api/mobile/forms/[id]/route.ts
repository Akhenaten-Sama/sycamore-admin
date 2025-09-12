import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Form } from '@/lib/models'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
}

function createCorsResponse(data: any, status: number) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

// POST /api/mobile/forms/[id] - Submit a form from mobile app
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    const form = await Form.findById(id)
    if (!form) {
      return createCorsResponse({ 
        success: false, 
        error: 'Form not found' 
      }, 404)
    }

    if (!form.isActive) {
      return createCorsResponse({ 
        success: false, 
        error: 'Form is not currently accepting submissions' 
      }, 400)
    }

    const body = await request.json()
    const { responses, submitterName, submitterEmail } = body

    // Validate that all required fields are filled
    const requiredFields = form.fields.filter(field => field.required)
    for (const field of requiredFields) {
      if (!responses[field.id] || (typeof responses[field.id] === 'string' && responses[field.id].trim() === '')) {
        return createCorsResponse({ 
          success: false,
          error: `Field "${field.label}" is required` 
        }, 400)
      }
    }

    // Create submission object
    const submission = {
      id: new Date().getTime().toString(),
      data: responses,
      submittedAt: new Date(),
      submitterName: submitterName || 'Anonymous',
      submitterEmail: submitterEmail || ''
    }

    // Add submission to form
    form.submissions = form.submissions || []
    form.submissions.push(submission)
    await form.save()

    return createCorsResponse({
      success: true,
      message: 'Form submitted successfully',
      submissionId: submission.id
    }, 200)

  } catch (error) {
    console.error('Error submitting form:', error)
    return createCorsResponse({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
}
