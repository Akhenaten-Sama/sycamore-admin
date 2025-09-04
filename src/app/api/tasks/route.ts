import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Task, Member, Team } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const assigneeId = searchParams.get('assigneeId')
    const status = searchParams.get('status')
    const isPublic = searchParams.get('isPublic')
    const search = searchParams.get('search')

    const query: any = {}

    if (teamId) query.teamId = teamId
    if (assigneeId) query.assigneeId = assigneeId
    if (status) query.status = status
    if (isPublic) query.isPublic = isPublic === 'true'

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const tasks = await Task.find(query)
      .populate('teamId', 'name description')
      .populate('assigneeId', 'firstName lastName email')
      .populate('creatorId', 'firstName lastName email')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: tasks,
      total: tasks.length
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.description || !body.teamId || !body.creatorId) {
      return NextResponse.json(
        { success: false, error: 'Title, description, team ID, and creator ID are required' },
        { status: 400 }
      )
    }

    // Verify team exists and creator is team leader or admin
    const team = await Team.findById(body.teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const creator = await Member.findById(body.creatorId)
    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Check if creator is team leader or admin
    if (!creator.isAdmin && team.teamLeadId.toString() !== body.creatorId) {
      return NextResponse.json(
        { success: false, error: 'Only team leaders and admins can create tasks' },
        { status: 403 }
      )
    }

    const newTask = new Task({
      title: body.title,
      description: body.description,
      teamId: body.teamId,
      assigneeId: body.assigneeId,
      creatorId: body.creatorId,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : undefined,
      tags: body.tags || [],
      isPublic: body.isPublic || false
    })

    const savedTask = await newTask.save()
    
    // Populate the saved task
    const populatedTask = await Task.findById(savedTask._id)
      .populate('teamId', 'name description')
      .populate('assigneeId', 'firstName lastName email')
      .populate('creatorId', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: 'Task created successfully'
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
