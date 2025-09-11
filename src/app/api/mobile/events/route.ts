import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Event, AttendanceRecord } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

function createCorsResponse(data: any, status: number) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

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
    
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'upcoming'
    
    // Try to get authenticated user for personalized data, but don't require it
    let member = null
    let attendanceMap = new Map()
    
    try {
      const { user, member: memberData } = await verifyMobileToken(request)
      member = memberData
      
      if (member) {
        const attendanceRecords = await AttendanceRecord.find({
          memberId: member._id,
          status: { $in: ['present', 'checked-in'] }
        })
        attendanceMap = new Map(attendanceRecords.map(record => [record.eventId.toString(), record]))
      }
    } catch (error) {
      // Continue without authentication - public access
      console.log('Public access to events (no auth)')
    }
    
    let query: any = {}
    
    if (type === 'upcoming') {
      query.date = { $gte: new Date() }
    } else if (type === 'past') {
      query.date = { $lt: new Date() }
    }
    
    // Get events
    const baseEvents = await Event.find(query)
      .sort({ date: type === 'upcoming' ? 1 : -1 })
      .limit(type === 'past' ? 20 : 100) // Allow more upcoming events for recurring generation
    
    // Generate recurring event instances
    const allEvents = []
    const currentDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 365) // Generate events for next year

    for (const event of baseEvents) {
      if (event.isRecurring && event.recurringType && type === 'upcoming') {
        // Add the original event if it's in the future
        if (new Date(event.date) >= currentDate) {
          allEvents.push(event)
        }
        
        // Generate recurring instances
        const instances = generateRecurringEvents(event, currentDate, endDate)
        allEvents.push(...instances)
      } else {
        allEvents.push(event)
      }
    }

    // Sort and limit events
    allEvents.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return type === 'upcoming' ? dateA - dateB : dateB - dateA
    })

    const limitedEvents = allEvents.slice(0, 20)
    
    // Get user's attendance for these events (only if authenticated)
    if (member) {
      const eventIds = limitedEvents.map(event => event._id).filter(id => id)
      const attendanceRecords = await AttendanceRecord.find({
        memberId: member._id,
        eventId: { $in: eventIds }
      })
      
      attendanceRecords.forEach(record => {
        attendanceMap.set(record.eventId.toString(), record.status)
      })
    }
    
    // Transform events for mobile response
    const mobileEvents = limitedEvents.map(event => ({
      id: event._id || `recurring-${event.originalEventId}-${new Date(event.date).getTime()}`,
      title: event.name, // Use 'title' to match mobile app expectation
      name: event.name,
      description: event.description,
      date: event.date,
      time: event.date ? new Date(event.date).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }) : null,
      endDate: event.endDate,
      location: event.location,
      bannerImage: event.bannerImage,
      image: event.bannerImage, // Alias for mobile app
      isRecurring: event.isRecurring,
      recurringType: event.recurringType,
      isRecurringInstance: event.isRecurringInstance || false,
      originalEventId: event.originalEventId,
      userAttendance: event._id ? attendanceMap.get(event._id.toString()) || null : null,
      canCheckIn: type === 'upcoming' && new Date() >= new Date(event.date.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
      attendees: Math.floor(Math.random() * 200) + 50, // Mock attendee count for now
      category: event.recurringType || 'Event'
    }))

    return createCorsResponse({
      success: true,
      data: mobileEvents
    }, 200)

  } catch (error) {
    console.error('Mobile events error:', error)
    
    return createCorsResponse({ 
      success: false, 
      error: 'Failed to fetch events' 
    }, 500)
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

function generateRecurringEvents(baseEvent: any, startDate: Date, endDate: Date) {
  const events = []
  const eventDate = new Date(baseEvent.date)
  
  if (baseEvent.recurringType === 'weekly') {
    // Generate weekly recurring events
    let nextDate = new Date(eventDate)
    nextDate.setDate(nextDate.getDate() + 7)
    
    while (nextDate <= endDate) {
      if (nextDate >= startDate) {
        const recurringEvent = {
          ...baseEvent.toObject(),
          _id: undefined, // Remove original ID
          date: new Date(nextDate),
          isRecurringInstance: true,
          originalEventId: baseEvent._id
        }
        events.push(recurringEvent)
      }
      nextDate.setDate(nextDate.getDate() + 7)
    }
  } else if (baseEvent.recurringType === 'monthly') {
    // Generate monthly recurring events
    let nextDate = new Date(eventDate)
    nextDate.setMonth(nextDate.getMonth() + 1)
    
    while (nextDate <= endDate) {
      if (nextDate >= startDate) {
        const recurringEvent = {
          ...baseEvent.toObject(),
          _id: undefined,
          date: new Date(nextDate),
          isRecurringInstance: true,
          originalEventId: baseEvent._id
        }
        events.push(recurringEvent)
      }
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
  } else if (baseEvent.recurringType === 'yearly') {
    // Generate yearly recurring events
    let nextDate = new Date(eventDate)
    nextDate.setFullYear(nextDate.getFullYear() + 1)
    
    while (nextDate <= endDate) {
      if (nextDate >= startDate) {
        const recurringEvent = {
          ...baseEvent.toObject(),
          _id: undefined,
          date: new Date(nextDate),
          isRecurringInstance: true,
          originalEventId: baseEvent._id
        }
        events.push(recurringEvent)
      }
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    }
  }
  
  return events
}
