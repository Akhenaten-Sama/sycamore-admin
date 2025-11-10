import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

// POST - Like/Unlike a media item
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
    const userId = user.userId || user.id

    // Get or create MediaLike model
    let MediaLike
    try {
      MediaLike = mongoose.models.MediaLike
      if (!MediaLike) {
        const mediaLikeSchema = new mongoose.Schema({
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
          mediaId: { type: String, required: true },
          createdAt: { type: Date, default: Date.now }
        })
        
        mediaLikeSchema.index({ userId: 1, mediaId: 1 }, { unique: true })
        MediaLike = mongoose.model('MediaLike', mediaLikeSchema)
      }
    } catch (error) {
      console.error('Error with MediaLike model:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Check if user has already liked this media
    const existingLike = await (MediaLike as any).findOne({ userId, mediaId })

    if (existingLike) {
      // Unlike - remove the like
      await (MediaLike as any).deleteOne({ userId, mediaId })
      
      // Get updated like count
      const likeCount = await (MediaLike as any).countDocuments({ mediaId })
      
      return NextResponse.json({
        success: true,
        liked: false,
        likeCount,
        message: 'Media unliked'
      })
    } else {
      // Like - add the like
      await (MediaLike as any).create({ userId, mediaId })
      
      // Get updated like count
      const likeCount = await (MediaLike as any).countDocuments({ mediaId })
      
      return NextResponse.json({
        success: true,
        liked: true,
        likeCount,
        message: 'Media liked'
      })
    }

  } catch (error: any) {
    console.error('Error toggling media like:', error)
    
    // Handle duplicate key error (race condition)
    if (error?.code === 11000) {
      return NextResponse.json({
        success: true,
        message: 'Already processed'
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}