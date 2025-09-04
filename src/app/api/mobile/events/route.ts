import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Event, AttendanceRecord } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyMobileToken(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user')
    }
    
    return { user, member: user.memberId }
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, member } = await verifyMobileToken(request)
    
    if (!member) {
      return NextResponse.json(
        { message: 'Member profile not found' },
        { status: 404 }
      )
    }

    const memberData = member as any
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'upcoming'
    
    let query: any = {}
    
    if (type === 'upcoming') {
      query.date = { $gte: new Date() }
    } else if (type === 'past') {
      query.date = { $lt: new Date() }
    }
    
    // Get events
    const events = await Event.find(query)
      .sort({ date: type === 'upcoming' ? 1 : -1 })
      .limit(20)
    
    // Get user's attendance for these events
    const eventIds = events.map(event => event._id)
    const attendanceRecords = await AttendanceRecord.find({
      memberId: memberData._id,
      eventId: { $in: eventIds }
    })
    
    const attendanceMap = new Map()
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.eventId.toString(), record.status)
    })
    
    // Transform events for mobile response
    const mobileEvents = events.map(event => ({
      id: event._id,
      name: event.name,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      location: event.location,
      bannerImage: event.bannerImage,
      isRecurring: event.isRecurring,
      recurringType: event.recurringType,
      userAttendance: attendanceMap.get(event._id.toString()) || null,
      canCheckIn: type === 'upcoming' && new Date() >= new Date(event.date.getTime() - 2 * 60 * 60 * 1000) // 2 hours before
    }))

    return NextResponse.json({
      success: true,
      data: mobileEvents
    })

  } catch (error) {
    console.error('Mobile events error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST for checking into an event
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, member } = await verifyMobileToken(request)
    
    if (!member) {
      return NextResponse.json(
        { message: 'Member profile not found' },
        { status: 404 }
      )
    }

    const memberData = member as any
    const { eventId } = await request.json()
    
    if (!eventId) {
      return NextResponse.json(
        { message: 'Event ID is required' },
        { status: 400 }
      )
    }
    
    // Find the event
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      )
    }
    
    // Check if user can check in (within 2 hours of event start)
    const eventTime = new Date(event.date)
    const now = new Date()
    const twoHoursBefore = new Date(eventTime.getTime() - 2 * 60 * 60 * 1000)
    const twoHoursAfter = new Date(eventTime.getTime() + 2 * 60 * 60 * 1000)
    
    if (now < twoHoursBefore || now > twoHoursAfter) {
      return NextResponse.json(
        { message: 'Check-in is only available 2 hours before to 2 hours after the event' },
        { status: 400 }
      )
    }
    
    // Check if already checked in
    const existingRecord = await AttendanceRecord.findOne({
      memberId: memberData._id,
      eventId: eventId
    })
    
    if (existingRecord) {
      return NextResponse.json(
        { message: 'Already checked in to this event' },
        { status: 400 }
      )
    }
    
    // Create attendance record
    const attendanceRecord = new AttendanceRecord({
      memberId: memberData._id,
      eventId: eventId,
      date: event.date,
      status: 'present',
      checkedInAt: new Date()
    })
    
    await attendanceRecord.save()
    
    return NextResponse.json({
      success: true,
      message: 'Successfully checked in to event',
      data: {
        eventName: event.name,
        checkedInAt: attendanceRecord.checkedInAt
      }
    })

  } catch (error) {
    console.error('Mobile event check-in error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Failed to check in to event' },
      { status: 500 }
    )
  }
}
