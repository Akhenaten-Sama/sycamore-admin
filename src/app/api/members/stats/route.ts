import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member, AttendanceRecord, BlogPost, Event, Giving } from '@/lib/models'

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

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return createCorsResponse({ error: 'Authorization required' }, 401)
    }

    const token = authorization.replace('Bearer ', '')
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return createCorsResponse({ error: 'Invalid token' }, 401)
    }

    const memberId = decoded.memberId
    if (!memberId) {
      return createCorsResponse({ error: 'Member ID not found' }, 401)
    }

    // Get member data
    const member = await Member.findById(memberId)
    if (!member) {
      return createCorsResponse({ error: 'Member not found' }, 404)
    }

    // Calculate attendance streak
    const attendanceRecords = await AttendanceRecord.find({ memberId })
      .sort({ date: -1 })
      .limit(30)

    let currentStreak = 0
    const today = new Date()
    let checkDate = new Date(today)
    
    for (const record of attendanceRecords) {
      const recordDate = new Date(record.date)
      const daysDiff = Math.floor((checkDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 7) { // Within a week
        currentStreak++
        checkDate = recordDate
      } else {
        break
      }
    }

    // Get total giving
    const givingRecords = await Giving.find({ memberId })
    const totalGiving = givingRecords.reduce((sum: number, donation: any) => sum + donation.amount, 0)

    // Get recent activities
    const recentActivities = [
      ...attendanceRecords.slice(0, 5).map((record: any) => ({
        type: 'attendance',
        description: `Attended ${record.eventName || 'Service'}`,
        date: record.date,
        icon: '👥'
      })),
      ...givingRecords.slice(-5).map((record: any) => ({
        type: 'giving',
        description: `Donated $${record.amount} to ${record.category}`,
        date: record.date,
        icon: '💰'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    const stats = {
      attendanceStreak: currentStreak,
      totalAttendance: attendanceRecords.length,
      totalGiving,
      communitiesCount: member.communityIds?.length || 0,
      memberSince: member.dateJoined,
      lastActivity: member.lastActivityDate,
      recentActivities,
      monthlyStats: {
        thisMonth: {
          attendance: attendanceRecords.filter((record: any) => {
            const recordDate = new Date(record.date)
            return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear()
          }).length,
          giving: givingRecords.filter((record: any) => {
            const recordDate = new Date(record.date)
            return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear()
          }).reduce((sum: number, donation: any) => sum + donation.amount, 0)
        }
      }
    }

    return createCorsResponse({
      success: true,
      data: stats
    }, 200)

  } catch (error) {
    console.error('Error fetching member stats:', error)
    return createCorsResponse(
      { error: 'Failed to fetch member stats' },
      500
    )
  }
}
