import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { GalleryImage, GalleryFolder } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = {}
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
    }

    const folders = await GalleryFolder.find(query)
      .populate('eventId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })

    // Add image counts to folders
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const imageCount = await GalleryImage.countDocuments({ folderId: folder._id })
        
        // Get cover image (first image in folder)
        const firstImage = await GalleryImage.findOne({ folderId: folder._id })
          .select('imageUrl')
          .sort({ createdAt: -1 })

        return {
          id: (folder._id as any).toString(),
          name: folder.name,
          description: folder.description,
          eventId: folder.eventId,
          createdBy: folder.createdBy,
          isPublic: folder.isPublic,
          coverImage: firstImage?.imageUrl || null,
          color: folder.color,
          imageCount,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: foldersWithCounts,
      total: foldersWithCounts.length
    })
  } catch (error) {
    console.error('Error fetching gallery folders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gallery folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.createdBy) {
      return NextResponse.json(
        { success: false, error: 'Folder name and creator ID are required' },
        { status: 400 }
      )
    }

    const newFolder = new GalleryFolder({
      name: body.name,
      description: body.description || '',
      eventId: body.eventId || null,
      createdBy: body.createdBy,
      isPublic: body.isPublic !== undefined ? body.isPublic : true,
      color: body.color || '#3B82F6'
    })

    const savedFolder = await newFolder.save()
    await savedFolder.populate('eventId', 'name')
    await savedFolder.populate('createdBy', 'firstName lastName')

    return NextResponse.json({
      success: true,
      data: {
        id: (savedFolder._id as any).toString(),
        name: savedFolder.name,
        description: savedFolder.description,
        eventId: savedFolder.eventId,
        createdBy: savedFolder.createdBy,
        isPublic: savedFolder.isPublic,
        coverImage: null,
        color: savedFolder.color,
        imageCount: 0,
        createdAt: savedFolder.createdAt,
        updatedAt: savedFolder.updatedAt
      },
      message: 'Folder created successfully'
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    const updatedFolder = await GalleryFolder.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('eventId', 'name').populate('createdBy', 'firstName lastName')
    
    if (!updatedFolder) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: (updatedFolder._id as any).toString(),
        name: updatedFolder.name,
        description: updatedFolder.description,
        eventId: updatedFolder.eventId,
        createdBy: updatedFolder.createdBy,
        isPublic: updatedFolder.isPublic,
        color: updatedFolder.color,
        createdAt: updatedFolder.createdAt,
        updatedAt: updatedFolder.updatedAt
      },
      message: 'Folder updated successfully'
    })
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    const folder = await GalleryFolder.findById(id)
    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Move images in this folder to uncategorized (null folderId)
    await GalleryImage.updateMany(
      { folderId: id },
      { $unset: { folderId: 1 } }
    )

    await GalleryFolder.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}