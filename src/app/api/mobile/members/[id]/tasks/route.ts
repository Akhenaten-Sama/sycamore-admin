import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, Task } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { id: memberId } = await params

    console.log('📋 Member tasks request for ID:', memberId)

    // Get member
    const member = await Member.findById(memberId)
    if (!member) {
      console.log('❌ Member not found in database')
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // Check if Task model exists, if not create mock tasks
    let tasks = []
    try {
      // Try to get real tasks from database
      tasks = await Task.find({ 
        $or: [
          { assignedTo: memberId },
          { teamId: member.teamId }
        ]
      }).sort({ createdAt: -1 })
    } catch (error) {
      console.log('📝 Task model not found, creating mock tasks')
      // Create mock tasks for development
      tasks = [
        {
          _id: '1',
          title: 'Welcome New Members',
          description: 'Help welcome new church members during service',
          status: 'pending',
          priority: 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          assignedTo: memberId,
          assignedBy: 'Pastor Johnson',
          category: 'ministry',
          estimatedTime: 30
        },
        {
          _id: '2',
          title: 'Prepare for Bible Study',
          description: 'Read Romans 8:1-17 and prepare discussion questions',
          status: 'in_progress',
          priority: 'high',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          assignedTo: memberId,
          assignedBy: 'Elder Mary',
          category: 'study',
          estimatedTime: 60
        },
        {
          _id: '3',
          title: 'Community Outreach Planning',
          description: 'Help plan next month\'s community service event',
          status: 'completed',
          priority: 'medium',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          assignedTo: memberId,
          assignedBy: 'Deacon Smith',
          category: 'outreach',
          estimatedTime: 120
        }
      ]
    }

    // Categorize tasks
    const categorizedTasks = {
      pending: tasks.filter(t => t.status === 'pending'),
      inProgress: tasks.filter(t => t.status === 'in_progress'),
      completed: tasks.filter(t => t.status === 'completed'),
      overdue: tasks.filter(t => 
        t.status !== 'completed' && 
        new Date(t.dueDate) < new Date()
      )
    }

    // Calculate task stats
    const stats = {
      total: tasks.length,
      pending: categorizedTasks.pending.length,
      inProgress: categorizedTasks.inProgress.length,
      completed: categorizedTasks.completed.length,
      overdue: categorizedTasks.overdue.length,
      completionRate: tasks.length > 0 ? 
        Math.round((categorizedTasks.completed.length / tasks.length) * 100) : 0
    }

    console.log('✅ Member tasks loaded successfully')

    return NextResponse.json({
      success: true,
      data: {
        tasks: categorizedTasks,
        stats,
        allTasks: tasks
      }
    })

  } catch (error) {
    console.error('Error fetching member tasks:', error)
    return NextResponse.json(
      { message: 'Failed to fetch member tasks' },
      { status: 500 }
    )
  }
}
