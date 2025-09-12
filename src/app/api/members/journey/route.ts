import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member, AttendanceRecord, Giving, UserActivity, BlogPost } from '@/lib/models'

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

    // Get all activities for the journey
    const activities = []

    // Add attendance activities
    const attendanceRecords = await AttendanceRecord.find({ memberId }).sort({ date: -1 }).limit(50)
    activities.push(...attendanceRecords.map((record: any) => ({
      id: record._id,
      type: 'attendance',
      title: `Attended ${record.eventName || 'Service'}`,
      description: `You were present at the church service`,
      date: record.date,
      icon: '🙏',
      category: 'worship',
      points: 10
    })))

    // Add giving activities
    const givingRecords = await Giving.find({ memberId }).sort({ date: -1 }).limit(50)
    activities.push(...givingRecords.map((record: any) => ({
      id: record._id,
      type: 'giving',
      title: `Donation Made`,
      description: `You donated $${record.amount} to ${record.category}`,
      date: record.date,
      icon: '💰',
      category: 'stewardship',
      points: Math.floor(record.amount / 10)
    })))

    // Get activity logs if available
    try {
      const activityLogs = await UserActivity.find({ userId: memberId }).sort({ timestamp: -1 }).limit(20)
      activities.push(...activityLogs.map((log: any) => ({
        id: log._id,
        type: log.activityType,
        title: getActivityTitle(log.activityType),
        description: log.description || getActivityDescription(log.activityType),
        date: log.timestamp,
        icon: getActivityIcon(log.activityType),
        category: getActivityCategory(log.activityType),
        points: getActivityPoints(log.activityType)
      })))
    } catch (error) {
      // UserActivity might not exist, continue without it
      console.log('UserActivity not found, skipping...', error)
    }

    // Sort all activities by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate milestones
    const milestones = [
      {
        id: '1',
        title: 'Welcome to the Family',
        description: 'You joined our church community',
        date: member.dateJoined,
        achieved: true,
        icon: '🎉',
        category: 'membership'
      },
      {
        id: '2',
        title: 'First Attendance',
        description: 'Attended your first service',
        achieved: attendanceRecords.length > 0,
        date: attendanceRecords.length > 0 ? attendanceRecords[attendanceRecords.length - 1].date : null,
        icon: '⛪',
        category: 'worship'
      },
      {
        id: '3',
        title: 'Faithful Giver',
        description: 'Made your first donation',
        achieved: givingRecords.length > 0,
        date: givingRecords.length > 0 ? givingRecords[givingRecords.length - 1].date : null,
        icon: '🎁',
        category: 'stewardship'
      },
      {
        id: '4',
        title: 'Attendance Streak - 5',
        description: 'Attended 5 consecutive services',
        achieved: member.attendanceStreak >= 5,
        icon: '🔥',
        category: 'worship'
      },
      {
        id: '5',
        title: 'Community Member',
        description: 'Joined your first community',
        achieved: (member.communityIds?.length || 0) > 0,
        icon: '👥',
        category: 'community'
      }
    ]

    // Calculate journey stats
    const totalPoints = activities.reduce((sum, activity) => sum + (activity.points || 0), 0)
    const achievedMilestones = milestones.filter(m => m.achieved).length
    
    // Get growth insights
    const monthlyAttendance = getMonthlyStats(attendanceRecords, 'date')
    const monthlyGiving = getMonthlyStats(givingRecords, 'date')

    return createCorsResponse({
      success: true,
      data: {
        activities: activities.slice(0, 30), // Limit to last 30 activities
        milestones,
        stats: {
          totalPoints,
          achievedMilestones,
          totalMilestones: milestones.length,
          memberSince: member.dateJoined,
          monthlyTrends: {
            attendance: monthlyAttendance,
            giving: monthlyGiving
          }
        }
      }
    }, 200)

  } catch (error) {
    console.error('Error fetching member journey:', error)
    return createCorsResponse(
      { error: 'Failed to fetch member journey' },
      500
    )
  }
}

// Helper functions
function getActivityTitle(type: string): string {
  const titles: { [key: string]: string } = {
    login: 'Logged In',
    event_attendance: 'Event Attendance',
    team_joined: 'Joined Team',
    task_completed: 'Task Completed',
    comment_posted: 'Comment Posted',
    giving_made: 'Donation Made'
  }
  return titles[type] || 'Activity'
}

function getActivityDescription(type: string): string {
  const descriptions: { [key: string]: string } = {
    login: 'You logged into the system',
    event_attendance: 'You attended an event',
    team_joined: 'You joined a new team',
    task_completed: 'You completed an assigned task',
    comment_posted: 'You posted a comment',
    giving_made: 'You made a donation'
  }
  return descriptions[type] || 'Activity performed'
}

function getActivityIcon(type: string): string {
  const icons: { [key: string]: string } = {
    login: '🔐',
    event_attendance: '📅',
    team_joined: '👥',
    task_completed: '✅',
    comment_posted: '💬',
    giving_made: '💰'
  }
  return icons[type] || '📋'
}

function getActivityCategory(type: string): string {
  const categories: { [key: string]: string } = {
    login: 'engagement',
    event_attendance: 'worship',
    team_joined: 'community',
    task_completed: 'service',
    comment_posted: 'engagement',
    giving_made: 'stewardship'
  }
  return categories[type] || 'general'
}

function getActivityPoints(type: string): number {
  const points: { [key: string]: number } = {
    login: 1,
    event_attendance: 10,
    team_joined: 25,
    task_completed: 15,
    comment_posted: 5,
    giving_made: 20
  }
  return points[type] || 5
}

function getMonthlyStats(records: any[], dateField: string) {
  const stats: { [key: string]: number } = {}
  const currentDate = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const monthKey = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    stats[monthKey] = 0
  }
  
  records.forEach((record: any) => {
    const recordDate = new Date(record[dateField])
    const monthKey = recordDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (stats.hasOwnProperty(monthKey)) {
      stats[monthKey] = (stats[monthKey] || 0) + 1
    }
  })
  
  return Object.keys(stats).map(month => ({
    month,
    count: stats[month]
  }))
}
