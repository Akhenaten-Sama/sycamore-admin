import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Event } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const upcoming = searchParams.get('upcoming')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 100) // Max 100 items per page for admin

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

    // Generate recurring event instances (limited for performance)
    const allEvents = []
    const currentDate = new Date()
    const endDate = new Date()
    
    // For admin dashboard, show more events but still limit to prevent performance issues
    if (upcoming === 'true') {
      endDate.setDate(endDate.getDate() + 180) // 6 months for upcoming events
    } else {
      endDate.setDate(endDate.getDate() + 90) // 3 months for all events view
    }

    for (const event of baseEvents) {
      if (event.isRecurring && event.recurringType) {
        // Add the original event
        allEvents.push({
          ...event.toObject(),
          isRecurringInstance: false,
          originalEventId: event._id
        })
        
        // Generate limited recurring instances
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

    // Calculate pagination
    const totalEvents = filteredEvents.length
    const totalPages = Math.ceil(totalEvents / validLimit)
    const startIndex = (validPage - 1) * validLimit
    const endIndex = startIndex + validLimit
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

    return corsResponse({
      success: true,
      data: paginatedEvents,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: totalEvents,
        totalPages: totalPages,
        hasNextPage: validPage < totalPages,
        hasPreviousPage: validPage > 1
      }
    }, request, 200)
  } catch (error) {
    console.error('Error fetching events:', error)
    return corsResponse(
      { success: false, error: 'Failed to fetch events' },
      request,
      500
    )
  }
}

function generateRecurringEvents(baseEvent: any, startDate: Date, endDate: Date) {
  const events = []
  const eventDate = new Date(baseEvent.date)
  const maxInstances = 24 // Allow more instances for admin dashboard
  
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
    
    while (nextDate <= endDate && instanceCount < 6) { // Limit yearly to 6 instances
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

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const eventData = await request.json()
    
    // Validate required fields
    if (!eventData.name || !eventData.date) {
      return corsResponse(
        { success: false, error: 'Name and date are required' },
        request,
        400
      )
    }

    const event = new Event({
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await event.save()

    return corsResponse({
      success: true,
      data: event,
      message: 'Event created successfully'
    }, request, 201)
  } catch (error) {
    console.error('Error creating event:', error)
    return corsResponse(
      { success: false, error: 'Failed to create event' },
      request,
      500
    )
  }
}
