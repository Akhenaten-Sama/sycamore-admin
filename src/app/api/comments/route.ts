import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Comment } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')
    const authorId = searchParams.get('authorId')
    const isApproved = searchParams.get('isApproved')

    const query: any = {}

    if (targetType) {
      query.targetType = targetType
    }

    if (targetId) {
      query.targetId = targetId
    }

    if (authorId) {
      query.authorId = authorId
    }

    if (isApproved !== null) {
      query.isApproved = isApproved === 'true'
    }

    const comments = await Comment.find(query)
      .populate('authorId', 'firstName lastName')
      .populate('parentCommentId')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: comments,
      total: comments.length
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.content || !body.authorId || !body.targetType || !body.targetId) {
      return NextResponse.json(
        { success: false, error: 'Content, author ID, target type, and target ID are required' },
        { status: 400 }
      )
    }

    const newComment = new Comment({
      content: body.content,
      authorId: body.authorId,
      targetType: body.targetType,
      targetId: body.targetId,
      parentCommentId: body.parentCommentId,
      isApproved: body.isApproved !== undefined ? body.isApproved : false
    })

    const savedComment = await newComment.save()
    
    // Populate the saved comment
    const populatedComment = await Comment.findById(savedComment._id)
      .populate('authorId', 'firstName lastName')
      .populate('parentCommentId')

    return NextResponse.json({
      success: true,
      data: populatedComment,
      message: 'Comment posted successfully'
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
