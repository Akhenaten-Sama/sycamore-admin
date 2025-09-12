import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Member, Task } from '@/lib/models'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id: memberId } = await params

    console.log('📋 Member tasks request for ID:', memberId)

    // Get member
    const member = await Member.findById(memberId)
    if (!member) {
      console.log('❌ Member not found in database')
      return createCorsResponse(
        { message: 'Member not found' },
        404
      )
    }

    const memberDoc = member as any

    // Check if Task model exists, if not create mock tasks
    let tasks = []
    try {
      // Try to get real tasks from database
      tasks = await Task.find({ 
        $or: [
          { assignedTo: memberId },
          { teamId: memberDoc.teamId }
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
      pending: tasks.filter(t => (t as any).status === 'pending'),
      inProgress: tasks.filter(t => (t as any).status === 'in_progress'),
      completed: tasks.filter(t => (t as any).status === 'completed'),
      overdue: tasks.filter(t => {
        const task = t as any
        return task.status !== 'completed' && 
               task.dueDate && 
               new Date(task.dueDate) < new Date()
      })
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

    return createCorsResponse({
      success: true,
      data: {
        tasks: categorizedTasks,
        stats,
        allTasks: tasks
      }
    }, 200)

  } catch (error) {
    console.error('Error fetching member tasks:', error)
    return createCorsResponse(
      { message: 'Failed to fetch member tasks' },
      500
    )
  }
}
