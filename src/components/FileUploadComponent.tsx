import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText,
  AlertCircle,
  CheckCircle,
  Folder,
  FolderPlus,
  Edit2,
  Save
} from 'lucide-react'

interface UploadComponentProps {
  onUploadComplete: (files: UploadedFile[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  folder?: string
  userId?: string
}

interface UploadedFile {
  id: string
  url: string
  fileName: string
  originalName: string
  customName?: string
  size: number
  type: string
  category: string
  fileType: string
  folder: string
  description?: string
  tags: string[]
}

interface FileUpload {
  file: File
  preview?: string
  uploading: boolean
  uploaded: boolean
  error?: string
  progress: number
  uploadedData?: UploadedFile
  // Enhanced metadata
  customName?: string
  description?: string
  tags?: string[]
  selectedFolder?: string
  editingMetadata?: boolean
}

const FileUploadComponent: React.FC<UploadComponentProps> = ({
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  acceptedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.7z'],
  folder = 'general',
  userId = '507f1f77bcf86cd799439011'
}) => {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [availableFolders, setAvailableFolders] = useState<string[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState(folder)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadAvailableFolders()
  }, [])

  const loadAvailableFolders = async () => {
    try {
      // You can create an API endpoint to get existing folders
      // For now, using common folder names
      setAvailableFolders([
        'general', 
        'events', 
        'worship', 
        'youth', 
        'children', 
        'documents', 
        'sermons',
        'announcements',
        'testimonies',
        'gallery'
      ])
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  const getFileCategory = (fileType: string): string => {
    if (fileType.startsWith('image/')) return 'image'
    if (fileType.startsWith('video/')) return 'video'
    if (fileType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const getFileIcon = (fileType: string) => {
    const category = getFileCategory(fileType)
    switch (category) {
      case 'image': return <ImageIcon className="w-8 h-8 text-blue-500" />
      case 'video': return <Video className="w-8 h-8 text-purple-500" />
      case 'audio': return <Music className="w-8 h-8 text-green-500" />
      case 'document': return <FileText className="w-8 h-8 text-orange-500" />
      default: return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''))
      }
      return file.type === type || file.name.toLowerCase().endsWith(type)
    })

    if (!isValidType) {
      return 'File type not supported'
    }

    return null
  }

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const handleFileSelect = async (selectedFiles: FileList) => {
    const newFiles: FileUpload[] = []

    for (let i = 0; i < selectedFiles.length && files.length + newFiles.length < maxFiles; i++) {
      const file = selectedFiles[i]
      const error = validateFile(file)
      const preview = await createFilePreview(file)

      newFiles.push({
        file,
        preview,
        uploading: false,
        uploaded: false,
        error: error || undefined,
        progress: 0,
        selectedFolder: selectedFolder,
        customName: file.name.split('.')[0], // Default to filename without extension
        description: '',
        tags: [],
        editingMetadata: false
      })
    }

    setFiles(prev => [...prev, ...newFiles])
  }

  const createNewFolder = () => {
    if (newFolderName.trim() && !availableFolders.includes(newFolderName.trim())) {
      const folderName = newFolderName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '_')
      setAvailableFolders(prev => [...prev, folderName])
      setSelectedFolder(folderName)
      setNewFolderName('')
      setShowNewFolderInput(false)
    }
  }

