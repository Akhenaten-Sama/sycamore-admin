import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const { id: communityId } = await params;
    const { content, authorId, type = 'post' } = await request.json();

    if (!content || !authorId) {
      return NextResponse.json(
        { success: false, message: 'Content and author ID are required' },
        { status: 400 }
      );
    }

    // Verify community exists
    const community = await db.collection('communities').findOne({
      _id: new ObjectId(communityId)
    });

    if (!community) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    // Verify member is part of community or auto-add them
    const isMember = community.members?.some((memberId: any) => 
      memberId.toString() === authorId || memberId === authorId
    );
    
    if (!isMember) {
      // Auto-add user as member (common for church communities)
      await db.collection('communities').updateOne(
        { _id: new ObjectId(communityId) },
        { $addToSet: { members: new ObjectId(authorId) } }
      );
    }

    // Create new post
    const newPost = {
      communityId: new ObjectId(communityId),
      authorId: new ObjectId(authorId),
      content,
      type,
      likes: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('communityPosts').insertOne(newPost);

    // Get author details for response
    const author = await db.collection('members').findOne({
      _id: new ObjectId(authorId)
    });

    const createdPost = {
      id: result.insertedId.toString(),
      ...newPost,
      communityId: communityId,
      authorId: authorId,
      author: {
        id: author?._id.toString(),
        name: `${author?.firstName} ${author?.lastName}`,
        avatar: author?.profilePicture || null
      }
    };

    return NextResponse.json({
      success: true,
      data: createdPost
    });

  } catch (error) {
    console.error('Error creating community post:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create post' },
      { status: 500 }
    );
  }
}
