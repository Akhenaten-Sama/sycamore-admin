import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, AttendanceRecord, Giving } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const { id: memberId } = await params

    if (type === 'stats') {
      // Get member stats
      const member = await Member.findById(memberId)
      if (!member) {
        return NextResponse.json(
          { message: 'Member not found' },
          { status: 404 }
        )
      }

      // Calculate stats
      const totalAttendance = await AttendanceRecord.countDocuments({ memberId })
      const totalGiving = await Giving.aggregate([
        { $match: { memberId: memberId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])

      // Get recent activity
      const recentAttendance = await AttendanceRecord.find({ memberId })
        .sort({ date: -1 })
        .limit(10)
        .populate('eventId', 'name date')

      const recentGiving = await Giving.find({ memberId })
        .sort({ date: -1 })
        .limit(10)

      // Calculate attendance streak
      let attendanceStreak = 0
      const recentEvents = await AttendanceRecord.find({ memberId })
        .sort({ date: -1 })
        .limit(20)

      // Simple streak calculation (consecutive weeks)
      for (let i = 0; i < recentEvents.length; i++) {
        const event = recentEvents[i]
        const eventDate = new Date(event.date)
        const weeksSinceEvent = Math.floor((Date.now() - eventDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        
        if (weeksSinceEvent === i) {
          attendanceStreak++
        } else {
          break
        }
      }

      const stats = {
        attendanceStreak,
        totalAttendance,
        totalGiving: totalGiving[0]?.total || 0,
        communitiesCount: member.communityIds?.length || 0,
        recentActivity: [
          ...recentAttendance.map(att => ({
            type: 'attendance',
            date: att.date,
            description: `Attended ${att.eventId?.name || 'Event'}`,
            details: att.eventId
          })),
          ...recentGiving.map(give => ({
            type: 'giving',
            date: give.date,
            description: `Donated $${give.amount} for ${give.purpose}`,
            details: { amount: give.amount, purpose: give.purpose }
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
      }

      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    if (type === 'activity') {
      // Get member activity/journey
      const activities = await AttendanceRecord.find({ memberId })
        .populate('eventId', 'name date type')
        .sort({ date: -1 })
        .limit(50)

      const journey = activities.map(activity => ({
        date: activity.date,
        type: 'attendance',
        title: activity.eventId?.name || 'Church Event',
        description: `Attended ${activity.eventId?.type || 'service'}`,
        status: activity.status || 'present'
      }))

      return NextResponse.json({
        success: true,
        data: journey
      })
    }

    return NextResponse.json(
      { message: 'Invalid type parameter' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error fetching member data:', error)
    return NextResponse.json(
      { message: 'Failed to fetch member data' },
      { status: 500 }
    )
  }
}
