import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Form } from '@/lib/models'
import { verifyToken } from '@/lib/auth'

// GET /api/forms/[id]/export - Export form submissions as CSV
export async function GET(
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
    const form = await Form.findById(id)
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // If no submissions, return empty CSV
    if (!form.submissions || form.submissions.length === 0) {
      const headers = ['Submission Date', 'Submitter Name', 'Submitter Email']
      const csvContent = headers.join(',') + '\n'
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${form.title}-submissions.csv"`
        }
      })
    }

    // Get all unique field IDs from form definition and submissions
    const formFieldIds = form.fields.map(field => field.id)
    const formFieldLabels = form.fields.reduce((acc, field) => {
      acc[field.id] = field.label
      return acc
    }, {} as Record<string, string>)

    // Create CSV headers
    const headers = [
      'Submission Date',
      'Submitter Name', 
      'Submitter Email',
      ...formFieldIds.map(fieldId => formFieldLabels[fieldId] || fieldId)
    ]

    // Create CSV rows
    const rows = form.submissions.map(submission => {
      const row = [
        submission.submittedAt.toISOString(),
        submission.submitterName || '',
        submission.submitterEmail || ''
      ]
      
      // Add form field responses
      formFieldIds.forEach(fieldId => {
        const value = submission.data?.[fieldId] || ''
        // Handle arrays (like checkbox values) by joining with semicolons
        const cellValue = Array.isArray(value) ? value.join('; ') : String(value)
        // Escape quotes and wrap in quotes if contains comma or quote
        const escapedValue = cellValue.includes(',') || cellValue.includes('"') 
          ? `"${cellValue.replace(/"/g, '""')}"` 
          : cellValue
        row.push(escapedValue)
      })
      
      return row
    })

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${form.title}-submissions.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting form submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
