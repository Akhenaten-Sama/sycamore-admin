import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member, AttendanceRecord, Giving, Community } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: memberId } = await params

    // Get member data
    const member = await Member.findById(memberId).populate('communityIds')
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
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
        achieved: (member as any).attendanceStreak >= 5,
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
      },
      {
        id: '6',
        title: 'Generous Heart',
        description: 'Total giving exceeds $100',
        achieved: givingRecords.reduce((total: number, record: any) => total + record.amount, 0) >= 100,
        icon: '❤️',
        category: 'stewardship'
      }
    ]

    // Calculate journey stats
    const journeyStats = {
      totalActivities: activities.length,
      totalMilestones: milestones.length,
      achievedMilestones: milestones.filter(m => m.achieved).length,
      attendanceCount: attendanceRecords.length,
      givingTotal: givingRecords.reduce((total: number, record: any) => total + record.amount, 0),
      communityCount: member.communityIds?.length || 0,
      attendanceStreak: (member as any).attendanceStreak || 0,
      devotionalStreak: (member as any).devotionalStreak || 0,
      joinDate: member.dateJoined,
      membershipDays: Math.floor((new Date().getTime() - new Date(member.dateJoined).getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      activities: activities.slice(0, 20), // Return most recent 20 activities
      milestones,
      stats: journeyStats,
      member: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        profilePicture: (member as any).profilePicture,
        dateJoined: member.dateJoined,
      }
    })

  } catch (error) {
    console.error('Error fetching member journey:', error)
    return NextResponse.json({ error: 'Failed to fetch member journey' }, { status: 500 })
  }
}
