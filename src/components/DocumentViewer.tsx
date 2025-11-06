import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Eye
} from 'lucide-react'

interface MediaFile {
  id: string
  filename: string
  originalName: string
  url: string
  fileType: 'image' | 'document' | 'audio' | 'video' | 'other'
  mimeType: string
  size: number
  folder: string
  description?: string
  tags: string[]
  uploadedBy: any
  createdAt: string
}

interface DocumentViewerProps {
  file: MediaFile
  isOpen: boolean
  onClose: () => void
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ file, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  if (!isOpen) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.originalName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExternalOpen = () => {
    window.open(file.url, '_blank')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string, mimeType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-blue-500" />
      case 'video':
        return <Video className="w-8 h-8 text-purple-500" />
      case 'audio':
        return <Music className="w-8 h-8 text-green-500" />
      case 'document':
        if (mimeType === 'application/pdf') {
          return <FileText className="w-8 h-8 text-red-500" />
        }
        return <FileText className="w-8 h-8 text-orange-500" />
      default:
        return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const renderFileContent = () => {
    switch (file.fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <img
              src={file.url}
              alt={file.originalName}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
          </div>
        )

      case 'video':
        return (
          <div className="flex items-center justify-center h-full bg-black">
            <video
              src={file.url}
              controls
              className="max-w-full max-h-full"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            <Music className="w-24 h-24 text-gray-400 mb-8" />
            <audio
              src={file.url}
              controls
              className="w-full max-w-md"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        )

      case 'document':
        if (file.mimeType === 'application/pdf') {
          return (
            <div className="h-full w-full">
              <iframe
                src={`${file.url}#view=FitH`}
                className="w-full h-full border-0"
                title={file.originalName}
              />
            </div>
          )
        }
        // For other document types, show preview with external link
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            {getFileIcon(file.fileType, file.mimeType)}
            <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
              {file.originalName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This file type cannot be previewed in the browser
            </p>
            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button onClick={handleExternalOpen} variant="outline" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            {getFileIcon(file.fileType, file.mimeType)}
            <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
              {file.originalName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Preview not available for this file type
            </p>
            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button onClick={handleExternalOpen} variant="outline" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-screen bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getFileIcon(file.fileType, file.mimeType)}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {file.originalName}
              </h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.folder}
                {file.description && ` • ${file.description}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls for images */}
            {file.fileType === 'image' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoom(Math.min(400, zoom + 25))}
                  disabled={zoom >= 400}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRotation((rotation + 90) % 360)}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExternalOpen}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderFileContent()}
        </div>

        {/* Footer with file info */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {file.tags && file.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>Tags:</span>
                  <div className="flex gap-1">
                    {file.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-200 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              Uploaded: {new Date(file.createdAt).toLocaleDateString()}
              {file.uploadedBy && ` by ${file.uploadedBy.firstName} ${file.uploadedBy.lastName}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer