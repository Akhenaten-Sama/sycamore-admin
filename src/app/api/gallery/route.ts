import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { GalleryImage } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const eventId = searchParams.get('eventId')
    const isPublic = searchParams.get('isPublic')
    const uploadedBy = searchParams.get('uploadedBy')
    const tags = searchParams.get('tags')

    const query: any = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (eventId) {
      query.eventId = eventId
    }

    if (isPublic === 'true') {
      query.isPublic = true
    }

    if (uploadedBy) {
      query.uploadedBy = uploadedBy
    }

    if (tags) {
      query.tags = { $in: tags.split(',') }
    }

    const images = await GalleryImage.find(query)
      .populate('eventId', 'name date')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ uploadedAt: -1 })

    return NextResponse.json({
      success: true,
      data: images,
      total: images.length
    })
  } catch (error) {
    console.error('Error fetching gallery images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gallery images' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.imageUrl || !body.uploadedBy) {
      return NextResponse.json(
        { success: false, error: 'Title, image URL, and uploader ID are required' },
        { status: 400 }
      )
    }

    const newImage = new GalleryImage({
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl,
      thumbnailUrl: body.thumbnailUrl,
      eventId: body.eventId,
      uploadedBy: body.uploadedBy,
      uploadedAt: new Date(),
      tags: body.tags || [],
      isPublic: body.isPublic !== undefined ? body.isPublic : true
    })

    const savedImage = await newImage.save()
    
    // Populate the saved image
    const populatedImage = await GalleryImage.findById(savedImage._id)
      .populate('eventId', 'name date')
      .populate('uploadedBy', 'firstName lastName')

    return NextResponse.json({
      success: true,
      data: populatedImage,
      message: 'Image uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
