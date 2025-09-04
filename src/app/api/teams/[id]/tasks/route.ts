import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import { Task, Team, Member } from '../../../../../lib/models'
import { verifyToken } from '../../../../../lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: teamId } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')

    // Check if user has access to this team
    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, message: 'Team not found' },
        { status: 404 }
      )
    }

    // Only team leaders or admins can access team tasks
    const user = authResult.user
    console.log('GET tasks - User:', user.email, 'teamLeadId:', team.teamLeadId)
    
    // Find the member by email to get the correct _id
    const member = await Member.findOne({ email: user.email })
    console.log('GET tasks - Found member:', member?._id, 'for email:', user.email)
    
    const isTeamLeader = team.teamLeadId?.toString() === member?._id?.toString()
    const isAdmin = user.role === 'super_admin' || user.role === 'admin'
    
    console.log('GET tasks - isTeamLeader:', isTeamLeader, 'isAdmin:', isAdmin)

    if (!isTeamLeader && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only team leaders can view team tasks.' },
        { status: 403 }
      )
    }

    // Build query for team tasks
    const query: any = { teamId }
    if (status) query.status = status
    if (assigneeId) query.assigneeId = assigneeId

    // Get tasks for this team
    const tasks = await Task.find(query)
      .populate('assigneeId', 'firstName lastName email')
      .populate('creatorId', 'firstName lastName email')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: tasks,
      team: {
        id: team._id,
        name: team.name,
        description: team.description
      }
    })
  } catch (error) {
    console.error('Error fetching team tasks:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: teamId } = params
    const {
      title,
      description,
      assigneeId,
      dueDate,
      priority = 'medium'
    } = await request.json()

    if (!title || !assigneeId) {
      return NextResponse.json(
        { success: false, message: 'Title and assignee are required' },
        { status: 400 }
      )
    }

    // Check if user has access to this team
    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, message: 'Team not found' },
        { status: 404 }
      )
    }

    // Only team leaders can create tasks for their team
    const user = authResult.user
    console.log('🔍 Task creation - User:', user.email, 'Role:', user.role)
    console.log('🔍 Task creation - Team:', team.name, 'TeamLeadId:', team.teamLeadId)
    
    // Find the member record by email to get the correct member ID
    const member = await Member.findOne({ email: user.email })
    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Member record not found' },
        { status: 403 }
      )
    }
    
    console.log('👤 Task creation - Found member:', member.firstName, member.lastName, 'ID:', member._id)
    
    const isTeamLeader = team.teamLeadId?.toString() === member._id?.toString()
    const isAdmin = user.role === 'super_admin' || user.role === 'admin'
    
    console.log('🔐 Task creation - isTeamLeader:', isTeamLeader, 'isAdmin:', isAdmin)

    if (!isTeamLeader && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only team leaders can create tasks.' },
        { status: 403 }
      )
    }

    // Verify assignee is a team member
    const assignee = await Member.findById(assigneeId)
    if (!assignee) {
      return NextResponse.json(
        { success: false, message: 'Assignee not found' },
        { status: 404 }
      )
    }

    // Check if assignee is part of the team
    if (!team.members.includes(assigneeId)) {
      return NextResponse.json(
        { success: false, message: 'Assignee is not a member of this team' },
        { status: 400 }
      )
    }

    // Create the task
    const task = new Task({
      title,
      description,
      teamId,
      assigneeId,
      creatorId: member._id, // Use the member._id as creatorId
      expectedDeliveryDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      status: 'open', // Use valid status value
      isPublic: false, // Team tasks are private to the team
    })

    await task.save()

    // Populate and return the created task
    const populatedTask = await Task.findById(task._id)
      .populate('assigneeId', 'firstName lastName email')
      .populate('creatorId', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: 'Task created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team task:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
