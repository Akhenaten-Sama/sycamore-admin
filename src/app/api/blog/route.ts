import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BlogPost } from '@/lib/models'

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

    return NextResponse.json({
      success: true,
      data: posts,
      total: posts.length
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.content || !body.excerpt || !body.author) {
      return NextResponse.json(
        { success: false, error: 'Title, content, excerpt, and author are required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = body.slug || body.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ slug })
    if (existingPost) {
      return NextResponse.json(
        { success: false, error: 'A post with this slug already exists' },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      data: savedPost,
      message: 'Blog post created successfully'
    })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
