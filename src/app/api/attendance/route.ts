import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { AttendanceRecord } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const eventId = searchParams.get('eventId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    let query: any = {}

    if (memberId) {
      query.memberId = memberId
    }

    if (eventId) {
      query.eventId = eventId
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      query.date = { $gte: startDate, $lt: endDate }
    }

    if (status) {
      query.status = status
    }

    const attendanceRecords = await AttendanceRecord.find(query)
      .populate('memberId', 'firstName lastName email')
      .populate('eventId', 'name date location')
      .sort({ date: -1 })

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
      total: attendanceRecords.length
    })
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.memberId || !body.eventId || !body.date || !body.status) {
      return NextResponse.json(
        { success: false, error: 'Member ID, event ID, date, and status are required' },
        { status: 400 }
      )
    }

    // Check if attendance record already exists for this member and event
    const existingRecord = await AttendanceRecord.findOne({
      memberId: body.memberId,
      eventId: body.eventId,
      date: new Date(body.date)
    })

    if (existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Attendance record already exists for this member and event' },
        { status: 400 }
      )
    }

    const newRecord = new AttendanceRecord({
      memberId: body.memberId,
      eventId: body.eventId,
      date: new Date(body.date),
      status: body.status,
      checkedInAt: body.checkedInAt ? new Date(body.checkedInAt) : new Date(),
      notes: body.notes
    })

    const savedRecord = await newRecord.save()
    
    // Populate the saved record
    const populatedRecord = await AttendanceRecord.findById(savedRecord._id)
      .populate('memberId', 'firstName lastName email')
      .populate('eventId', 'name date location')

    return NextResponse.json({
      success: true,
      data: populatedRecord,
      message: 'Attendance record created successfully'
    })
  } catch (error) {
    console.error('Error creating attendance record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create attendance record' },
      { status: 500 }
    )
  }
}
