import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import { GalleryImage, Comment } from '@/lib/models'
import mongoose, { Model, Document } from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Media model interface (matches /api/media route)
interface IMedia extends Document {
  title: string
  description?: string
  type: 'worship' | 'sermon' | 'podcast' | 'document' | 'audio' | 'video' | 'photo' | 'other'
  category?: 'sermon' | 'worship' | 'announcement' | 'teaching' | 'testimony' | 'other'
  url: string
  thumbnailUrl?: string
  speaker?: string
  date: Date
  duration?: string
  tags: string[]
  viewCount: number
  isActive: boolean
  isLive?: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// Get or create Media model (same as /api/media route)
const getMediaModel = (): Model<IMedia> | null => {
  try {
    // Try to get existing model first
    if (mongoose.models.Media) {
      console.log('✅ Found existing Media model')
      return mongoose.models.Media as Model<IMedia>
    }
    
    // Define the schema inline if model doesn't exist yet
    const mediaSchema = new mongoose.Schema<IMedia>({
      title: { type: String, required: true },
      description: { type: String },
      type: { 
        type: String, 
        enum: ['worship', 'sermon', 'podcast', 'document', 'audio', 'video', 'photo', 'other'],
        required: true 
      },
      category: { 
        type: String, 
        enum: ['sermon', 'worship', 'announcement', 'teaching', 'testimony', 'other'],
        default: 'other'
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
    
    console.log('✅ Created new Media model')
    return mongoose.model<IMedia>('Media', mediaSchema)
  } catch (error) {
    console.error('❌ Error creating Media model:', error)
    return null
  }
}
function getYouTubeThumbnail(url: string): string | null {
  if (!url) return null
  
  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }
  }
  
  return null
}

// Function to detect media type from URL
function detectMediaType(url: string, type?: string): string {
  if (!url) return type || 'other'
  
  // If type is already specified, use it
  if (type && type !== 'other') return type
  
  const urlLower = url.toLowerCase()
  
  // Video detection
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || 
      urlLower.includes('vimeo.com') || urlLower.includes('dailymotion.com') ||
      /\.(mp4|avi|mov|wmv|flv|webm|mkv)(\?.*)?$/i.test(urlLower)) {
    return 'video'
  }
  
  // Audio detection
  if (urlLower.includes('spotify.com') || urlLower.includes('soundcloud.com') ||
      urlLower.includes('apple.com/music') || urlLower.includes('music.apple.com') ||
      /\.(mp3|wav|ogg|aac|m4a|flac)(\?.*)?$/i.test(urlLower)) {
    return 'audio'
  }
  
  // Document detection
  if (/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)(\?.*)?$/i.test(urlLower)) {
    return 'document'
  }
  
  // Image detection
  if (/\.(jpg|jpeg|png|gif|bmp|svg|webp)(\?.*)?$/i.test(urlLower)) {
    return 'photo'
  }
  
  return type || 'other'
}

