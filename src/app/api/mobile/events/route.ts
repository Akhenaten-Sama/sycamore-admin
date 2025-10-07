import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Event, AttendanceRecord } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
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
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    
    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 50) // Max 50 items per page
    
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
    
    // Get events more efficiently
    const baseEvents = await Event.find(query)
      .sort({ date: type === 'upcoming' ? 1 : -1 })
      .limit(type === 'past' ? 20 : 50) // Reduce limit for better performance

    // Generate recurring event instances more efficiently
    const allEvents = []
    const currentDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 90) // Generate events for next 3 months only

    for (const event of baseEvents) {
      if (event.isRecurring && event.recurringType && type === 'upcoming') {
        // Add the original event if it's in the future
        if (new Date(event.date) >= currentDate) {
          allEvents.push({
            ...event.toObject(),
            isRecurringInstance: false,
            originalEventId: event._id
          })
        }
        
        // Generate recurring instances (limited to next 3 months)
        const instances = generateRecurringEvents(event, currentDate, endDate)
        allEvents.push(...instances)
      } else {
        allEvents.push(event)
      }
    }    // Sort and paginate events
    allEvents.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return type === 'upcoming' ? dateA - dateB : dateB - dateA
    })

    // Calculate pagination
    const totalEvents = allEvents.length
    const totalPages = Math.ceil(totalEvents / validLimit)
    const startIndex = (validPage - 1) * validLimit
    const endIndex = startIndex + validLimit
    const paginatedEvents = allEvents.slice(startIndex, endIndex)
    
    // Get user's attendance for these events (only if authenticated)
    if (member) {
      // For attendance lookup, use original event IDs (base events only)
      // Recurring instances don't have their own attendance records
      const baseEventIds = paginatedEvents.map(event => {
        if (event.isRecurringInstance && event.originalEventId) {
          return event.originalEventId
        }
        return event._id
      }).filter(id => id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) // Only valid ObjectIds
      
      const attendanceRecords = await AttendanceRecord.find({
        memberId: member._id,
        eventId: { $in: baseEventIds }
      })
      
      attendanceRecords.forEach(record => {
        // Map attendance to both base event and its recurring instances
        const baseEventId = record.eventId.toString()
        attendanceMap.set(baseEventId, record.status)
        
        // Also map to recurring instances of this base event
        paginatedEvents.forEach(event => {
          if (event.originalEventId && event.originalEventId.toString() === baseEventId) {
            attendanceMap.set(event._id, record.status)
          }
        })
      })
    }
    
    // Transform events for mobile response
    const mobileEvents = paginatedEvents.map(event => ({
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
      userAttendance: attendanceMap.get(event._id) || null,
      canCheckIn: type === 'upcoming' && (() => {
        const now = new Date()
        const eventDate = new Date(event.date)
        
        // Can check in if:
        // 1. It's the same day as the event, OR
        // 2. It's within 2 hours before the event time
        const isSameDay = now.toDateString() === eventDate.toDateString()
        const isWithinTwoHours = now >= new Date(eventDate.getTime() - 2 * 60 * 60 * 1000)
        
        return isSameDay || isWithinTwoHours
      })(),
      attendees: Math.floor(Math.random() * 200) + 50, // Mock attendee count for now
      category: event.recurringType || 'Event'
    }))

    return createCorsResponse({
      success: true,
      data: mobileEvents,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: totalEvents,
        totalPages: totalPages,
        hasNextPage: validPage < totalPages,
        hasPreviousPage: validPage > 1
      }
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
  const maxInstances = 12 // Limit to 12 instances per recurring event
  
  if (baseEvent.recurringType === 'weekly') {
    // Generate weekly recurring events
    let nextDate = new Date(eventDate)
    nextDate.setDate(nextDate.getDate() + 7)
    let instanceCount = 0
    
    while (nextDate <= endDate && instanceCount < maxInstances) {
      if (nextDate >= startDate) {
        const recurringEvent = {
          ...baseEvent.toObject(),
          _id: `${baseEvent._id}_${nextDate.toISOString().split('T')[0]}`, // Generate consistent ID
          date: new Date(nextDate),
          isRecurringInstance: true,
          originalEventId: baseEvent._id
        }
        events.push(recurringEvent)
        instanceCount++
      }
      nextDate.setDate(nextDate.getDate() + 7)
    }
  } else if (baseEvent.recurringType === 'monthly') {
    // Generate monthly recurring events
    let nextDate = new Date(eventDate)
    nextDate.setMonth(nextDate.getMonth() + 1)
    let instanceCount = 0
    
    while (nextDate <= endDate && instanceCount < maxInstances) {
      if (nextDate >= startDate) {
        const recurringEvent = {
          ...baseEvent.toObject(),
          _id: `${baseEvent._id}_${nextDate.toISOString().split('T')[0]}`,
          date: new Date(nextDate),
          isRecurringInstance: true,
          originalEventId: baseEvent._id
        }
        events.push(recurringEvent)
        instanceCount++
      }
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
  } else if (baseEvent.recurringType === 'yearly') {
    // Generate yearly recurring events
    let nextDate = new Date(eventDate)
    nextDate.setFullYear(nextDate.getFullYear() + 1)
    let instanceCount = 0
    
    while (nextDate <= endDate && instanceCount < 3) { // Limit yearly to 3 instances
      if (nextDate >= startDate) {
        const recurringEvent = {
          ...baseEvent.toObject(),
          _id: `${baseEvent._id}_${nextDate.toISOString().split('T')[0]}`,
          date: new Date(nextDate),
          isRecurringInstance: true,
          originalEventId: baseEvent._id
        }
        events.push(recurringEvent)
        instanceCount++
      }
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    }
  }
  
  return events
}
