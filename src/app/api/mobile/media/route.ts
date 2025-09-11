import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { GalleryImage, Comment } from '@/lib/models'

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

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'photo', 'video', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    
    console.log('📸 Media request - type:', type, 'limit:', limit)

    let mediaItems = []
    
    try {
      // Try to get real media from database
      const query = type && type !== 'all' ? { type } : {}
      mediaItems = await GalleryImage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('uploadedBy', 'firstName lastName')
    } catch (error) {
      console.log('📱 MediaItem model not found, creating mock data')
      // Create mock media data for development
      mediaItems = [
        {
          _id: '1',
          title: 'Sunday Service Highlights',
          description: 'Beautiful moments from our worship service',
          type: 'video',
          url: 'https://example.com/video1.mp4',
          thumbnail: 'https://picsum.photos/400/300?random=1',
          uploadedBy: { firstName: 'John', lastName: 'Doe' },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          likes: 15,
          comments: 8,
          tags: ['worship', 'sunday', 'service'],
          duration: 180
        },
        {
          _id: '2',
          title: 'Community Outreach Event',
          description: 'Serving our local community with love',
          type: 'photo',
          url: 'https://picsum.photos/400/300?random=2',
          thumbnail: 'https://picsum.photos/400/300?random=2',
          uploadedBy: { firstName: 'Mary', lastName: 'Johnson' },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          likes: 23,
          comments: 12,
          tags: ['outreach', 'community', 'service']
        },
        {
          _id: '3',
          title: 'Youth Bible Study',
          description: 'Our young people diving deep into God\'s word',
          type: 'photo',
          url: 'https://picsum.photos/400/300?random=3',
          thumbnail: 'https://picsum.photos/400/300?random=3',
          uploadedBy: { firstName: 'David', lastName: 'Smith' },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          likes: 18,
          comments: 6,
          tags: ['youth', 'bible-study', 'education']
        },
        {
          _id: '4',
          title: 'Baptism Celebration',
          description: 'New believers taking their first step of faith',
          type: 'video',
          url: 'https://example.com/video4.mp4',
          thumbnail: 'https://picsum.photos/400/300?random=4',
          uploadedBy: { firstName: 'Pastor', lastName: 'Williams' },
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          likes: 45,
          comments: 20,
          tags: ['baptism', 'celebration', 'faith'],
          duration: 300
        },
        {
          _id: '5',
          title: 'Christmas Choir Performance',
          description: 'Angels we have heard on high',
          type: 'video',
          url: 'https://example.com/video5.mp4',
          thumbnail: 'https://picsum.photos/400/300?random=5',
          uploadedBy: { firstName: 'Sarah', lastName: 'Brown' },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          likes: 67,
          comments: 25,
          tags: ['christmas', 'choir', 'music'],
          duration: 240
        },
        {
          _id: '6',
          title: 'Church Building Updates',
          description: 'Progress on our new fellowship hall',
          type: 'photo',
          url: 'https://picsum.photos/400/300?random=6',
          thumbnail: 'https://picsum.photos/400/300?random=6',
          uploadedBy: { firstName: 'Deacon', lastName: 'Jones' },
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          likes: 12,
          comments: 4,
          tags: ['building', 'construction', 'progress']
        }
      ]

      // Filter by type if specified
      if (type && type !== 'all') {
        mediaItems = mediaItems.filter(item => item.type === type)
      }

      // Apply limit
      mediaItems = mediaItems.slice(0, limit)
    }

    console.log(`✅ Returning ${mediaItems.length} media items`)

    return NextResponse.json({
      success: true,
      data: mediaItems.map((item: any) => ({
        id: item._id || item.id,
        title: item.title,
        description: item.description,
        type: item.type || 'photo', // Default to photo for GalleryImage
        url: item.url || item.imageUrl,
        thumbnail: item.thumbnail || item.thumbnailUrl || item.imageUrl,
        uploadedBy: item.uploadedBy,
        createdAt: item.createdAt || item.uploadedAt,
        likes: item.likes || 0,
        comments: item.comments || 0,
        tags: item.tags || [],
        duration: item.duration,
        isPublic: item.isPublic
      })),
      total: mediaItems.length
    })

  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { message: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}
