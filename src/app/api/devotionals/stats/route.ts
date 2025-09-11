import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

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

    // Mock devotional reading data - in production, this would come from database
    const today = new Date()
    const thisMonth = today.getMonth()
    const thisYear = today.getFullYear()
    
    // Generate mock reading streak data
    const currentStreak = 7 // Mock current reading streak
    const longestStreak = 21 // Mock longest streak
    const totalDaysRead = 156 // Mock total days read
    
    // Generate monthly reading data for the last 6 months
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(thisYear, thisMonth - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const year = date.getFullYear().toString().slice(-2)
      
      // Mock reading data (in production, query actual reading records)
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      const daysRead = Math.floor(Math.random() * (daysInMonth - 15) + 15) // Random between 15-28 days
      
      monthlyData.push({
        month: `${monthName} '${year}`,
        daysRead,
        daysInMonth,
        percentage: Math.round((daysRead / daysInMonth) * 100)
      })
    }

    // Weekly reading pattern (last 7 days)
    const weeklyPattern = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayName = days[date.getDay()]
      const wasRead = Math.random() > 0.3 // 70% chance of reading
      
      weeklyPattern.push({
        day: dayName,
        date: date.toISOString().split('T')[0],
        read: wasRead,
        streak: wasRead
      })
    }

    // Reading categories/topics most engaged with
    const topTopics = [
      { topic: 'Faith', count: 45, percentage: 28 },
      { topic: 'Love', count: 32, percentage: 20 },
      { topic: 'Hope', count: 28, percentage: 18 },
      { topic: 'Prayer', count: 24, percentage: 15 },
      { topic: 'Gratitude', count: 19, percentage: 12 },
      { topic: 'Forgiveness', count: 11, percentage: 7 }
    ]

    // Recent milestones
    const milestones = [
      {
        id: '1',
        title: '7-Day Streak',
        description: 'You\'ve read devotionals for 7 consecutive days!',
        achievedDate: new Date(Date.now() - 86400000), // Yesterday
        icon: '🔥',
        type: 'streak'
      },
      {
        id: '2',
        title: 'Monthly Reader',
        description: 'You completed your first month of daily devotionals!',
        achievedDate: new Date(Date.now() - 2592000000), // 30 days ago
        icon: '📚',
        type: 'milestone'
      },
      {
        id: '3',
        title: 'Faith Explorer',
        description: 'You\'ve explored 20 different topics in devotionals',
        achievedDate: new Date(Date.now() - 1209600000), // 14 days ago
        icon: '🗺️',
        type: 'exploration'
      }
    ]

    const stats = {
      currentStreak,
      longestStreak,
      totalDaysRead,
      monthlyData,
      weeklyPattern,
      topTopics,
      milestones,
      summary: {
        averageMonthlyReading: Math.round(monthlyData.reduce((sum, month) => sum + month.percentage, 0) / monthlyData.length),
        totalMilestones: milestones.length,
        favoriteTime: 'Morning', // Mock data
        averageReadingTime: 4, // minutes
        consecutiveDaysThisMonth: currentStreak,
        completionRate: 87 // percentage
      }
    }

    return createCorsResponse({
      success: true,
      data: stats
    }, 200)

  } catch (error) {
    console.error('Error fetching devotional stats:', error)
    return createCorsResponse(
      { error: 'Failed to fetch devotional stats' },
      500
    )
  }
}
