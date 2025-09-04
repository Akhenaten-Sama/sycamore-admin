import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RequestSubmission } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const submitterId = searchParams.get('submitterId')
    const status = searchParams.get('status')

    const query: any = {}

    if (formId) {
      query.formId = formId
    }

    if (submitterId) {
      query.submitterId = submitterId
    }

    if (status) {
      query.status = status
    }

    const submissions = await RequestSubmission.find(query)
      .populate('formId', 'type title')
      .populate('submitterId', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName email')
      .sort({ submittedAt: -1 })

    return NextResponse.json({
      success: true,
      data: submissions,
      total: submissions.length
    })
  } catch (error) {
    console.error('Error fetching request submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request submissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.formId || !body.responses) {
      return NextResponse.json(
        { success: false, error: 'Form ID and responses are required' },
        { status: 400 }
      )
    }

    // Handle anonymous submissions
    let submitterId = null
    if (body.submitterId && body.submitterId !== 'anonymous') {
      submitterId = body.submitterId
    }

    const newSubmission = new RequestSubmission({
      formId: body.formId,
      submitterId: submitterId,
      responses: body.responses,
      status: body.status || 'pending',
      submittedAt: new Date(),
      notes: body.notes
    })

    const savedSubmission = await newSubmission.save()
    
    // Populate the saved submission
    const populatedSubmission = await RequestSubmission.findById(savedSubmission._id)
      .populate('formId', 'type title')
      .populate('submitterId', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedSubmission,
      message: 'Request submitted successfully'
    })
  } catch (error) {
    console.error('Error creating request submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create request submission' },
      { status: 500 }
    )
  }
}
