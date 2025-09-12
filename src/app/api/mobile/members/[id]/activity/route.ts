import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, AttendanceRecord, Giving } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id: memberId } = await params

    console.log('📱 Member activity request for ID:', memberId)

    // Get member
    const member = await Member.findById(memberId)
    if (!member) {
      console.log('❌ Member not found in database')
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // Get member activity/journey
    const attendanceActivities = await AttendanceRecord.find({ memberId })
      .populate('eventId', 'name date type location')
      .sort({ date: -1 })
      .limit(50)

    const givingActivities = await Giving.find({ memberId })
      .sort({ date: -1 })
      .limit(20)

    // Create combined activity timeline
    const activities = [
      ...attendanceActivities.map(activity => ({
        date: activity.date,
        type: 'attendance',
        title: (activity.eventId as any)?.name || 'Church Event',
        description: `Attended ${(activity.eventId as any)?.type || 'service'} at ${(activity.eventId as any)?.location || 'Church'}`,
        status: activity.status || 'present',
        icon: '⛪',
        details: {
          eventType: (activity.eventId as any)?.type,
          location: (activity.eventId as any)?.location,
          status: activity.status
        }
      })),
      ...givingActivities.map(activity => ({
        date: activity.date,
        type: 'giving',
        title: 'Made a Donation',
        description: `Donated $${activity.amount} for ${activity.category}`,
        status: 'completed',
        icon: '💝',
        details: {
          amount: activity.amount,
          category: activity.category,
          method: activity.method,
          description: activity.description
        }
      }))
    ]

    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Limit to most recent 30 activities
    const recentActivities = activities.slice(0, 30)

    // Calculate activity stats
    const stats = {
      totalActivities: activities.length,
      attendanceCount: attendanceActivities.length,
      givingCount: givingActivities.length,
      thisMonthActivities: activities.filter(a => {
        const activityDate = new Date(a.date)
        const now = new Date()
        return activityDate.getMonth() === now.getMonth() && 
               activityDate.getFullYear() === now.getFullYear()
      }).length
    }

    console.log('✅ Member activity loaded successfully')

    return NextResponse.json({
      success: true,
      data: {
        activities: recentActivities,
        stats
      }
    })

  } catch (error) {
    console.error('Error fetching member activity:', error)
    return NextResponse.json(
      { message: 'Failed to fetch member activity' },
      { status: 500 }
    )
  }
}
