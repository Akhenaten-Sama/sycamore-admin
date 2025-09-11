import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BlogPost } from '@/lib/models'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
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
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isDraft = searchParams.get('isDraft')

    const query: any = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    if (isDraft !== null) {
      query.isDraft = isDraft === 'true'
    }

    const posts = await BlogPost.find(query).sort({ createdAt: -1 })

    return createCorsResponse({
      success: true,
      data: posts,
      total: posts.length
    }, 200)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return createCorsResponse(
      { success: false, error: 'Failed to fetch blog posts' },
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.content || !body.excerpt || !body.author) {
      return createCorsResponse(
        { success: false, error: 'Title, content, excerpt, and author are required' },
        400
      )
    }

    // Generate slug from title
    const slug = body.slug || body.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ slug })
    if (existingPost) {
      return createCorsResponse(
        { success: false, error: 'A post with this slug already exists' },
        400
      )
    }

    const newPost = new BlogPost({
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      author: body.author,
      slug,
      isDraft: body.isDraft || true,
      publishedAt: body.isDraft ? undefined : new Date(),
      featuredImage: body.featuredImage,
      tags: body.tags || []
    })

    const savedPost = await newPost.save()

    return createCorsResponse({
      success: true,
      data: savedPost,
      message: 'Blog post created successfully'
    }, 201)
  } catch (error) {
    console.error('Error creating blog post:', error)
    return createCorsResponse(
      { success: false, error: 'Failed to create blog post' },
      500
    )
  }
}
