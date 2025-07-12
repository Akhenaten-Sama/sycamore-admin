import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'File must be a CSV' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()
    
    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize headers to match our schema
        const headerMap: { [key: string]: string } = {
          'first name': 'firstName',
          'firstname': 'firstName',
          'last name': 'lastName',
          'lastname': 'lastName',
          'email address': 'email',
          'phone number': 'phone',
          'date of birth': 'dateOfBirth',
          'dateofbirth': 'dateOfBirth',
          'wedding anniversary': 'weddingAnniversary',
          'weddinganniversary': 'weddingAnniversary',
          'marital status': 'maritalStatus',
          'maritalstatus': 'maritalStatus',
          'is first timer': 'isFirstTimer',
          'isfirsttimer': 'isFirstTimer',
          'first timer': 'isFirstTimer',
          'is team lead': 'isTeamLead',
          'isteamlead': 'isTeamLead',
          'team lead': 'isTeamLead',
          'is admin': 'isAdmin',
          'isadmin': 'isAdmin'
        }
        
        const normalizedHeader = header.toLowerCase().trim()
        return headerMap[normalizedHeader] || normalizedHeader
      }
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CSV parsing error', 
          details: parseResult.errors 
        },
        { status: 400 }
      )
    }

    const csvData = parseResult.data as any[]
    const results = {
      total: csvData.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      
      try {
        // Validate required fields
        if (!row.firstName || !row.lastName || !row.email) {
          results.failed++
          results.errors.push(`Row ${i + 2}: Missing required fields (firstName, lastName, email)`)
          continue
        }

        // Check if email already exists
        const existingMember = await Member.findOne({ email: row.email })
        if (existingMember) {
          results.failed++
          results.errors.push(`Row ${i + 2}: Email ${row.email} already exists`)
          continue
        }

        // Parse dates
        const dateOfBirth = row.dateOfBirth ? new Date(row.dateOfBirth) : undefined
        const weddingAnniversary = row.weddingAnniversary ? new Date(row.weddingAnniversary) : undefined

        // Parse boolean fields
        const isFirstTimer = row.isFirstTimer ? 
          (row.isFirstTimer.toLowerCase() === 'true' || row.isFirstTimer === '1' || row.isFirstTimer.toLowerCase() === 'yes') : false
        const isTeamLead = row.isTeamLead ? 
          (row.isTeamLead.toLowerCase() === 'true' || row.isTeamLead === '1' || row.isTeamLead.toLowerCase() === 'yes') : false
        const isAdmin = row.isAdmin ? 
          (row.isAdmin.toLowerCase() === 'true' || row.isAdmin === '1' || row.isAdmin.toLowerCase() === 'yes') : false

        // Validate marital status
        const maritalStatus = row.maritalStatus?.toLowerCase()
        const validMaritalStatuses = ['single', 'married', 'divorced']
        const finalMaritalStatus = validMaritalStatuses.includes(maritalStatus) ? maritalStatus : 'single'

        // Create member object
        const memberData = {
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: row.email.trim().toLowerCase(),
          phone: row.phone || '',
          address: row.address || '',
          dateOfBirth,
          weddingAnniversary,
          maritalStatus: finalMaritalStatus,
          isFirstTimer,
          isTeamLead,
          isAdmin,
          emergencyContact: row.emergencyContactName ? {
            name: row.emergencyContactName,
            phone: row.emergencyContactPhone || '',
            relationship: row.emergencyContactRelationship || ''
          } : undefined
        }

        // Save to database
        const newMember = new Member(memberData)
        await newMember.save()
        
        results.successful++
      } catch (error) {
        results.failed++
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      data: results
    })

  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import CSV file' },
      { status: 500 }
    )
  }
}
