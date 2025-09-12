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

    console.log('📊 Member stats request for ID:', memberId)

    // Get member stats
    const member = await Member.findById(memberId)
    console.log('👤 Member found:', member ? 'YES' : 'NO')
    
    if (!member) {
      console.log('❌ Member not found in database')
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // Use existing member data for basic stats
    const attendanceStreak = member.attendanceStreak || 0
    const totalAttendance = member.totalAttendance || await AttendanceRecord.countDocuments({ memberId })
    const totalGiving = member.totalGiving || (await Giving.aggregate([
      { $match: { memberId: memberId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]))[0]?.total || 0

    // Calculate devotional streak based on recent activity
    // For now, simulate based on how recently they've been active
    let devotionalStreak = 0
    if (member.lastActivityDate) {
      const daysSinceActivity = Math.floor((Date.now() - new Date(member.lastActivityDate).getTime()) / (24 * 60 * 60 * 1000))
      if (daysSinceActivity <= 7) {
        // If active within last week, give them a devotional streak
        devotionalStreak = Math.min(15 - daysSinceActivity, 15) // Max 15 days
      }
    }

    // Get recent activity for the activity feed (if needed)
    const recentAttendance = await AttendanceRecord.find({ memberId })
      .sort({ date: -1 })
      .limit(10)
      .populate('eventId', 'name date')

    const recentGiving = await Giving.find({ memberId })
      .sort({ date: -1 })
      .limit(10)

    const stats = {
      attendanceStreak,
      devotionalStreak,
      totalAttendance,
      totalDonations: totalGiving,
      tasksCompleted: 0, // TODO: Implement tasks system
      communitiesJoined: member.communityIds?.length || 0,
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching member stats:', error)
    return NextResponse.json(
      { message: 'Failed to fetch member stats' },
      { status: 500 }
    )
  }
}
