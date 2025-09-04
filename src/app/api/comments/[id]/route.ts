import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Comment } from '@/lib/models'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const comment = await Comment.findById(id)
      .populate('authorId', 'firstName lastName')
      .populate('parentCommentId')
    
    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: comment
    })
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    
    const comment = await Comment.findById(id)
    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Update comment fields
    if (body.content) comment.content = body.content
    if (body.isApproved !== undefined) comment.isApproved = body.isApproved

    const updatedComment = await comment.save()
    
    // Populate the updated comment
    const populatedComment = await Comment.findById(updatedComment._id)
      .populate('authorId', 'firstName lastName')
      .populate('parentCommentId')

    return NextResponse.json({
      success: true,
      data: populatedComment,
      message: 'Comment updated successfully'
    })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    
    // Delete the comment and any child comments
    await Comment.deleteMany({
      $or: [
        { _id: id },
        { parentCommentId: id }
      ]
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