// Function to get appropriate thumbnail for different media types
function getMediaThumbnail(url: string, type: string, existingThumbnail?: string): string | null {
  if (existingThumbnail) return existingThumbnail
  
  // YouTube thumbnail
  if (type === 'video' && (url.includes('youtube.com') || url.includes('youtu.be'))) {
    return getYouTubeThumbnail(url)
  }
  
  // Vimeo thumbnail (would need API call, but we can use a placeholder)
  if (type === 'video' && url.includes('vimeo.com')) {
    const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
    if (vimeoId) {
      return `https://vumbnail.com/${vimeoId}.jpg`
    }
  }
  
  // Spotify thumbnail (use Spotify icon)
  if (type === 'audio' && url.includes('spotify.com')) {
    return 'https://open.spotify.com/favicon.ico' // Placeholder
  }
  
  // For images, the URL itself is the thumbnail
  if (type === 'photo') {
    return url
  }
  
  return null
}

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
    const offset = parseInt(searchParams.get('offset') || '0')
    
    console.log('📸 Media request - type:', type, 'limit:', limit, 'offset:', offset)

    let mediaItems: any[] = []
    let totalCount = 0
    
    try {
      // First try to get media from the Media model (admin-managed media)
      const MediaModel = getMediaModel()
      console.log('📦 MediaModel available:', MediaModel ? 'YES' : 'NO')
      
      if (MediaModel) {
        const query: any = { isActive: true }
        if (type && type !== 'all') {
          // For now, return all media items and let frontend filter by detected type
          // This allows the detectMediaType function to work properly
          // We could add URL-based filtering later if needed
        }
        
        totalCount = await MediaModel.countDocuments(query)
        console.log('📊 Total Media items in database:', totalCount)
        
        const adminMediaItems = await MediaModel.find(query)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .populate('createdBy', 'firstName lastName')
          
        console.log('📊 Admin media items fetched:', adminMediaItems.length)
          
        if (adminMediaItems.length > 0) {
          console.log('✅ Using admin Media items (not gallery)')
          mediaItems = adminMediaItems.map((item: any) => {
            // Always use URL-based type detection for media format
            // The 'type' field in backend might be content category (sermon, worship, etc.)
            const detectedType = detectMediaType(item.url, item.type)
            
            console.log(`📊 Media item: ${item.title} - Backend type: ${item.type} - Detected type: ${detectedType} - URL: ${item.url}`)
            
            // Get appropriate thumbnail based on media type
            const thumbnail = getMediaThumbnail(item.url, detectedType, item.thumbnailUrl)
            
            return {
              _id: item._id,
              title: item.title,
              description: item.description,
              type: detectedType, // Use detected type for media format
              category: item.category || item.type || 'other', // Use category field or type as fallback
              url: item.url,
              thumbnail,
              speaker: item.speaker,
              uploadedBy: item.createdBy,
              createdAt: item.createdAt,
              date: item.date,
              likes: item.viewCount,
              views: item.viewCount,
              comments: 0,
              tags: item.tags,
              isLive: item.isLive || false,
              duration: item.duration ? parseInt(item.duration.split(':')[0]) * 60 + parseInt(item.duration.split(':')[1] || '0') : undefined
            }
          })
        } else {
          console.log('⚠️ No admin media items found after query')
        }
      } else {
        console.log('❌ MediaModel not available')
      }
      
      // If no admin media found, try gallery images  
      if (mediaItems.length === 0) {
        console.log('🖼️ Falling back to GalleryImage')
        const query = type && type !== 'all' ? { type } : {}
        totalCount = await GalleryImage.countDocuments(query)
        const galleryItems = await GalleryImage.find(query)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .populate('uploadedBy', 'firstName lastName')
          
        console.log('🖼️ Gallery items fetched:', galleryItems.length)
        mediaItems = galleryItems.map((item: any) => ({
          _id: item._id,
          title: item.title,
          description: item.description,
          type: 'photo', // Gallery images are always photos
          url: item.imageUrl,
          thumbnail: item.thumbnailUrl || item.imageUrl,
          speaker: null,
          uploadedBy: item.uploadedBy,
          createdAt: item.createdAt,
          likes: 0,
          comments: 0,
          tags: item.tags || [],
          duration: undefined
        }))
      }
    } catch (error) {
      console.error('Error fetching media from database:', error)
      mediaItems = [] // Return empty array instead of mock data
    }

    // Apply type filtering after detection if requested
    if (type && type !== 'all') {
      mediaItems = mediaItems.filter(item => {
        const itemUrl = item.url || item.imageUrl
        const detectedType = detectMediaType(itemUrl, item.type) || (item.type || 'photo')
        return detectedType === type
      })
    }
    
    console.log(`✅ Returning ${mediaItems.length} media items (filtered for type: ${type || 'all'})`)

    return NextResponse.json({
      success: true,
      data: mediaItems.map((item: any) => {
        const itemUrl = item.url || item.imageUrl
        const finalType = detectMediaType(itemUrl, item.type) || (item.type || 'photo')
        const finalThumbnail = getMediaThumbnail(itemUrl, finalType, item.thumbnail || item.thumbnailUrl || item.imageUrl)
        
        return {
          id: item._id || item.id,
          title: item.title,
          description: item.description,
          type: finalType,
          category: item.category || 'other', // Add category field
          url: itemUrl,
          thumbnail: finalThumbnail,
          speaker: item.speaker, // Add speaker field
          date: item.date || item.createdAt || item.uploadedAt, // Use date field or fallback to creation date
          views: item.viewCount || item.views || 0, // Add views field
          uploadedBy: item.uploadedBy,
          createdAt: item.createdAt || item.uploadedAt,
          likes: item.likes || 0,
          comments: item.comments || 0,
          tags: item.tags || [],
          isLive: item.isLive || false, // Add isLive field
          duration: item.duration,
          isPublic: item.isPublic
        }
      }),
      total: mediaItems.length, // Use filtered count
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: false // Since we're filtering post-query, disable pagination for now
    })

  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { message: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}
