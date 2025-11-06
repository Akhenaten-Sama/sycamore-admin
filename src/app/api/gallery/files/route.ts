import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { MediaFile } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder')
    const fileType = searchParams.get('fileType')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query
    const query: any = { isPublic: true }
    
    if (folder && folder !== 'all') {
      query.folder = folder
    }
    
    if (fileType && fileType !== 'all') {
      query.fileType = fileType
    }
    
    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Get total count
    const total = await MediaFile.countDocuments(query)
    
    // Get files with pagination
    const files = await MediaFile.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    // Get folder statistics
    const folderStats = await MediaFile.aggregate([
      { $match: { isPublic: true } },
      {
        $group: {
          _id: '$folder',
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Get file type statistics
    const typeStats = await MediaFile.aggregate([
      { $match: { isPublic: true } },
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } }
    ])

    return NextResponse.json({
      success: true,
      data: {
        files: files.map(file => ({
          id: file._id,
          filename: file.filename,
          originalName: file.originalName,
          url: file.url,
          cloudflareKey: file.cloudflareKey,
          fileType: file.fileType,
          mimeType: file.mimeType,
          size: file.size,
          folder: file.folder,
          description: file.description,
          tags: file.tags,
          uploadedBy: file.uploadedBy,
          isPublic: file.isPublic,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          folders: folderStats,
          types: typeStats,
          totalFiles: total,
          totalSize: files.reduce((sum, file) => sum + file.size, 0)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching media files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}