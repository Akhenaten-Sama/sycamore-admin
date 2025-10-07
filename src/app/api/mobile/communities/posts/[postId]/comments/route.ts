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
    const { content, authorId } = await request.json();

    if (!content || !authorId) {
      return NextResponse.json(
        { success: false, message: 'Content and author ID are required' },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await db.collection('communityPosts').findOne({
      _id: new ObjectId(postId)
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Create new comment using unified comments collection
    const newComment = {
      content,
      authorId: new ObjectId(authorId),
      targetType: 'community_post',
      targetId: new ObjectId(postId),
      isApproved: true, // Auto-approve community comments
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('comments').insertOne(newComment);

    // Update post comment count
    await db.collection('communityPosts').updateOne(
      { _id: new ObjectId(postId) },
      { 
        $inc: { commentCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // Get author details for response
    const author = await db.collection('members').findOne({
      _id: new ObjectId(authorId)
    });

    const createdComment = {
      id: result.insertedId.toString(),
      ...newComment,
      postId: postId,
      authorId: authorId,
      author: {
        id: author?._id.toString(),
        name: `${author?.firstName} ${author?.lastName}`,
        avatar: author?.profilePicture || null
      }
    };

    return NextResponse.json({
      success: true,
      data: createdComment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const { postId } = await params;

    // Verify post exists
    const post = await db.collection('communityPosts').findOne({
      _id: new ObjectId(postId)
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Get comments for this post
    const comments = await db.collection('comments').find({
      targetType: 'community_post',
      targetId: new ObjectId(postId)
    }).sort({ createdAt: 1 }).toArray();

    // Enrich comments with author details
    const enrichedComments = await Promise.all(
      comments.map(async (comment: any) => {
        const author = await db.collection('members').findOne({
          _id: new ObjectId(comment.authorId)
        });
        return {
          id: comment._id.toString(),
          content: comment.content,
          authorId: comment.authorId.toString(),
          postId: postId,
          author: {
            id: author?._id.toString(),
            name: `${author?.firstName} ${author?.lastName}`,
            avatar: author?.profilePicture || null
          },
          createdAt: comment.createdAt,
          isApproved: comment.isApproved !== false
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedComments
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
