import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import connectDB from '@/lib/mongodb'
import { MediaFile } from '@/lib/models'

// Cloudflare R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sycamore-gallery'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-a7b32c693de1462d84477fe4fd2d364e.r2.dev'
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'
    const category = formData.get('category') as string || 'other'
    const customName = formData.get('customName') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Enhanced file type validation
    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv', 'video/webm'],
      audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac', 'audio/aac'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ]
    }

    const validTypes = [
      ...allowedTypes.image,
      ...allowedTypes.video,
      ...allowedTypes.audio,
      ...allowedTypes.document
    ]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type '${file.type}' not supported. Supported types: images, videos, audio, documents, and archives.` },
        { status: 400 }
      )
    }

    // Determine file type category
    let fileType = 'other'
    for (const [type, mimes] of Object.entries(allowedTypes)) {
      if (mimes.includes(file.type)) {
        fileType = type
        break
      }
    }

    // Generate file name
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    
    let fileName
    if (customName) {
      // Use custom name but ensure it's safe
      const safeName = customName.replace(/[^a-zA-Z0-9\-_.]/g, '_')
      fileName = `${folder}/${safeName}.${fileExtension}`
    } else {
      fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudflare R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'original-name': file.name,
        'custom-name': customName || '',
        'upload-date': new Date().toISOString(),
        'category': category,
        'folder': folder,
        'file-type': fileType,
        'description': description || '',
        'tags': tags || '',
        'uploaded-by': uploadedBy || ''
      }
    })

    await r2Client.send(uploadCommand)

    // Generate public URL
    const fileUrl = `${R2_PUBLIC_URL}/${fileName}`
    
    // Save to database
    const mediaFile = new MediaFile({
      filename: fileName,
      originalName: file.name,
      url: fileUrl,
      cloudflareKey: fileName,
      fileType: fileType as any,
      mimeType: file.type,
      size: file.size,
      folder: folder,
      description: description || undefined,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      uploadedBy: uploadedBy || '507f1f77bcf86cd799439011', // Default user ID
      isPublic: true
    })

    const savedFile = await mediaFile.save()

    return NextResponse.json({
      success: true,
      data: {
        id: savedFile._id,
        url: fileUrl,
        fileName: fileName,
        originalName: file.name,
        customName: customName,
        size: file.size,
        type: file.type,
        category: category,
        fileType: fileType,
        folder: folder,
        description: description,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      },
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading file to R2:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

// Get presigned URL for direct uploads (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')
    const contentType = searchParams.get('contentType')
    const folder = searchParams.get('folder') || 'general'
    const category = searchParams.get('category') || 'image'

    if (!fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: 'fileName and contentType are required' },
        { status: 400 }
      )
    }

    const fileExtension = fileName.split('.').pop()
    const key = `${folder}/${category}/${uuidv4()}.${fileExtension}`

    // Create the command for presigned URL
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'original-name': fileName,
        'upload-date': new Date().toISOString(),
        'category': category,
        'folder': folder
      }
    })

    // Generate presigned URL (valid for 15 minutes)
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 })
    
        return NextResponse.json({
          success: true,
          data: {
            uploadUrl,
            fileUrl: `${R2_PUBLIC_URL}/${key}`,
            key,
            fileName,
            contentType,
            folder,
            category
          }
        })  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}