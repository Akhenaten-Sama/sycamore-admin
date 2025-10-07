import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const { id: communityId } = await params;

    // Get community details
    const community = await db.collection('communities').findOne({
      _id: new ObjectId(communityId)
    });

    if (!community) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    // Get community members
    const members = await db.collection('members').find({
      _id: { $in: community.members?.map((id: string) => new ObjectId(id)) || [] }
    }).toArray();

    // Get community posts (discussion board)
    const posts = await db.collection('communityPosts').find({
      communityId: new ObjectId(communityId)
    }).sort({ createdAt: -1 }).limit(20).toArray();

    // Get community events
    const events = await db.collection('events').find({
      communityId: new ObjectId(communityId),
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(10).toArray();

    // Get community media
    const media = await db.collection('communityMedia').find({
      communityId: new ObjectId(communityId)
    }).sort({ createdAt: -1 }).limit(20).toArray();

    // Enrich posts with author details and comments
    const enrichedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const author = await db.collection('members').findOne({
          _id: new ObjectId(post.authorId)
        });

        // Get comments for this post
        const comments = await db.collection('comments').find({
          targetType: 'community_post',
          targetId: new ObjectId(post._id)
        }).sort({ createdAt: 1 }).toArray();

        // Enrich comments with author details
        const enrichedComments = await Promise.all(
          comments.map(async (comment: any) => {
            const commentAuthor = await db.collection('members').findOne({
              _id: new ObjectId(comment.authorId)
            });
            return {
              id: comment._id.toString(),
              content: comment.content,
              authorId: comment.authorId.toString(),
              author: {
                id: commentAuthor?._id.toString(),
                name: `${commentAuthor?.firstName} ${commentAuthor?.lastName}`,
                avatar: commentAuthor?.profilePicture || null
              },
              createdAt: comment.createdAt,
              likes: comment.likes || [],
              isApproved: comment.isApproved !== false // Default to true if not set
            };
          })
        );

        return {
          ...post,
          id: post._id.toString(),
          comments: enrichedComments,
          commentCount: enrichedComments.length,
          author: {
            id: author?._id.toString(),
            name: `${author?.firstName} ${author?.lastName}`,
            avatar: author?.profilePicture || null
          }
        };
      })
    );

    const communityData = {
      id: community._id.toString(),
      name: community.name,
      description: community.description,
      category: community.category,
      isPrivate: community.isPrivate || false,
      memberCount: members.length,
      coverImage: community.coverImage || null,
      createdAt: community.createdAt,
      members: members.map((member: any) => ({
        id: member._id.toString(),
        name: `${member.firstName} ${member.lastName}`,
        avatar: member.profilePicture || null,
        role: member.role || 'member',
        joinedAt: member.joinedAt || community.createdAt
      })),
      posts: enrichedPosts,
      events: events.map((event: any) => ({
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        attendees: event.attendees?.length || 0
      })),
      media: media.map((item: any) => ({
        id: item._id.toString(),
        type: item.type,
        url: item.url,
        thumbnail: item.thumbnail,
        title: item.title,
        createdAt: item.createdAt
      }))
    };

    return NextResponse.json({
      success: true,
      data: communityData
    });

  } catch (error) {
    console.error('Error fetching community details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch community details' },
      { status: 500 }
    );
  }
}
