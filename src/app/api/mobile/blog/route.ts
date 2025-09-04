import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User, BlogPost } from '@/lib/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyMobileToken(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await User.findById(decoded.userId).populate('memberId')
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user')
    }
    
    return { user, member: user.memberId }
  } catch (error) {
    throw new Error('Invalid token')
  }
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, member } = await verifyMobileToken(request)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Get published blog posts
    const blogPosts = await BlogPost.find({ 
      isDraft: false,
      publishedAt: { $lte: new Date() }
    })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    
    const total = await BlogPost.countDocuments({ 
      isDraft: false,
      publishedAt: { $lte: new Date() }
    })
    
    // Transform for mobile response
    const mobileBlogPosts = blogPosts.map(post => ({
      id: post._id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      publishedAt: post.publishedAt,
      featuredImage: post.featuredImage,
      tags: post.tags,
      slug: post.slug,
      readTime: calculateReadTime(post.content),
      // These would be populated if we had like/comment functionality
      stats: {
        likes: 0,
        comments: 0,
        shares: 0
      },
      isLiked: false, // Would check user's likes
      isBookmarked: false // Would check user's bookmarks
    }))

    return NextResponse.json({
      success: true,
      data: mobileBlogPosts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })

  } catch (error) {
    console.error('Mobile blog error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}
