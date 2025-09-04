import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RequestSubmission, RequestForm } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')

    if (!formId) {
      return NextResponse.json(
        { success: false, message: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Get the form details
    const form = await RequestForm.findById(formId)
    if (!form) {
      return NextResponse.json(
        { success: false, message: 'Form not found' },
        { status: 404 }
      )
    }

    // Get all submissions for this form
    const submissions = await RequestSubmission.find({ formId })
      .sort({ submittedAt: -1 })

    if (submissions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No submissions found for this form' },
        { status: 404 }
      )
    }

    // Extract all unique field names from all submissions
    const allFieldNames = new Set<string>()
    submissions.forEach(submission => {
      Object.keys(submission.responses).forEach(field => {
        allFieldNames.add(field)
      })
    })

    // Create CSV headers
    const headers = ['Submission ID', 'Submitted At', ...Array.from(allFieldNames), 'Notes']
    
    // Create CSV rows
    const rows = submissions.map((submission: any) => {
      const row = [
        submission._id.toString(),
        submission.submittedAt.toISOString(),
        ...Array.from(allFieldNames).map(field => {
          const value = submission.responses[field]
          if (Array.isArray(value)) {
            return value.join('; ')
          }
          return value || ''
        }),
        submission.notes || ''
      ]
      return row
    })

    // Convert to CSV format
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringField = String(field || '')
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`
        }
        return stringField
      }).join(','))
      .join('\n')

    // Set headers for file download
    const fileName = `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_submissions_${new Date().toISOString().split('T')[0]}.csv`
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error('Error exporting submissions:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
