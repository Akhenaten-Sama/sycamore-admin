import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RequestSubmission, RequestForm } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}
    if (formId) {
      query.formId = formId
    }

    // Get submissions with form details only
    const submissions = await RequestSubmission.find(query)
      .populate('formId', 'title type description')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get total count for pagination
    const total = await RequestSubmission.countDocuments(query)

    // Transform data for frontend - simple form responses
    const transformedSubmissions = submissions.map((submission: any) => ({
      id: submission._id.toString(),
      formId: submission.formId._id.toString(),
      formTitle: submission.formId.title,
      formType: submission.formId.type,
      responses: submission.responses,
      submittedAt: submission.submittedAt,
      notes: submission.notes
    }))

    return NextResponse.json({
      success: true,
      data: transformedSubmissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const {
      formId,
      responses
    } = await request.json()

    if (!formId || !responses) {
      return NextResponse.json(
        { success: false, message: 'Form ID and responses are required' },
        { status: 400 }
      )
    }

    // Verify form exists
    const form = await RequestForm.findById(formId)
    if (!form) {
      return NextResponse.json(
        { success: false, message: 'Form not found' },
        { status: 404 }
      )
    }

    // Create submission - Google Forms style (no user linking)
    const submission = new RequestSubmission({
      formId,
      responses,
      submittedAt: new Date(),
      status: 'submitted'
    })

    await submission.save()

    // Populate and return the created submission
    const populatedSubmission = await RequestSubmission.findById(submission._id)
      .populate('formId', 'title type description')

    if (!populatedSubmission) {
      return NextResponse.json(
        { success: false, message: 'Failed to create submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: (populatedSubmission as any)._id.toString(),
        formId: (populatedSubmission.formId as any)._id.toString(),
        formTitle: (populatedSubmission.formId as any).title,
        formType: (populatedSubmission.formId as any).type,
        responses: populatedSubmission.responses,
        submittedAt: populatedSubmission.submittedAt
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')
    const formId = searchParams.get('formId')

    if (submissionId) {
      // Delete individual submission
      const result = await RequestSubmission.findByIdAndDelete(submissionId)
      if (!result) {
        return NextResponse.json(
          { success: false, message: 'Submission not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Submission deleted successfully'
      })
    } else if (formId) {
      // Delete all submissions for a form
      const result = await RequestSubmission.deleteMany({ formId })
      
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} submissions deleted successfully`
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'submissionId or formId is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deleting submissions:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
