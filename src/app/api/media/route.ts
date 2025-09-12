import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { Member } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
}

function createCorsResponse(data: any, status: number) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Mock media data for now - in production, this would come from a media service or database
    const mediaItems = [
      {
        id: '1',
        type: 'image',
        title: 'Sunday Service - Week 1',
        description: 'Beautiful moments from our Sunday worship service',
        url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=500&h=300&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=300&h=200&fit=crop',
        uploadedBy: 'Pastor John',
        uploadDate: new Date('2024-01-15'),
        likes: 24,
        comments: [
          { id: '1', author: 'Mary Johnson', text: 'What a blessed service! 🙏', date: new Date('2024-01-15') },
          { id: '2', author: 'David Smith', text: 'Praise the Lord!', date: new Date('2024-01-16') }
        ],
        tags: ['worship', 'sunday-service', 'community'],
        category: 'worship'
      },
      {
        id: '2',
        type: 'video',
        title: 'Youth Conference Highlights',
        description: 'Amazing moments from our recent youth conference',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&h=200&fit=crop',
        uploadedBy: 'Youth Pastor Sarah',
        uploadDate: new Date('2024-01-10'),
        likes: 42,
        comments: [
          { id: '3', author: 'Teen Emma', text: 'This was so inspiring! 💪', date: new Date('2024-01-10') },
          { id: '4', author: 'Youth Leader Mike', text: 'God is moving in our youth!', date: new Date('2024-01-11') }
        ],
        tags: ['youth', 'conference', 'testimony'],
        category: 'youth',
        duration: '5:30'
      },
      {
        id: '3',
        type: 'image',
        title: 'Community Outreach Program',
        description: 'Serving our community with love',
        url: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?w=500&h=300&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?w=300&h=200&fit=crop',
        uploadedBy: 'Community Leader Lisa',
        uploadDate: new Date('2024-01-08'),
        likes: 31,
        comments: [
          { id: '5', author: 'Volunteer Tom', text: 'Love seeing the church in action!', date: new Date('2024-01-08') }
        ],
        tags: ['outreach', 'community', 'service'],
        category: 'outreach'
      },
      {
        id: '4',
        type: 'video',
        title: 'Christmas Carol Performance',
        description: 'Our choir\'s beautiful Christmas performance',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1482686115713-0fbcaced6e28?w=300&h=200&fit=crop',
        uploadedBy: 'Choir Director Anna',
        uploadDate: new Date('2023-12-25'),
        likes: 87,
        comments: [
          { id: '6', author: 'Church Member Bob', text: 'Absolutely beautiful! Glory to God! 🎵', date: new Date('2023-12-25') },
          { id: '7', author: 'Visitor Jane', text: 'This moved me to tears. Thank you!', date: new Date('2023-12-26') }
        ],
        tags: ['christmas', 'music', 'choir', 'performance'],
        category: 'music',
        duration: '8:15'
      },
      {
        id: '5',
        type: 'image',
        title: 'Baptism Celebration',
        description: 'Celebrating new life in Christ',
        url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=500&h=300&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=300&h=200&fit=crop',
        uploadedBy: 'Pastor John',
        uploadDate: new Date('2024-01-05'),
        likes: 56,
        comments: [
          { id: '8', author: 'New Believer Mark', text: 'Thank you for this special moment! 🙌', date: new Date('2024-01-05') },
          { id: '9', author: 'Sister Grace', text: 'Welcome to the family!', date: new Date('2024-01-05') }
        ],
        tags: ['baptism', 'celebration', 'testimony'],
        category: 'sacraments'
      },
      {
        id: '6',
        type: 'image',
        title: 'Bible Study Group',
        description: 'Growing together in God\'s word',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
        uploadedBy: 'Bible Study Leader Ruth',
        uploadDate: new Date('2024-01-03'),
        likes: 19,
        comments: [
          { id: '10', author: 'Study Member Paul', text: 'Love our weekly studies! 📖', date: new Date('2024-01-03') }
        ],
        tags: ['bible-study', 'learning', 'fellowship'],
        category: 'education'
      }
    ]

    // Filter by category if specified
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let filteredMedia = mediaItems

    if (category && category !== 'all') {
      filteredMedia = filteredMedia.filter(item => item.category === category)
    }

    if (type && type !== 'all') {
      filteredMedia = filteredMedia.filter(item => item.type === type)
    }

    if (search) {
      filteredMedia = filteredMedia.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      )
    }

    // Sort by upload date (newest first)
    filteredMedia.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

    return createCorsResponse({
      success: true,
      data: filteredMedia,
      total: filteredMedia.length,
      categories: [
        { id: 'all', name: 'All Media', count: mediaItems.length },
        { id: 'worship', name: 'Worship', count: mediaItems.filter(item => item.category === 'worship').length },
        { id: 'youth', name: 'Youth', count: mediaItems.filter(item => item.category === 'youth').length },
        { id: 'outreach', name: 'Outreach', count: mediaItems.filter(item => item.category === 'outreach').length },
        { id: 'music', name: 'Music', count: mediaItems.filter(item => item.category === 'music').length },
        { id: 'sacraments', name: 'Sacraments', count: mediaItems.filter(item => item.category === 'sacraments').length },
        { id: 'education', name: 'Education', count: mediaItems.filter(item => item.category === 'education').length }
      ]
    }, 200)

  } catch (error) {
    console.error('Error fetching media:', error)
    return createCorsResponse(
      { error: 'Failed to fetch media' },
      500
    )
  }
}

// Like a media item
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return createCorsResponse({ error: 'Authorization required' }, 401)
    }

    const token = authorization.replace('Bearer ', '')
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return createCorsResponse({ error: 'Invalid token' }, 401)
    }

    const { mediaId, action } = await request.json()

    if (action === 'like') {
      // In a real implementation, you would update the like count in the database
      return createCorsResponse({
        success: true,
        message: 'Media liked successfully'
      }, 200)
    } else if (action === 'comment') {
      // Handle commenting
      const { comment } = await request.json()
      
      return createCorsResponse({
        success: true,
        message: 'Comment added successfully'
      }, 201)
    }

    return createCorsResponse({ error: 'Invalid action' }, 400)

  } catch (error) {
    console.error('Error updating media:', error)
    return createCorsResponse(
      { error: 'Failed to update media' },
      500
    )
  }
}
