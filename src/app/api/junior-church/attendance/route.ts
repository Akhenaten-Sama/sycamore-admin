import { NextRequest, NextResponse } from 'next/server'
import connectMongoDB from '@/lib/mongodb'
import { JuniorMember, JuniorAttendance, User } from '@/lib/models'
import { getCorsHeaders } from '@/lib/cors'
import jwt from 'jsonwebtoken'

// Helper function to verify JWT token and get user ID
async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded.userId
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Get attendance records
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB()

    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const memberId = url.searchParams.get('memberId')
    const status = url.searchParams.get('status')

    let query: any = {}
    
    if (date) {
      const searchDate = new Date(date)
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999))
      query.date = { $gte: startOfDay, $lte: endOfDay }
    }
    
    if (memberId) {
      query.juniorMemberId = memberId
    }

    if (status) {
      query.status = status
    }

    const attendanceRecords = await JuniorAttendance.find(query)
      .populate('juniorMemberId', 'firstName lastName class barcodeId')
      .populate('verifiedById', 'firstName lastName')
      .sort({ date: -1, dropoffTime: -1 })

    return NextResponse.json(
      {
        success: true,
        data: attendanceRecords,
        total: attendanceRecords.length
      },
      { 
        status: 200,
        headers: getCorsHeaders()
      }
    )
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch attendance records' },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}

// Handle check-in/check-out via barcode
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB()

    // Get user ID from token for verification
    const userId = await getUserFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { 
          status: 401,
          headers: getCorsHeaders()
        }
      )
    }

    const body = await request.json()
    const { barcodeId, action, personName, override = false } = body

    if (!barcodeId || !action || !personName) {
      return NextResponse.json(
        { success: false, message: 'Barcode ID, action, and person name are required' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }

    // Find the junior member by barcode
    const member = await JuniorMember.findOne({ barcodeId, isActive: true })
    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Invalid barcode or inactive member' },
        { 
          status: 404,
          headers: getCorsHeaders()
        }
      )
    }

    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    // Check for existing attendance record today
    const existingRecord = await JuniorAttendance.findOne({
      juniorMemberId: member._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    })

    if (action === 'dropoff') {
      if (existingRecord) {
        return NextResponse.json(
          { 
            success: false, 
            message: `${member.firstName} ${member.lastName} has already been checked in today` 
          },
          { 
            status: 400,
            headers: getCorsHeaders()
          }
        )
      }

      // Create new check-in record
      const newAttendance = new JuniorAttendance({
        juniorMemberId: member._id,
        date: new Date(),
        dropoffTime: new Date(),
        dropoffBy: personName,
        status: 'dropped_off',
        verifiedById: userId
      })

      const savedAttendance = await newAttendance.save()

      return NextResponse.json(
        {
          success: true,
          data: {
            ...savedAttendance.toObject(),
            member: {
              firstName: member.firstName,
              lastName: member.lastName,
              class: member.class
            }
          },
          message: `${member.firstName} ${member.lastName} checked in successfully`
        },
        { 
          status: 201,
          headers: getCorsHeaders()
        }
      )
    } else if (action === 'pickup') {
      if (!existingRecord) {
        return NextResponse.json(
          { 
            success: false, 
            message: `${member.firstName} ${member.lastName} was not checked in today` 
          },
          { 
            status: 400,
            headers: getCorsHeaders()
          }
        )
      }

      if (existingRecord.status === 'picked_up') {
        return NextResponse.json(
          { 
            success: false, 
            message: `${member.firstName} ${member.lastName} has already been picked up today` 
          },
          { 
            status: 400,
            headers: getCorsHeaders()
          }
        )
      }

      // Check if person is authorized for pickup
      const isAuthorized = member.pickupAuthority.includes(personName)
      if (!isAuthorized && !override) {
        return NextResponse.json(
          {
            success: false,
            message: `${personName} is not authorized to pick up ${member.firstName} ${member.lastName}`,
            requiresOverride: true,
            authorizedPersons: member.pickupAuthority
          },
          { 
            status: 403,
            headers: getCorsHeaders()
          }
        )
      }

      // Update record for pickup
      existingRecord.pickupTime = new Date()
      existingRecord.pickedUpBy = personName
      existingRecord.status = 'picked_up'
      if (!isAuthorized && override) {
        existingRecord.notes = `OVERRIDE: Picked up by unauthorized person - ${personName}`
      }

      const updatedAttendance = await existingRecord.save()

      return NextResponse.json(
        {
          success: true,
          data: {
            ...updatedAttendance.toObject(),
            member: {
              firstName: member.firstName,
              lastName: member.lastName,
              class: member.class
            }
          },
          message: `${member.firstName} ${member.lastName} checked out successfully`,
          wasOverride: !isAuthorized && override
        },
        { 
          status: 200,
          headers: getCorsHeaders()
        }
      )
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "dropoff" or "pickup"' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }
  } catch (error) {
    console.error('Error processing check-in/check-out:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process check-in/check-out' 
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}

// Manual check-out (admin override)
export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB()

    // Get user ID from token for verification
    const userId = await getUserFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { 
          status: 401,
          headers: getCorsHeaders()
        }
      )
    }

    const body = await request.json()
    const { attendanceId, pickedUpBy, notes } = body

    if (!attendanceId || !pickedUpBy) {
      return NextResponse.json(
        { success: false, message: 'Attendance ID and pickup person are required' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }

    const attendanceRecord = await JuniorAttendance.findById(attendanceId)
      .populate('juniorMemberId', 'firstName lastName class')

    if (!attendanceRecord) {
      return NextResponse.json(
        { success: false, message: 'Attendance record not found' },
        { 
          status: 404,
          headers: getCorsHeaders()
        }
      )
    }

    if (attendanceRecord.status === 'picked_up') {
      return NextResponse.json(
        { success: false, message: 'Child has already been picked up' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }

    // Update record for manual checkout
    attendanceRecord.pickupTime = new Date()
    attendanceRecord.pickedUpBy = pickedUpBy
    attendanceRecord.status = 'picked_up'
    attendanceRecord.notes = notes ? `ADMIN CHECKOUT: ${notes}` : 'ADMIN CHECKOUT: Manual checkout by staff'

    const updatedAttendance = await attendanceRecord.save()

    return NextResponse.json(
      {
        success: true,
        data: updatedAttendance,
        message: `Manual checkout completed for ${(attendanceRecord.juniorMemberId as any).firstName} ${(attendanceRecord.juniorMemberId as any).lastName}`
      },
      { 
        status: 200,
        headers: getCorsHeaders()
      }
    )
  } catch (error) {
    console.error('Error processing manual checkout:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process manual checkout' 
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}