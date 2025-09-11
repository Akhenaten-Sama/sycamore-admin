import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Get comments for a devotional
export async function GET(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { searchParams } = new URL(request.url);
    const devotionalId = searchParams.get('devotionalId');
    
    if (!devotionalId) {
      return NextResponse.json(
        { success: false, message: 'Devotional ID is required' },
        { status: 400 }
      );
    }

    // Get comments for the devotional
    const comments = await db.collection('devotionalComments').find({
      devotionalId: devotionalId
    }).sort({ createdAt: -1 }).toArray();

    // Get user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment: any) => {
        const user = await db.collection('members').findOne({
          _id: new ObjectId(comment.userId)
        });

        return {
          id: comment._id.toString(),
          content: comment.content,
          devotionalId: comment.devotionalId,
          userId: comment.userId.toString(),
          author: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          avatar: user?.profilePicture || null,
          timestamp: comment.createdAt,
          likes: comment.likes || 0,
          isLiked: false // TODO: Check if current user liked this comment
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: commentsWithUsers
    });

  } catch (error) {
    console.error('Error fetching devotional comments:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// Add a new comment
export async function POST(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { content, devotionalId, userId } = await request.json();

    if (!content || !devotionalId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Content, devotional ID, and user ID are required' },
        { status: 400 }
      );
    }

    // Create new comment
    const newComment = {
      content,
      devotionalId,
      userId: new ObjectId(userId),
      createdAt: new Date(),
      likes: 0
    };

    const result = await db.collection('devotionalComments').insertOne(newComment);

    if (result.insertedId) {
      // Get user details for the response
      const user = await db.collection('members').findOne({
        _id: new ObjectId(userId)
      });

      const commentWithUser = {
        id: result.insertedId.toString(),
        content,
        devotionalId,
        userId,
        author: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        avatar: user?.profilePicture || null,
        timestamp: newComment.createdAt,
        likes: 0,
        isLiked: false
      };

      return NextResponse.json({
        success: true,
        data: commentWithUser
      });
    } else {
      throw new Error('Failed to create comment');
    }

  } catch (error) {
    console.error('Error adding devotional comment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
