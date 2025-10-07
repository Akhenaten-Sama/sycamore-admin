import { NextRequest, NextResponse } from 'next/server'
import connectMongoDB from '@/lib/mongodb'
import { JuniorMember, JuniorAttendance } from '@/lib/models'
import { getCorsHeaders } from '@/lib/cors'

// Get all junior church members
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB()

    const url = new URL(request.url)
    const classFilter = url.searchParams.get('class')
    const active = url.searchParams.get('active')
    const search = url.searchParams.get('search')

    let query: any = {}
    
    if (classFilter) {
      query.class = classFilter
    }
    
    if (active !== null) {
      query.isActive = active === 'true'
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { barcodeId: { $regex: search, $options: 'i' } }
      ]
    }

    const members = await JuniorMember.find(query).sort({ firstName: 1, lastName: 1 })

    return NextResponse.json(
      {
        success: true,
        data: members,
        total: members.length
      },
      { 
        status: 200,
        headers: getCorsHeaders()
      }
    )
  } catch (error) {
    console.error('Error fetching junior members:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch junior members' },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}

// Create new junior church member
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB()

    const body = await request.json()
    const {
      firstName,
      lastName,
      dateOfBirth,
      parentName,
      parentPhone,
      parentEmail,
      emergencyContact,
      allergies,
      medicalNotes,
      pickupAuthority,
      class: memberClass
    } = body

    // Calculate age
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()

    // Generate unique barcode ID
    const year = new Date().getFullYear()
    const existingMembers = await JuniorMember.countDocuments()
    const barcodeId = `JC${year}${String(existingMembers + 1).padStart(3, '0')}`

    // Process pickup authority (split comma-separated string into array)
    const pickupAuthorityArray = typeof pickupAuthority === 'string' 
      ? pickupAuthority.split(',').map(p => p.trim()).filter(p => p.length > 0)
      : pickupAuthority

    const newMember = new JuniorMember({
      firstName,
      lastName,
      dateOfBirth: birthDate,
      age,
      parentName,
      parentPhone,
      parentEmail,
      emergencyContact,
      allergies,
      medicalNotes,
      pickupAuthority: pickupAuthorityArray,
      class: memberClass,
      barcodeId
    })

    const savedMember = await newMember.save()

    return NextResponse.json(
      {
        success: true,
        data: savedMember,
        message: 'Junior member registered successfully'
      },
      { 
        status: 201,
        headers: getCorsHeaders()
      }
    )
  } catch (error) {
    console.error('Error creating junior member:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to register junior member' 
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}

// Update junior church member
export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB()

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Member ID is required' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }

    // Calculate age if dateOfBirth is being updated
    if (updateData.dateOfBirth) {
      const birthDate = new Date(updateData.dateOfBirth)
      const today = new Date()
      updateData.age = today.getFullYear() - birthDate.getFullYear()
    }

    // Process pickup authority if provided
    if (updateData.pickupAuthority && typeof updateData.pickupAuthority === 'string') {
      updateData.pickupAuthority = updateData.pickupAuthority
        .split(',')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0)
    }

    const updatedMember = await JuniorMember.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedMember) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { 
          status: 404,
          headers: getCorsHeaders()
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedMember,
        message: 'Member updated successfully'
      },
      { 
        status: 200,
        headers: getCorsHeaders()
      }
    )
  } catch (error) {
    console.error('Error updating junior member:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update member' 
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}

// Delete junior church member
export async function DELETE(request: NextRequest) {
  try {
    await connectMongoDB()

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Member ID is required' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }

    // Check if member has attendance records
    const attendanceRecords = await JuniorAttendance.countDocuments({ juniorMemberId: id })
    
    if (attendanceRecords > 0) {
      // Soft delete - mark as inactive instead of actual deletion for data integrity
      const updatedMember = await JuniorMember.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      )

      return NextResponse.json(
        {
          success: true,
          data: updatedMember,
          message: 'Member deactivated successfully (has attendance history)'
        },
        { 
          status: 200,
          headers: getCorsHeaders()
        }
      )
    } else {
      // Hard delete if no attendance records
      const deletedMember = await JuniorMember.findByIdAndDelete(id)

      if (!deletedMember) {
        return NextResponse.json(
          { success: false, message: 'Member not found' },
          { 
            status: 404,
            headers: getCorsHeaders()
          }
        )
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Member deleted successfully'
        },
        { 
          status: 200,
          headers: getCorsHeaders()
        }
      )
    }
  } catch (error) {
    console.error('Error deleting junior member:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete member' 
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}