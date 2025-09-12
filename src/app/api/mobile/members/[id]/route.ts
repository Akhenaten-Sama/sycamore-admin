import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, AttendanceRecord, Giving } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

      const memberDoc = member as any

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
        communitiesCount: memberDoc.communityIds?.length || 0,
        recentActivity: [
          ...recentAttendance.map(att => {
            const attendanceDoc = att as any
            const eventDoc = attendanceDoc.eventId as any
            return {
              type: 'attendance',
              date: attendanceDoc.date,
              description: `Attended ${eventDoc?.name || 'Event'}`,
              details: eventDoc
            }
          }),
          ...recentGiving.map(give => {
            const givingDoc = give as any
            return {
              type: 'giving',
              date: givingDoc.date,
              description: `Donated $${givingDoc.amount} for ${givingDoc.purpose}`,
              details: { amount: givingDoc.amount, purpose: givingDoc.purpose }
            }
          })
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

      const journey = activities.map(activity => {
        const activityDoc = activity as any
        const eventDoc = activityDoc.eventId as any
        return {
          date: activityDoc.date,
          type: 'attendance',
          title: eventDoc?.name || 'Church Event',
          description: `Attended ${eventDoc?.type || 'service'}`,
          status: activityDoc.status || 'present'
        }
      })

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
