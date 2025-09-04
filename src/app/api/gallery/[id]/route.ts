import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { GalleryImage } from '@/lib/models'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const image = await GalleryImage.findById(id)
      .populate('eventId', 'name date')
      .populate('uploadedBy', 'firstName lastName')
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: image
    })
  } catch (error) {
    console.error('Error fetching image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    
    const image = await GalleryImage.findById(id)
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      )
    }

    // Update image fields
    if (body.title) image.title = body.title
    if (body.description !== undefined) image.description = body.description
    if (body.tags) image.tags = body.tags
    if (body.isPublic !== undefined) image.isPublic = body.isPublic
    if (body.eventId !== undefined) image.eventId = body.eventId

    const updatedImage = await image.save()
    
    // Populate the updated image
    const populatedImage = await GalleryImage.findById(updatedImage._id)
      .populate('eventId', 'name date')
      .populate('uploadedBy', 'firstName lastName')

    return NextResponse.json({
      success: true,
      data: populatedImage,
      message: 'Image updated successfully'
    })
  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update image' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const image = await GalleryImage.findByIdAndDelete(id)
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
