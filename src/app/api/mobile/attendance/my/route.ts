import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { AttendanceRecord } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
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