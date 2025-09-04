import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, UserActivity, AttendanceRecord, Giving, Community, Task } from '@/lib/models'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id: memberId } = await params
    
    // Get member details
    const member = await Member.findById(memberId)
      .populate('teamId', 'name description')
      .populate('communityIds', 'name type')
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Get user activities (recent 50)
    const activities = await UserActivity.find({ userId: memberId })
      .sort({ timestamp: -1 })
      .limit(50)

    // Get attendance records
    const attendanceRecords = await AttendanceRecord.find({ memberId })
      .populate('eventId', 'name date')
      .sort({ date: -1 })

    // Calculate attendance streak
    const recentAttendance = attendanceRecords
      .filter(record => record.status === 'present')
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    let attendanceStreak = 0
    let currentDate = new Date()
    for (const record of recentAttendance) {
      const recordDate = new Date(record.date)
      const daysDiff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 7 && (attendanceStreak === 0 || daysDiff <= 14)) {
        attendanceStreak++
        currentDate = recordDate
      } else {
        break
      }
    }

    // Get giving records
    const givingRecords = await Giving.find({ memberId })
      .sort({ date: -1 })

    const totalGiving = givingRecords.reduce((sum, giving) => sum + giving.amount, 0)

    // Get communities member belongs to
    const communities = await Community.find({ members: memberId })
      .populate('leaderId', 'firstName lastName')

    // Get tasks assigned to member
    const assignedTasks = await Task.find({ assigneeId: memberId })
      .populate('teamId', 'name')
      .populate('creatorId', 'firstName lastName')

    // Get tasks completed by member
    const completedTasks = await Task.find({ 
      assigneeId: memberId, 
      status: 'completed' 
    }).countDocuments()

    // Calculate member stats
    const stats = {
      totalAttendance: attendanceRecords.filter(r => r.status === 'present').length,
      attendanceStreak,
      totalGiving,
      communitiesCount: communities.length,
      tasksAssigned: assignedTasks.length,
      tasksCompleted: completedTasks,
      joinedDate: member.dateJoined,
      lastActivity: member.lastActivityDate || new Date()
    }

    // Update member's attendance streak and total giving
    await Member.findByIdAndUpdate(memberId, {
      attendanceStreak,
      totalAttendance: stats.totalAttendance,
      totalGiving,
      lastActivityDate: new Date()
    })

    return NextResponse.json({
      success: true,
      data: {
        member,
        stats,
        activities,
        attendanceRecords: attendanceRecords.slice(0, 20), // Recent 20
        givingRecords: givingRecords.slice(0, 20), // Recent 20
        communities,
        assignedTasks
      }
    })
  } catch (error) {
    console.error('Error fetching member journey:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch member journey' },
      { status: 500 }
    )
  }
}
