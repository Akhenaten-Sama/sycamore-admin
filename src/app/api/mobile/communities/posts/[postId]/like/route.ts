import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const { postId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the post
    const post = await db.collection('communityPosts').findOne({
      _id: new ObjectId(postId)
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already liked the post
    const userObjectId = new ObjectId(userId);
    const hasLiked = post.likes?.some((like: any) => 
      like.toString() === userObjectId.toString()
    );

    let updatedLikes;
    if (hasLiked) {
      // Unlike the post
      updatedLikes = post.likes.filter((like: any) => 
        like.toString() !== userObjectId.toString()
      );
    } else {
      // Like the post
      updatedLikes = [...(post.likes || []), userObjectId];
    }

    // Update the post
    await db.collection('communityPosts').updateOne(
      { _id: new ObjectId(postId) },
      { 
        $set: { 
          likes: updatedLikes,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        liked: !hasLiked,
        likeCount: updatedLikes.length
      }
    });

  } catch (error) {
    console.error('Error liking/unliking post:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to like/unlike post' },
      { status: 500 }
    );
  }
}
