import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;

    // Sample communities data
    const sampleCommunities = [
      {
        name: "Youth Ministry",
        description: "A vibrant community for young people to grow in faith, build friendships, and serve together.",
        category: "Youth",
        isPrivate: false,
        coverImage: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
        members: [],
        createdAt: new Date(),
        memberCount: 45
      },
      {
        name: "Prayer Warriors",
        description: "Dedicated to intercessory prayer and spiritual warfare through the power of prayer.",
        category: "Prayer",
        isPrivate: false,
        coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
        members: [],
        createdAt: new Date(),
        memberCount: 32
      },
      {
        name: "Worship Team",
        description: "Musicians and singers who lead the congregation in worship every Sunday.",
        category: "Music",
        isPrivate: false,
        coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
        members: [],
        createdAt: new Date(),
        memberCount: 18
      },
      {
        name: "Women's Fellowship",
        description: "A supportive community for women to study God's word, share life experiences, and pray together.",
        category: "Fellowship",
        isPrivate: false,
        coverImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
        members: [],
        createdAt: new Date(),
        memberCount: 67
      },
      {
        name: "Men's Bible Study",
        description: "Men gathering weekly to dive deep into Scripture and challenge each other in faith.",
        category: "Bible Study",
        isPrivate: false,
        coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
        members: [],
        createdAt: new Date(),
        memberCount: 28
      },
      {
        name: "Children's Ministry",
        description: "Dedicated to nurturing and teaching our youngest members in the ways of Christ.",
        category: "Children",
        isPrivate: false,
        coverImage: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
        members: [],
        createdAt: new Date(),
        memberCount: 89
      }
    ];

    // Insert communities
    const communitiesResult = await db.collection('communities').insertMany(sampleCommunities);
    const communityIds = Object.values(communitiesResult.insertedIds);

    // Sample posts for each community
    const samplePosts: any[] = [];
    communityIds.forEach((communityId, index) => {
      // Add 2-3 posts per community
      samplePosts.push(
        {
          communityId: communityId,
          authorId: new ObjectId(), // This would be a real member ID in production
          content: `Welcome to our community! We're excited to have you join us on this journey of faith and fellowship.`,
          type: 'post',
          likes: [],
          comments: [],
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
          updatedAt: new Date()
        },
        {
          communityId: communityId,
          authorId: new ObjectId(),
          content: `Don't forget about our upcoming meeting this Sunday. Looking forward to seeing everyone there!`,
          type: 'announcement',
          likes: [],
          comments: [],
          createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      );
    });

    // Insert posts
    await db.collection('communityPosts').insertMany(samplePosts);

    // Sample events
    const sampleEvents: any[] = [];
    communityIds.forEach((communityId, index) => {
      sampleEvents.push({
        communityId: communityId,
        title: `${sampleCommunities[index].name} Meeting`,
        description: `Monthly gathering for ${sampleCommunities[index].name} members`,
        date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within next month
        location: 'Church Fellowship Hall',
        attendees: [],
        createdAt: new Date()
      });
    });

    // Insert events
    await db.collection('events').insertMany(sampleEvents);

    return NextResponse.json({
      success: true,
      message: 'Sample data seeded successfully',
      data: {
        communities: communitiesResult.insertedCount,
        posts: samplePosts.length,
        events: sampleEvents.length
      }
    });

  } catch (error) {
    console.error('Error seeding community data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to seed community data' },
      { status: 500 }
    );
  }
}
