import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Like/Unlike a devotional
export async function POST(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { devotionalId, userId } = await request.json();

    if (!devotionalId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Devotional ID and user ID are required' },
        { status: 400 }
      );
    }

    // Check if user already liked this devotional
    const existingLike = await db.collection('devotionalLikes').findOne({
      devotionalId,
      userId: new ObjectId(userId)
    });

    if (existingLike) {
      // Unlike - remove the like
      await db.collection('devotionalLikes').deleteOne({
        devotionalId,
        userId: new ObjectId(userId)
      });

      // Get updated like count
      const likeCount = await db.collection('devotionalLikes').countDocuments({
        devotionalId
      });

      return NextResponse.json({
        success: true,
        data: {
          liked: false,
          likeCount
        }
      });
    } else {
      // Like - add the like
      await db.collection('devotionalLikes').insertOne({
        devotionalId,
        userId: new ObjectId(userId),
        createdAt: new Date()
      });

      // Get updated like count
      const likeCount = await db.collection('devotionalLikes').countDocuments({
        devotionalId
      });

      return NextResponse.json({
        success: true,
        data: {
          liked: true,
          likeCount
        }
      });
    }

  } catch (error) {
    console.error('Error toggling devotional like:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

// Get like status and count for a devotional
export async function GET(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { searchParams } = new URL(request.url);
    const devotionalId = searchParams.get('devotionalId');
    const userId = searchParams.get('userId');

    if (!devotionalId) {
      return NextResponse.json(
        { success: false, message: 'Devotional ID is required' },
        { status: 400 }
      );
    }

    // Get like count
    const likeCount = await db.collection('devotionalLikes').countDocuments({
      devotionalId
    });

    // Check if user liked this devotional (if userId provided)
    let isLiked = false;
    if (userId) {
      const userLike = await db.collection('devotionalLikes').findOne({
        devotionalId,
        userId: new ObjectId(userId)
      });
      isLiked = !!userLike;
    }

    return NextResponse.json({
      success: true,
      data: {
        likeCount,
        isLiked
      }
    });

  } catch (error) {
    console.error('Error fetching devotional likes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}
