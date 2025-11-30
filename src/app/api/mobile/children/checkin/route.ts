import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { JuniorMember, JuniorAttendance, Member } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

// Daily check-in for children (not tied to specific event)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { parentId, childrenIds = [] } = await request.json()

    if (!parentId) {
      return corsResponse(
        { message: 'Parent ID is required' },
        request,
        400
      )
    }

    if (!childrenIds || childrenIds.length === 0) {
      return corsResponse(
        { message: 'At least one child must be selected' },
        request,
        400
      )
    }

    // Verify parent exists
    const parent = await Member.findById(parentId)
    if (!parent) {
      return corsResponse(
        { message: 'Parent not found' },
        request,
        404
      )
    }

    const checkedInChildren = []
    const alreadyCheckedIn = []
    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const endOfDay = new Date(now.setHours(23, 59, 59, 999))

    for (const childId of childrenIds) {
      // Verify child belongs to this parent and is a JuniorMember
      const child = await JuniorMember.findOne({
        _id: childId,
        parentPhone: parent.phone,
        isActive: true
      })

      if (!child) {
        continue // Skip if child not found or doesn't belong to parent
      }

      // Check if already checked in today
      const existingAttendance = await JuniorAttendance.findOne({
        juniorMemberId: childId,
        date: { $gte: startOfDay, $lte: endOfDay }
      })

      if (existingAttendance) {
        alreadyCheckedIn.push({
          name: `${child.firstName} ${child.lastName}`,
          time: existingAttendance.dropoffTime
        })
        continue
      }

      // Create new daily check-in record
      const attendance = new JuniorAttendance({
        juniorMemberId: childId,
        date: new Date(),
        dropoffTime: new Date(),
        dropoffBy: `${parent.firstName} ${parent.lastName}`,
        status: 'dropped_off',
        verifiedById: parentId,
        notes: 'Daily check-in via mobile app (not tied to specific event)'
      })

      await attendance.save()

      checkedInChildren.push({
        name: `${child.firstName} ${child.lastName}`,
        class: child.class,
        barcodeId: child.barcodeId,
        time: attendance.dropoffTime
      })
    }

    // Build response message
    let message = ''
    if (checkedInChildren.length > 0) {
      message += `Successfully checked in ${checkedInChildren.length} child(ren). `
    }
    if (alreadyCheckedIn.length > 0) {
      message += `${alreadyCheckedIn.length} child(ren) already checked in today.`
    }

    return corsResponse({
      success: true,
      data: {
        checkedInChildren,
        alreadyCheckedIn,
        totalProcessed: childrenIds.length
      },
      message: message.trim() || 'Check-in completed'
    }, request)

  } catch (error) {
    console.error('Error checking in children:', error)
    return corsResponse(
      { success: false, message: 'Failed to check in children' },
      request,
      500
    )
  }
}

// Get today's check-in status for parent's children
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    if (!parentId) {
      return corsResponse(
        { message: 'Parent ID is required' },
        request,
        400
      )
    }

    // Get parent info
    const parent = await Member.findById(parentId)
    if (!parent) {
      return corsResponse(
        { message: 'Parent not found' },
        request,
        404
      )
    }

    // Get all parent's children
    const children = await JuniorMember.find({
      parentPhone: parent.phone,
      isActive: true
    }).lean()

    // Get today's attendance for these children
    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const endOfDay = new Date(now.setHours(23, 59, 59, 999))

    const childrenStatus = await Promise.all(
      children.map(async (child) => {
        const attendance = await JuniorAttendance.findOne({
          juniorMemberId: child._id,
          date: { $gte: startOfDay, $lte: endOfDay }
        }).lean()

        return {
          childId: child._id,
          firstName: child.firstName,
          lastName: child.lastName,
          class: child.class,
          barcodeId: child.barcodeId,
          isCheckedIn: !!attendance,
          checkInTime: attendance?.dropoffTime,
          status: attendance?.status,
          dropoffBy: attendance?.dropoffBy,
          pickupTime: attendance?.pickupTime,
          pickedUpBy: attendance?.pickedUpBy
        }
      })
    )

    const checkedInCount = childrenStatus.filter(c => c.isCheckedIn && c.status === 'dropped_off').length
    const pickedUpCount = childrenStatus.filter(c => c.status === 'picked_up').length

    return corsResponse({
      success: true,
      data: {
        children: childrenStatus,
        summary: {
          total: children.length,
          checkedIn: checkedInCount,
          pickedUp: pickedUpCount,
          notCheckedIn: children.length - checkedInCount - pickedUpCount
        }
      }
    }, request)

  } catch (error) {
    console.error('Error fetching check-in status:', error)
    return corsResponse(
      { success: false, message: 'Failed to fetch check-in status' },
      request,
      500
    )
  }
}
