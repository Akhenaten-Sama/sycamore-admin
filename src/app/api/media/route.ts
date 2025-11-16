import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models'
import mongoose, { Model, Document } from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface IMedia extends Document {
  title: string
  description?: string
  type: 'video' | 'audio' | 'photo' | 'document' | 'other' // Media format
  category: 'sermon' | 'worship' | 'announcement' | 'teaching' | 'testimony' | 'other' // Content category
  url: string
  thumbnailUrl?: string
  speaker?: string
  date: Date
  duration?: string
  tags: string[]
  viewCount: number
  isActive: boolean
  isLive: boolean // For live streaming
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// Get Media model dynamically
const getMediaModel = (): Model<IMedia> => {
  // Try to get existing model first
  if (mongoose.models.Media) {
    return mongoose.models.Media as Model<IMedia>
  }
  
  // Define the schema inline if model doesn't exist yet
  const mediaSchema = new mongoose.Schema<IMedia>({
    title: { type: String, required: true },
    description: { type: String },
    type: { 
      type: String, 
      enum: ['video', 'audio', 'photo', 'document', 'other'],
      required: true,
      default: 'video'
    },
    category: { 
      type: String, 
      enum: ['sermon', 'worship', 'announcement', 'teaching', 'testimony', 'other'],
      required: true,
      default: 'sermon'
    },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    speaker: { type: String },
    date: { type: Date, required: true },
    duration: { type: String },
    tags: [{ type: String }],
    viewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isLive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }, {
    timestamps: true
  })
  
  return mongoose.model<IMedia>('Media', mediaSchema)
}

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Get user from database to verify admin role
    await connectDB()
    const user = await User.findById(decoded.userId)
    
    if (!user || !user.isActive) {
      return null
    }
    
    // Check if user has admin privileges
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return null
    }
    
    return { id: decoded.userId, role: user.role }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// GET - Fetch all media items
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')

    // Build query
    let query: any = {}
    
    if (type && type !== '') {
      query.type = type
    }
    
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { speaker: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    const MediaModel = getMediaModel()
    const mediaItems = await MediaModel.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: mediaItems.map((item: any) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        type: item.type,
        category: item.category,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        speaker: item.speaker,
        date: item.date,
        duration: item.duration,
        tags: item.tags,
        viewCount: item.viewCount,
        isActive: item.isActive,
        isLive: item.isLive,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    })

  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

// POST - Create new media item
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Verify admin authentication
    const user = await verifyAdminToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      category,
      url,
      thumbnailUrl,
      speaker,
      date,
      duration,
      tags,
      isActive,
      isLive
    } = body

    // Validate required fields
    if (!title || !type || !url || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, url, date' },
        { status: 400 }
      )
    }

    // Create new media item
    const MediaModel = getMediaModel()
    const newMedia = new MediaModel({
      title,
      description,
      type,
      category: category || 'sermon',
      url,
      thumbnailUrl,
      speaker,
      date: new Date(date),
      duration,
      tags: Array.isArray(tags) ? tags : [],
      isActive: isActive !== false,
      isLive: isLive === true,
      createdBy: user.id,
      viewCount: 0
    })

    await newMedia.save()
    await newMedia.populate('createdBy', 'firstName lastName')

    return NextResponse.json({
      success: true,
      data: {
        id: newMedia._id,
        title: newMedia.title,
        description: newMedia.description,
        type: newMedia.type,
        category: newMedia.category,
        url: newMedia.url,
        thumbnailUrl: newMedia.thumbnailUrl,
        speaker: newMedia.speaker,
        date: newMedia.date,
        duration: newMedia.duration,
        tags: newMedia.tags,
        viewCount: newMedia.viewCount,
        isActive: newMedia.isActive,
        isLive: newMedia.isLive,
        createdBy: newMedia.createdBy,
        createdAt: newMedia.createdAt,
        updatedAt: newMedia.updatedAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating media:', error)
    return NextResponse.json(
      { error: 'Failed to create media' },
      { status: 500 }
    )
  }
}

// PUT - Update media item
export async function PUT(request: NextRequest) {
  try {
    await connectDB()

    // Verify admin authentication
    const user = await verifyAdminToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      id,
      title,
      description,
      type,
      category,
      url,
      thumbnailUrl,
      speaker,
      date,
      duration,
      tags,
      isActive,
      isLive
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      )
    }

    // Update media item
    const MediaModel = getMediaModel()
    const updatedMedia = await MediaModel.findByIdAndUpdate(
      id,
      {
        title,
        description,
        type,
        category,
        url,
        thumbnailUrl,
        speaker,
        date: date ? new Date(date) : undefined,
        duration,
        tags: Array.isArray(tags) ? tags : [],
        isActive: isActive !== false,
        isLive: isLive === true
      },
      { new: true }
    ).populate('createdBy', 'firstName lastName')

    if (!updatedMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedMedia._id,
        title: updatedMedia.title,
        description: updatedMedia.description,
        type: updatedMedia.type,
        category: updatedMedia.category,
        url: updatedMedia.url,
        thumbnailUrl: updatedMedia.thumbnailUrl,
        speaker: updatedMedia.speaker,
        date: updatedMedia.date,
        duration: updatedMedia.duration,
        tags: updatedMedia.tags,
        viewCount: updatedMedia.viewCount,
        isActive: updatedMedia.isActive,
        isLive: updatedMedia.isLive,
        createdBy: updatedMedia.createdBy,
        createdAt: updatedMedia.createdAt,
        updatedAt: updatedMedia.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating media:', error)
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    )
  }
}

// DELETE - Delete media item
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    // Verify admin authentication
    const user = await verifyAdminToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      )
    }

    const MediaModel = getMediaModel()
    const deletedMedia = await MediaModel.findByIdAndDelete(id)

    if (!deletedMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
}
