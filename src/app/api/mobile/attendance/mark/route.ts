import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { AttendanceRecord, Event, Member, ChildWard } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

// Mark attendance for user and their children
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { eventId, userId, childrenIds = [] } = await request.json()

    if (!eventId || !userId) {
      return corsResponse(
        { message: 'Event ID and User ID are required' },
        request,
        400
      )
    }

    // Verify event exists and allows self-attendance
    const event = await Event.findById(eventId)
    if (!event) {
      return corsResponse(
        { message: 'Event not found' },
        request,
        404
      )
    }

    if (!event.allowSelfAttendance) {
      return corsResponse(
        { message: 'Self-attendance is not allowed for this event' },
        request,
        403
      )
    }

    // Verify user exists
    const user = await Member.findById(userId)
    if (!user) {
      return corsResponse(
        { message: 'User not found' },
        request,
        404
      )
    }

    const attendanceRecords = []
    const now = new Date()

    // Mark attendance for the main user
    const existingUserAttendance = await AttendanceRecord.findOne({
      memberId: userId,
      eventId,
      date: {
        $gte: new Date(now.toDateString())
      }
    })

    if (!existingUserAttendance) {
      const userAttendance = new AttendanceRecord({
        memberId: userId,
        eventId,
        date: now,
        status: 'present',
        checkedInAt: now,
        notes: 'Self check-in via mobile app'
      })
      await userAttendance.save()
      attendanceRecords.push({
        type: 'user',
        name: `${user.firstName} ${user.lastName}`,
        recordId: userAttendance._id
      })
    }

    // Mark attendance for children/wards if provided
    if (childrenIds.length > 0) {
      for (const childId of childrenIds) {
        // Verify child belongs to this parent
        const child = await ChildWard.findOne({
          _id: childId,
          parentId: userId,
          isActive: true
        })

        if (child) {
          // Check if child already has attendance for this event today
          const existingChildAttendance = await AttendanceRecord.findOne({
            childId: childId,
            eventId,
            date: {
              $gte: new Date(now.toDateString())
            }
          })

          if (!existingChildAttendance) {
            const childAttendance = new AttendanceRecord({
              memberId: userId, // Parent's ID for tracking
              childId: childId,
              eventId,
              date: now,
              status: 'present',
              checkedInAt: now,
              notes: `Child check-in by parent via mobile app`
            })
            await childAttendance.save()
            attendanceRecords.push({
              type: 'child',
              name: `${child.firstName} ${child.lastName}`,
              recordId: childAttendance._id
            })
          }
        }
      }
    }

    return corsResponse({
      success: true,
      data: {
        eventName: event.name,
        attendanceRecords,
        message: `Successfully marked attendance for ${attendanceRecords.length} person(s)`
      }
    }, request)

  } catch (error) {
    console.error('Error marking attendance:', error)
    return corsResponse(
      { success: false, message: 'Failed to mark attendance' },
      request,
      500
    )
  }
}

// Get attendance records for a user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const eventId = searchParams.get('eventId')

    if (!userId) {
      return corsResponse(
        { message: 'User ID is required' },
        request,
        400
      )
    }

    const query: any = { memberId: userId }
    if (eventId) {
      query.eventId = eventId
    }

    const attendanceRecords = await AttendanceRecord.find(query)
      .populate('eventId', 'name date location')
      .populate('childId', 'firstName lastName')
      .sort({ date: -1 })
      .limit(50)

    return corsResponse({
      success: true,
      data: attendanceRecords
    }, request)

  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return corsResponse(
      { success: false, message: 'Failed to fetch attendance records' },
      request,
      500
    )
  }
}