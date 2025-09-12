import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Task, Member, Team } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    const task = await Task.findById(id)
      .populate('teamId', 'name description')
      .populate('assigneeId', 'firstName lastName email')
      .populate('creatorId', 'firstName lastName email')

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id } = await params
    
    const task = await Task.findById(id)
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Validate permissions - only creator, assignee, team leader, or admin can update
    if (body.updatedBy) {
      const updater = await Member.findById(body.updatedBy)
      const team = await Team.findById(task.teamId)
      
      const canUpdate = updater?.isAdmin || 
                       task.creatorId.toString() === body.updatedBy ||
                       task.assigneeId?.toString() === body.updatedBy ||
                       team?.teamLeadId.toString() === body.updatedBy

      if (!canUpdate) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to update task' },
          { status: 403 }
        )
      }
    }

    // Update task fields
    const updateData: any = {}
    if (body.title) updateData.title = body.title
    if (body.description) updateData.description = body.description
    if (body.status) updateData.status = body.status
    if (body.priority) updateData.priority = body.priority
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId
    if (body.expectedDeliveryDate) updateData.expectedDeliveryDate = new Date(body.expectedDeliveryDate)
    if (body.tags) updateData.tags = body.tags
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('teamId', 'name description')
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
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    const task = await Task.findById(id)
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check permissions - only creator, team leader, or admin can delete
    const { searchParams } = new URL(request.url)
    const deletedBy = searchParams.get('deletedBy')
    
    if (deletedBy) {
      const deleter = await Member.findById(deletedBy)
      const team = await Team.findById(task.teamId)
      
      const canDelete = deleter?.isAdmin || 
                       task.creatorId.toString() === deletedBy ||
                       team?.teamLeadId.toString() === deletedBy

      if (!canDelete) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to delete task' },
          { status: 403 }
        )
      }
    }

    await Task.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
