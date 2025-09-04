import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Task, Team } from '@/lib/models'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
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

    const { id: teamId, taskId } = params
    const updates = await request.json()

    // Get the task
    const task = await Task.findById(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify task belongs to the team
    if (task.teamId.toString() !== teamId) {
      return NextResponse.json(
        { success: false, message: 'Task does not belong to this team' },
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

    const user = authResult.user
    const isTeamLeader = team.teamLeadId?.toString() === user.memberId?.toString()
    const isAdmin = user.role === 'super_admin' || user.role === 'admin'
    const isAssignee = task.assigneeId?.toString() === user.memberId?.toString()

    // Team leaders can update any team task, assignees can update status/notes
    if (!isTeamLeader && !isAdmin && !isAssignee) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // If user is only assignee (not team leader), limit what they can update
    if (isAssignee && !isTeamLeader && !isAdmin) {
      const allowedFields = ['status', 'notes', 'progress']
      const updateKeys = Object.keys(updates)
      const hasUnallowedFields = updateKeys.some(key => !allowedFields.includes(key))
      
      if (hasUnallowedFields) {
        return NextResponse.json(
          { success: false, message: 'You can only update status, notes, and progress' },
          { status: 403 }
        )
      }
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
      .populate('assigneeId', 'firstName lastName email')
      .populate('creatorId', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
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

    const { id: teamId, taskId } = params

    // Get the task
    const task = await Task.findById(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify task belongs to the team
    if (task.teamId.toString() !== teamId) {
      return NextResponse.json(
        { success: false, message: 'Task does not belong to this team' },
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

    const user = authResult.user
    const isTeamLeader = team.teamLeadId?.toString() === user.memberId?.toString()
    const isAdmin = user.role === 'super_admin' || user.role === 'admin'

    // Only team leaders and admins can delete tasks
    if (!isTeamLeader && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only team leaders can delete tasks.' },
        { status: 403 }
      )
    }

    await Task.findByIdAndDelete(taskId)

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