  const updateFileMetadata = (index: number, field: string, value: any) => {
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    ))
  }

  const toggleMetadataEdit = (index: number) => {
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, editingMetadata: !f.editingMetadata } : f
    ))
  }

  const uploadFile = async (fileUpload: FileUpload, index: number): Promise<void> => {
    const formData = new FormData()
    formData.append('file', fileUpload.file)
    formData.append('folder', fileUpload.selectedFolder || selectedFolder)
    formData.append('category', getFileCategory(fileUpload.file.type))
    formData.append('customName', fileUpload.customName || '')
    formData.append('description', fileUpload.description || '')
    formData.append('tags', fileUpload.tags?.join(',') || '')
    formData.append('uploadedBy', userId)

    try {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, uploading: true, progress: 0 } : f
      ))

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map((f, i) => 
          i === index && f.uploading ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
        ))
      }, 200)

      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      const result = await response.json()

      if (result.success) {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { 
            ...f, 
            uploading: false, 
            uploaded: true, 
            progress: 100,
            uploadedData: result.data 
          } : f
        ))
      } else {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { 
            ...f, 
            uploading: false, 
            uploaded: false, 
            error: result.error || 'Upload failed' 
          } : f
        ))
      }
    } catch (error) {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          uploading: false, 
          uploaded: false, 
          error: 'Network error' 
        } : f
      ))
    }
  }

  const uploadAllFiles = async () => {
    const filesToUpload = files.filter(f => !f.uploaded && !f.error && !f.uploading)
    
    await Promise.all(
      filesToUpload.map(async (fileUpload, originalIndex) => {
        const index = files.findIndex(f => f === fileUpload)
        await uploadFile(fileUpload, index)
      })
    )

    // Call onUploadComplete with successfully uploaded files
    const uploadedFiles = files
      .filter(f => f.uploaded && f.uploadedData)
      .map(f => f.uploadedData!)
    
    if (uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Folder Selection */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Upload Destination</h4>
        <div className="flex gap-2 items-center">
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableFolders.map(folderName => (
              <option key={folderName} value={folderName}>
                {folderName.charAt(0).toUpperCase() + folderName.slice(1)}
              </option>
            ))}
          </select>
          
          {!showNewFolderInput ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolderInput(true)}
              className="flex items-center gap-1"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </Button>
          ) : (
            <div className="flex gap-1">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-32"
                onKeyPress={(e) => e.key === 'Enter' && createNewFolder()}
              />
              <Button size="sm" onClick={createNewFolder}>
                <Save className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setShowNewFolderInput(false)
                  setNewFolderName('')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to browse
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Supports images, videos, audio, documents, and archives up to {maxFileSize}MB
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            <Button
              onClick={uploadAllFiles}
              disabled={files.every(f => f.uploaded || f.uploading || f.error)}
              size="sm"
            >
              Upload All
            </Button>
          </div>

          <div className="space-y-3">
            {files.map((fileUpload, index) => (
              <div
                key={index}
                className="bg-white border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {fileUpload.preview ? (
                      <img
                        src={fileUpload.preview}
                        alt={fileUpload.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(fileUpload.file.type)
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileUpload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileUpload.file.size)} • {getFileCategory(fileUpload.file.type)}
                    </p>
                    
                    {/* Progress Bar */}
                    {fileUpload.uploading && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${fileUpload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {fileUpload.error && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fileUpload.error}
                      </p>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {fileUpload.uploaded && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {fileUpload.uploading && (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    
                    {!fileUpload.uploaded && !fileUpload.uploading && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMetadataEdit(index)}
                        className="h-7 px-2"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFile(index)}
                      disabled={fileUpload.uploading}
                      className="h-7 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Metadata Editing */}
                {fileUpload.editingMetadata && !fileUpload.uploaded && (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Custom Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom Name
                        </label>
                        <Input
                          value={fileUpload.customName || ''}
                          onChange={(e) => updateFileMetadata(index, 'customName', e.target.value)}
                          placeholder="Custom filename"
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Folder */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Folder
                        </label>
                        <select
                          value={fileUpload.selectedFolder || selectedFolder}
                          onChange={(e) => updateFileMetadata(index, 'selectedFolder', e.target.value)}
                          className="h-8 w-full px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {availableFolders.map(folderName => (
                            <option key={folderName} value={folderName}>
                              {folderName.charAt(0).toUpperCase() + folderName.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={fileUpload.description || ''}
                        onChange={(e) => updateFileMetadata(index, 'description', e.target.value)}
                        placeholder="File description..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tags (comma separated)
                      </label>
                      <Input
                        value={fileUpload.tags?.join(', ') || ''}
                        onChange={(e) => updateFileMetadata(index, 'tags', e.target.value.split(',').map(tag => tag.trim()))}
                        placeholder="church, worship, event"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => toggleMetadataEdit(index)}
                        className="h-7"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadComponent