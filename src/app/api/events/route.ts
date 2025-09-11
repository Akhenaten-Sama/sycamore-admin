import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Event } from '@/lib/models'

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

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const upcoming = searchParams.get('upcoming')

    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    }

    if (upcoming === 'true') {
      query.date = { $gte: new Date() }
    }

    const baseEvents = await Event.find(query)
      .sort({ date: 1 })

    // Generate recurring event instances
    const allEvents = []
    const currentDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 365) // Generate events for next year

    for (const event of baseEvents) {
      if (event.isRecurring && event.recurringType) {
        // Add the original event
        allEvents.push(event)
        
        // Generate recurring instances
        const instances = generateRecurringEvents(event, currentDate, endDate)
        allEvents.push(...instances)
      } else {
        allEvents.push(event)
      }
    }

    // Sort all events by date
    allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Filter for upcoming if requested
    const filteredEvents = upcoming === 'true' 
      ? allEvents.filter(event => new Date(event.date) >= currentDate)
      : allEvents

    return createCorsResponse({
      success: true,
      data: filteredEvents,
      total: filteredEvents.length
    }, 200)
  } catch (error) {
    console.error('Error fetching events:', error)
    return createCorsResponse(
      { success: false, error: 'Failed to fetch events' },
      500
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

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const eventData = await request.json()
    
    // Validate required fields
    if (!eventData.name || !eventData.date) {
      return createCorsResponse(
        { success: false, error: 'Name and date are required' },
        400
      )
    }

    const event = new Event({
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await event.save()

    return createCorsResponse({
      success: true,
      data: event,
      message: 'Event created successfully'
    }, 201)
  } catch (error) {
    console.error('Error creating event:', error)
    return createCorsResponse(
      { success: false, error: 'Failed to create event' },
      500
    )
  }
}
