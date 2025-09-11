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

    // Create new comment
    const newComment = {
      postId: new ObjectId(postId),
      authorId: new ObjectId(authorId),
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('communityPostComments').insertOne(newComment);

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
