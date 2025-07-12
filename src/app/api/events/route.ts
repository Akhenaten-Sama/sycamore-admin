import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Event } from '@/lib/models'

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

    const events = await Event.find(query)
      .sort({ date: 1 })

    return NextResponse.json({
      success: true,
      data: events,
      total: events.length
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const eventData = await request.json()
    
    // Validate required fields
    if (!eventData.name || !eventData.date) {
      return NextResponse.json(
        { success: false, error: 'Name and date are required' },
        { status: 400 }
      )
    }

    const event = new Event({
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await event.save()

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Event created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
