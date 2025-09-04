import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, Member, Event, Task, AttendanceRecord, Giving, IMember } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyMobileToken(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user')
    }
    
    return { user, member: user.memberId }
  } catch (error) {
    throw new Error('Invalid token')
  }
}

async function calculateAttendanceStreak(memberId: string) {
  try {
    const attendances = await AttendanceRecord.find({ 
      memberId,
      status: 'present' 
    }).sort({ date: -1 }).limit(50)
    
    if (attendances.length === 0) return 0
    
    let streak = 0
    let currentDate = new Date()
    
    for (const attendance of attendances) {
      const diffDays = Math.floor((currentDate.getTime() - attendance.date.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 7 * (streak + 1)) { // Within the week
        streak++
      } else {
        break
      }
    }
    
    return streak
  } catch (error) {
    console.error('Error calculating attendance streak:', error)
    return 0
  }
}

async function getTotalAttendance(memberId: string) {
  try {
    return await AttendanceRecord.countDocuments({ memberId, status: 'present' })
  } catch (error) {
    console.error('Error getting total attendance:', error)
    return 0
  }
}

async function getTotalGiving(memberId: string) {
  try {
    const result = await Giving.aggregate([
      { $match: { memberId: memberId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    return result.length > 0 ? result[0].total : 0
  } catch (error) {
    console.error('Error getting total giving:', error)
    return 0
  }
}

async function getUserTasksCount(memberId: string, status?: string) {
  try {
    const query: any = { 
      $or: [
        { assignedTo: memberId },
        { createdBy: memberId }
      ]
    }
    
    if (status === 'completed') {
      query.status = 'completed'
    } else if (status === 'assigned') {
      query.status = { $in: ['pending', 'in_progress'] }
    }
    
    return await Task.countDocuments(query)
  } catch (error) {
    console.error('Error getting user tasks count:', error)
    return 0
  }
}

async function getRecentActivities(memberId: string) {
  try {
    interface Activity {
      type: string
      title: string
      date: Date
      icon: string
    }
    
    const activities: Activity[] = []
    
    // Recent attendance
    const recentAttendance = await AttendanceRecord.find({ 
      memberId, 
      status: 'present' 
    })
    .sort({ date: -1 })
    .limit(3)
    .populate('eventId', 'name')
    
    recentAttendance.forEach((attendance: any) => {
      activities.push({
        type: 'attendance',
        title: `Attended ${attendance.eventId?.name || 'Event'}`,
        date: attendance.date,
        icon: 'calendar'
      })
    })
    
    // Recent tasks
    const recentTasks = await Task.find({
      $or: [
        { assigneeId: memberId },
        { creatorId: memberId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(3)
    
    recentTasks.forEach(task => {
      activities.push({
        type: 'task',
        title: task.status === 'completed' ? `Completed: ${task.title}` : `Assigned: ${task.title}`,
        date: new Date(), // Use current date since createdAt might not be available
        icon: task.status === 'completed' ? 'check-circle' : 'clock'
      })
    })
    
    // Recent giving
    const recentGiving = await Giving.find({ memberId })
    .sort({ date: -1 })
    .limit(2)
    
    recentGiving.forEach(giving => {
      activities.push({
        type: 'giving',
        title: `Giving: $${giving.amount}`,
        date: giving.date,
        icon: 'heart'
      })
    })
    
    // Sort by date and return most recent
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
  } catch (error) {
    console.error('Error getting recent activities:', error)
    return []
  }
}

async function getUpcomingEvents(memberId: string) {
  try {
    const upcomingEvents = await Event.find({
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .limit(5)
    .select('name description date endDate location')
    
    return upcomingEvents.map(event => ({
      id: event._id,
      title: event.name,
      description: event.description,
      startDate: event.date,
      endDate: event.endDate,
      location: event.location
    }))
    
  } catch (error) {
    console.error('Error getting upcoming events:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, member } = await verifyMobileToken(request)
    
    if (!member) {
      return NextResponse.json(
        { message: 'Member profile not found' },
        { status: 404 }
      )
    }

    const memberData = member as any as IMember
    const memberId = (memberData._id as any).toString()

    // Aggregate user statistics
    const [
      attendanceStreak,
      totalAttendance, 
      totalGiving,
      tasksAssigned,
      tasksCompleted,
      recentActivities,
      upcomingEvents
    ] = await Promise.all([
      calculateAttendanceStreak(memberId),
      getTotalAttendance(memberId),
      getTotalGiving(memberId),
      getUserTasksCount(memberId, 'assigned'),
      getUserTasksCount(memberId, 'completed'),
      getRecentActivities(memberId),
      getUpcomingEvents(memberId)
    ])

    const stats = {
      attendanceStreak,
      totalAttendance,
      totalGiving,
      communitiesCount: memberData.communityIds?.length || 0,
      tasksAssigned,
      tasksCompleted
    }

    // Update member stats in database
    await Member.findByIdAndUpdate(memberId, {
      attendanceStreak,
      totalAttendance,
      totalGiving,
      lastActivityDate: new Date()
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: memberData.avatar,
          isFirstTimer: memberData.isFirstTimer
        },
        stats,
        recentActivities,
        upcomingEvents
      }
    })

  } catch (error) {
    console.error('Mobile journey error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Failed to fetch user journey data' },
      { status: 500 }
    )
  }
}
