import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export interface FileUploadOptions {
  folder?: string
  customName?: string
  contentType?: string
}

/**
 * Upload file to Cloudflare R2
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  originalName: string,
  options: FileUploadOptions = {}
): Promise<UploadResult> {
  try {
    const { folder = 'uploads', customName, contentType } = options
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = originalName.split('.').pop()
    const fileName = customName || `${timestamp}-${randomString}.${fileExtension}`
    const key = folder ? `${folder}/${fileName}` : fileName

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || getContentType(originalName),
      Metadata: {
        originalName: originalName,
        uploadedAt: new Date().toISOString(),
      },
    })

    await r2Client.send(command)

    const publicUrl = `${R2_PUBLIC_URL}/${key}`

    return {
      success: true,
      url: publicUrl,
      key: key,
    }
  } catch (error) {
    console.error('R2 upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Delete file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)
    return true
  } catch (error) {
    console.error('R2 delete error:', error)
    return false
  }
}

/**
 * List files in a folder
 */
export async function listR2Files(folder?: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: folder ? `${folder}/` : undefined,
      MaxKeys: 1000,
    })

    const response = await r2Client.send(command)
    
    return {
      success: true,
      files: response.Contents?.map(file => ({
        key: file.Key!,
        size: file.Size!,
        lastModified: file.LastModified!,
        url: `${R2_PUBLIC_URL}/${file.Key}`,
      })) || [],
    }
  } catch (error) {
    console.error('R2 list error:', error)
    return {
      success: false,
      files: [],
      error: error instanceof Error ? error.message : 'List failed',
    }
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const contentTypes: { [key: string]: string } = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    
    // Video
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  }
  
  return contentTypes[ext || ''] || 'application/octet-stream'
}

/**
 * Get file type category
 */
export function getFileTypeCategory(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
  const audioExts = ['mp3', 'wav', 'flac', 'aac']
  const videoExts = ['mp4', 'mov', 'avi', 'mkv']
  
  if (imageExts.includes(ext || '')) return 'image'
  if (documentExts.includes(ext || '')) return 'document'
  if (audioExts.includes(ext || '')) return 'audio'
  if (videoExts.includes(ext || '')) return 'video'
  
  return 'other'
}