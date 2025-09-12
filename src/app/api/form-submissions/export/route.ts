import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RequestSubmission, RequestForm } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const format = searchParams.get('format') || 'csv'
    
    // Build query
    const query: any = {}
    if (formId) {
      query.formId = formId
    }

    // Get submissions with form details
    const submissions = await RequestSubmission.find(query)
      .populate('formId', 'title type description fields')
      .sort({ submittedAt: -1 })

    if (submissions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No submissions found'
      }, { status: 404 })
    }

    if (format === 'csv') {
      // Generate CSV
      const form = submissions[0].formId as any
      const headers = ['Submission ID', 'Form Title', 'Submitted At']
      
      // Add field headers
      if (form.fields && form.fields.length > 0) {
        form.fields.forEach((field: any) => {
          headers.push(field.label || field.name)
        })
      }
      
      // Add notes header
      headers.push('Notes')

      let csvContent = headers.join(',') + '\n'

      submissions.forEach((submission: any) => {
        const row = [
          submission._id.toString(),
          `"${submission.formId.title}"`,
          submission.submittedAt.toISOString()
        ]

        // Add field values
        if (form.fields && form.fields.length > 0) {
          form.fields.forEach((field: any) => {
            const response = submission.responses.find((r: any) => r.fieldName === field.name)
            let value = response ? response.value : ''
            
            // Handle array values (for checkboxes, multi-select)
            if (Array.isArray(value)) {
              value = value.join('; ')
            }
            
            // Escape quotes and wrap in quotes
            value = `"${String(value).replace(/"/g, '""')}"`
            row.push(value)
          })
        }

        // Add notes
        const notes = submission.notes || ''
        row.push(`"${notes.replace(/"/g, '""')}"`)

        csvContent += row.join(',') + '\n'
      })

      // Return CSV file
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="form-submissions-${formId || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // JSON format (default)
    const exportData = submissions.map((submission: any) => ({
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
      data: exportData,
      total: submissions.length,
      exportedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, message: 'Export failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { formIds, format = 'csv', dateRange } = await request.json()
    
    // Build query
    const query: any = {}
    
    if (formIds && formIds.length > 0) {
      query.formId = { $in: formIds }
    }
    
    if (dateRange) {
      query.submittedAt = {}
      if (dateRange.start) {
        query.submittedAt.$gte = new Date(dateRange.start)
      }
      if (dateRange.end) {
        query.submittedAt.$lte = new Date(dateRange.end)
      }
    }

    // Get submissions
    const submissions = await RequestSubmission.find(query)
      .populate('formId', 'title type description fields')
      .sort({ submittedAt: -1 })

    if (submissions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No submissions found for the specified criteria'
      }, { status: 404 })
    }

    // For POST requests, always return JSON with download URL or direct data
    const exportData = submissions.map((submission: any) => ({
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
      data: exportData,
      total: submissions.length,
      exportedAt: new Date().toISOString(),
      message: `Successfully exported ${submissions.length} submissions`
    })

  } catch (error) {
    console.error('Bulk export error:', error)
    return NextResponse.json(
      { success: false, message: 'Bulk export failed' },
      { status: 500 }
    )
  }
}