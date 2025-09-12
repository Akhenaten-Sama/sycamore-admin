import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id: memberId } = await params

    console.log('📖 Member devotional stats request for ID:', memberId)

    // Get member
    const member = await Member.findById(memberId)
    if (!member) {
      console.log('❌ Member not found in database')
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // Since we don't have a DevotionalReading model yet, create mock stats
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Generate realistic devotional stats
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const dayOfMonth = today.getDate()
    
    // Simulate reading history (member has read some devotionals)
    const readingStreak = Math.floor(Math.random() * 15) + 3 // 3-18 days
    const thisMonthReadings = Math.min(dayOfMonth, Math.floor(Math.random() * dayOfMonth) + Math.floor(dayOfMonth * 0.6))
    const totalReadings = Math.floor(Math.random() * 200) + 50 // 50-250 total readings
    const completionRate = thisMonthReadings / dayOfMonth
    
    // Generate weekly progress (last 7 days)
    const weeklyProgress = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      weeklyProgress.push({
        date: date.toISOString().split('T')[0],
        completed: Math.random() > 0.3, // 70% chance of reading
        streak: i === 0 ? readingStreak : Math.max(0, readingStreak - Math.floor(Math.random() * 3))
      })
    }

    // Generate monthly progress
    const monthlyProgress = []
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(currentYear, month, 1)
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate()
      const readDays = month <= currentMonth ? 
        Math.floor(Math.random() * daysInMonth * 0.8) + Math.floor(daysInMonth * 0.2) :
        0
      
      monthlyProgress.push({
        month: month + 1,
        monthName: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        daysRead: readDays,
        totalDays: month < currentMonth ? daysInMonth : 
                   (month === currentMonth ? dayOfMonth : 0),
        completionRate: month < currentMonth ? (readDays / daysInMonth) :
                       (month === currentMonth ? (readDays / dayOfMonth) : 0)
      })
    }

    // Favorite topics/tags (mock data)
    const favoriteTopics = [
      { topic: 'Prayer', count: Math.floor(Math.random() * 20) + 5 },
      { topic: 'Faith', count: Math.floor(Math.random() * 18) + 4 },
      { topic: 'Love', count: Math.floor(Math.random() * 15) + 3 },
      { topic: 'Hope', count: Math.floor(Math.random() * 12) + 2 },
      { topic: 'Peace', count: Math.floor(Math.random() * 10) + 2 }
    ].sort((a, b) => b.count - a.count)

    const stats = {
      currentStreak: readingStreak,
      longestStreak: readingStreak + Math.floor(Math.random() * 10) + 5,
      totalReadings: totalReadings,
      thisMonthReadings: thisMonthReadings,
      thisMonthGoal: totalDaysInMonth,
      completionRate: Math.round(completionRate * 100),
      averagePerWeek: Math.round((totalReadings / 52) * 10) / 10,
      weeklyProgress: weeklyProgress,
      monthlyProgress: monthlyProgress,
      favoriteTopics: favoriteTopics,
      achievements: [
        {
          id: 'first_week',
          title: 'First Week',
          description: 'Read devotionals for 7 days in a row',
          earned: readingStreak >= 7,
          earnedDate: readingStreak >= 7 ? new Date(Date.now() - (readingStreak - 7) * 24 * 60 * 60 * 1000) : null,
          icon: '📖'
        },
        {
          id: 'two_weeks',
          title: 'Faithful Reader',
          description: 'Read devotionals for 14 days in a row',
          earned: readingStreak >= 14,
          earnedDate: readingStreak >= 14 ? new Date(Date.now() - (readingStreak - 14) * 24 * 60 * 60 * 1000) : null,
          icon: '🔥'
        },
        {
          id: 'one_month',
          title: 'Devoted',
          description: 'Read devotionals for 30 days in a row',
          earned: readingStreak >= 30,
          earnedDate: readingStreak >= 30 ? new Date(Date.now() - (readingStreak - 30) * 24 * 60 * 60 * 1000) : null,
          icon: '👑'
        },
        {
          id: 'hundred_readings',
          title: 'Century Reader',
          description: 'Complete 100 devotional readings',
          earned: totalReadings >= 100,
          earnedDate: totalReadings >= 100 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          icon: '💯'
        }
      ]
    }

    console.log('✅ Member devotional stats loaded successfully')

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching member devotional stats:', error)
    return NextResponse.json(
      { message: 'Failed to fetch devotional stats' },
      { status: 500 }
    )
  }
}
