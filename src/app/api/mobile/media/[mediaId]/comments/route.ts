import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'
import mongoose from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Get Comment model with media support - enhanced cache clearing
function getCommentModel() {
  // Clear all mongoose models to force fresh compilation
  Object.keys(mongoose.models).forEach(modelName => {
    if (modelName === 'Comment') {
      delete mongoose.models[modelName]
    }
  })
  
  // Clear mongoose connection models cache
  if (mongoose.connection && mongoose.connection.models) {
    delete (mongoose.connection.models as any).Comment
  }
  
  // Create the Comment schema with media support
  const commentSchema = new mongoose.Schema({
    content: { type: String, required: true, trim: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    targetType: { 
      type: String, 
      enum: ['event', 'blog', 'gallery', 'announcement', 'community_post', 'media'], 
      required: true,
      validate: {
        validator: function(v: string) {
          return ['event', 'blog', 'gallery', 'announcement', 'community_post', 'media'].includes(v)
        },
        message: 'targetType must be one of: event, blog, gallery, announcement, community_post, media'
      }
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    isApproved: { type: Boolean, default: false }
  }, {
    timestamps: true,
    collection: 'comments'
  })
  
  // Add an index for better query performance
  commentSchema.index({ targetId: 1, targetType: 1 })
  commentSchema.index({ createdAt: -1 })
  
  const CommentModel = mongoose.model('Comment', commentSchema)
  
  console.log('✅ Comment model created/recreated with schema:', (commentSchema.paths.targetType as any).enumValues)
  
  return CommentModel
}

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

// GET - Fetch comments for a media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    await connectDB()
    
    const { mediaId } = await params

    const Comment = getCommentModel()

    // Get comments for this media item
    const comments = await Comment.find({
      targetType: 'media',
      targetId: mediaId,
      isApproved: true
    })
    .populate('authorId', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(50)

    return NextResponse.json({
      success: true,
      data: comments.map((comment: any) => ({
        id: comment._id,
        content: comment.content,
        author: `${comment.authorId.firstName} ${comment.authorId.lastName}`,
        avatar: comment.authorId.profilePicture || `https://ui-avatars.io/api/?name=${comment.authorId.firstName}+${comment.authorId.lastName}`,
        timestamp: comment.createdAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error fetching media comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST - Add a comment to a media item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    await connectDB()

    // Verify user authentication
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { mediaId } = await params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Comment is too long (max 500 characters)' },
        { status: 400 }
      )
    }

    const Comment = getCommentModel()

    console.log('📝 Creating comment with data:', {
      content: content.trim(),
      authorId: user.userId || user.id,
      targetType: 'media',
      targetId: mediaId,
      isApproved: true
    })

    // Create new comment
    const newComment = new Comment({
      content: content.trim(),
      authorId: user.userId || user.id,
      targetType: 'media',
      targetId: mediaId,
      isApproved: true // Auto-approve for now, can add moderation later
    })

    console.log('💾 Saving comment...')
    await newComment.save()
    console.log('✅ Comment saved successfully')
    
    console.log('👤 Populating author info...')
    await newComment.populate('authorId', 'firstName lastName profilePicture')

    const populatedComment = newComment as any
    const author = populatedComment.authorId

    return NextResponse.json({
      success: true,
      data: {
        id: newComment._id,
        content: newComment.content,
        author: `${author.firstName} ${author.lastName}`,
        avatar: author.profilePicture || `https://ui-avatars.io/api/?name=${author.firstName}+${author.lastName}`,
        timestamp: populatedComment.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error adding media comment:', error)
    
    // Check if it's a validation error
    if (error instanceof Error && error.name === 'ValidationError') {
      console.error('🔍 Validation error details:', error.message)
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to add comment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}