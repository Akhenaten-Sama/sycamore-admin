'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ViewModal, OnboardingTour } from '@/components/common'
import { galleryTourSteps } from '@/components/common/tourSteps'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Upload,
  Eye,
  Calendar,
  User,
  Tag,
  Folder,
  FolderPlus
} from 'lucide-react'
import { GalleryImage, GalleryImagePopulated, GalleryFolder, GalleryFolderPopulated, Event } from '@/types'
import { formatDateConsistent } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import FileUploadComponent from '@/components/FileUploadComponent'
import DocumentViewer from '@/components/DocumentViewer'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Gallery' }
]

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImagePopulated[]>([])
  const [folders, setFolders] = useState<GalleryFolderPopulated[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [folderFilter, setFolderFilter] = useState('')
  const [viewMode, setViewMode] = useState<'folders' | 'images'>('folders')
  const [selectedImage, setSelectedImage] = useState<GalleryImagePopulated | null>(null)
 
  const [selectedFolder, setSelectedFolder] = useState<GalleryFolderPopulated | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [availableFolders, setAvailableFolders] = useState<any[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    eventId: '',
    folderId: '',
    tags: '',
    isPublic: true,
    // New fields for file upload
    fileName: '',
    fileType: '',
    selectedFolder: '',
    fileUrl: ''
  })
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    eventId: '',
    isPublic: true
  })

  useEffect(() => {
    loadImages()
    loadEvents()
  }, [])

  const loadImages = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getGalleryImages({
        search: searchTerm,
        eventId: eventFilter || undefined
      })
      if (response.success && response.data) {
        setImages(Array.isArray(response.data) ? response.data as GalleryImagePopulated[] : [])
      }
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await apiClient.getEvents()
      if (response.success && response.data) {
        setEvents(Array.isArray(response.data) ? response.data as Event[] : [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const handleUploadFiles = () => {
    setSelectedImage(null)
    setIsEditing(false)
    resetForm()
    setIsModalOpen(true)
  }

  const handleEditImage = (image: GalleryImagePopulated) => {
    setSelectedImage(image)
    setIsEditing(true)
    setFormData({
      title: image.title,
      description: image.description || '',
      imageUrl: image.imageUrl,
      eventId: image.eventId?.id || '',
      folderId: image.folderId?.id || '',
      tags: image.tags?.join(', ') || '',
      isPublic: image.isPublic,
      // Add missing fields
      fileName: '',
      fileType: '',
      selectedFolder: '',
      fileUrl: ''
    })
    setIsModalOpen(true)
  }

  const handleViewFile = (file: any) => {
    setSelectedFile(file)
    setIsDocumentViewerOpen(true)
  }

  const handleViewImage = (image: GalleryImagePopulated) => {
    setSelectedImage(image)
    setIsViewModalOpen(true)
  }

  const handleSaveImage = async () => {
    try {
      const imageData = {
        ...formData,
        uploadedBy: '507f1f77bcf86cd799439011', // This should come from current user context
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }

      if (isEditing && selectedImage) {
        const response = await apiClient.updateGalleryImage(selectedImage.id, imageData)
        if (response.success) {
          loadImages()
          setIsModalOpen(false)
        }
      } else {
        const response = await apiClient.uploadGalleryImage(imageData)
        if (response.success) {
          loadImages()
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error('Error saving image:', error)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        const response = await apiClient.deleteGalleryImage(imageId)
        if (response.success) {
          loadImages()
        }
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }
  }

  useEffect(() => {
    loadImages()
    loadFolders()
    loadEvents()
    loadAvailableFolders()
  }, [])

  useEffect(() => {
    loadImages()
  }, [searchTerm, eventFilter, folderFilter])

  const loadFolders = async () => {
    try {
      const response = await apiClient.getGalleryFolders()
      if (response.success && response.data) {
        setFolders(Array.isArray(response.data) ? response.data as GalleryFolderPopulated[] : [])
      }
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  const handleCreateFolder = () => {
    setSelectedFolder(null)
    setIsEditing(false)
    setFolderFormData({
      name: '',
      description: '',
      eventId: '',
      isPublic: true
    })
    setIsFolderModalOpen(true)
  }

  const handleEditFolder = (folder: GalleryFolderPopulated) => {
    setSelectedFolder(folder)
    setIsEditing(true)
    setFolderFormData({
      name: folder.name,
      description: folder.description || '',
      eventId: folder.eventId?.id || '',
      isPublic: folder.isPublic
    })
    setIsFolderModalOpen(true)
  }

  const handleSaveFolder = async () => {
    try {
      setLoading(true)
      const folderData = {
        ...folderFormData,
        createdBy: '507f1f77bcf86cd799439011', // This should come from current user context
      }

      if (isEditing && selectedFolder) {
        const response = await apiClient.updateGalleryFolder(selectedFolder.id, folderData)
        if (response.success) {
          loadFolders()
          setIsFolderModalOpen(false)
        }
      } else {
        const response = await apiClient.createGalleryFolder(folderData)
        if (response.success) {
          loadFolders()
          setIsFolderModalOpen(false)
        }
      }
    } catch (error) {
      console.error('Error saving folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? All images in this folder will be moved to uncategorized.')) {
      try {
        const response = await apiClient.deleteGalleryFolder(folderId)
        if (response.success) {
          loadFolders()
        }
      } catch (error) {
        console.error('Error deleting folder:', error)
      }
    }
  }

  // New functions for file upload
  const loadAvailableFolders = async () => {
    try {
      const response = await apiClient.getGalleryFolders()
      if (response.success && response.data && Array.isArray(response.data)) {
        const dbFolders = (response.data as any[]).map((folder: any) => ({
          id: folder.id,
          name: folder.name
        }))
        
        // Add some default folders plus database folders
        setAvailableFolders([
          { id: 'general', name: 'General' },
          { id: 'events', name: 'Events' },
          { id: 'worship', name: 'Worship' },
          { id: 'youth', name: 'Youth' },
          { id: 'children', name: 'Children' },
          { id: 'documents', name: 'Documents' },
          { id: 'sermons', name: 'Sermons' },
          { id: 'announcements', name: 'Announcements' },
          ...dbFolders
        ])
      }
    } catch (error) {
      console.error('Failed to load folders:', error)
      // Fallback to default folders
      setAvailableFolders([
        { id: 'general', name: 'General' },
        { id: 'events', name: 'Events' },
        { id: 'worship', name: 'Worship' },
        { id: 'youth', name: 'Youth' },
        { id: 'children', name: 'Children' },
        { id: 'documents', name: 'Documents' },
        { id: 'sermons', name: 'Sermons' },
        { id: 'announcements', name: 'Announcements' }
      ])
    }
  }

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

  const isValidFileType = (fileType: string) => {
    return validTypes.includes(fileType)
  }

  const getFileCategory = (fileType: string) => {
    for (const [category, types] of Object.entries(allowedTypes)) {
      if (types.includes(fileType)) {
        return category
      }
    }
    return 'unknown'
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed', e.target.files)
    const file = e.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name, file.type, file.size)
      
      // Validate file type
      if (!isValidFileType(file.type)) {
        alert(`File type "${file.type}" is not supported. Please select a supported file type.`)
        // Reset the input
        e.target.value = ''
        return
      }
      
      setSelectedFile(file)
      // Auto-populate file name and type
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileType: file.type || 'unknown'
      }))
    } else {
      console.log('No file selected')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      console.log('File dropped:', file.name, file.type, file.size)
      
      // Validate file type
      if (!isValidFileType(file.type)) {
        alert(`File type "${file.type}" is not supported. Please select a supported file type.`)
        return
      }
      
      setSelectedFile(file)
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileType: file.type || 'unknown'
      }))
    }
  }

  const createNewFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const response = await apiClient.createGalleryFolder({
          name: newFolderName.trim(),
          description: `Auto-created folder: ${newFolderName.trim()}`,
          createdBy: '507f1f77bcf86cd799439011', // Should come from auth context
          isPublic: true
        })

        if (response.success && response.data) {
          const folderData = response.data as any
          const newFolder = {
            id: folderData.id,
            name: folderData.name
          }
          
          setAvailableFolders(prev => [...prev, newFolder])
          setFormData(prev => ({ ...prev, selectedFolder: newFolder.id }))
          setNewFolderName('')
          setShowNewFolderInput(false)
          
          // Refresh the main folders list
          loadFolders()
        } else {
          alert('Failed to create folder: ' + (response.error || 'Unknown error'))
        }
      } catch (error) {
        console.error('Error creating folder:', error)
        alert('Failed to create folder')
      }
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('folder', formData.selectedFolder || 'general')
      uploadFormData.append('customName', formData.fileName)

      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: uploadFormData
      })

      const result = await response.json()

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          fileUrl: result.data.url
        }))
        console.log('File uploaded successfully:', result.data)
      } else {
        console.error('Upload failed:', result.error)
        alert('Upload failed: ' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + error)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveFile = async () => {
    if (!formData.fileUrl) {
      alert('Please upload a file first')
      return
    }

    try {
      // Save file metadata to database
      const fileData = {
        title: formData.fileName,
        imageUrl: formData.fileUrl,
        folderId: formData.selectedFolder || undefined,
        isPublic: true,
        uploadedBy: '507f1f77bcf86cd799439011' // Should come from auth context
      }

      const response = await apiClient.uploadGalleryImage(fileData)
      if (response.success) {
        console.log('File saved to database successfully')
        setIsModalOpen(false)
        resetForm()
        loadImages()
        loadFolders() // Refresh folders to update image counts
      } else {
        console.error('Failed to save to database:', response.error)
        alert('Failed to save to database')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save to database')
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      eventId: '',
      folderId: '',
      tags: '',
      isPublic: true,
      fileName: '',
      fileType: '',
      selectedFolder: '',
      fileUrl: ''
    })
    setNewFolderName('')
    setShowNewFolderInput(false)
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
            <p className="text-gray-600 mt-1">Manage church photos and media</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('folders')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'folders'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Folder className="w-4 h-4 mr-1 inline" />
                Folders
              </button>
              <button
                onClick={() => setViewMode('images')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'images'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ImageIcon className="w-4 h-4 mr-1 inline" />
                Images
              </button>
            </div>
            
            {/* Action Buttons */}
            {viewMode === 'folders' && (
              <Button onClick={handleCreateFolder} className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4" />
                Create Folder
              </Button>
            )}
            <Button onClick={handleUploadFiles} className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={viewMode === 'folders' ? "Search folders..." : "Search images..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              {viewMode === 'images' && (
                <select
                  value={folderFilter}
                  onChange={(e) => setFolderFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Folders</option>
                  <option value="uncategorized">Uncategorized</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gallery Content */}
        {viewMode === 'folders' ? (
          /* Folders View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Folders ({folders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-600">Loading folders...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {folders.map((folder) => (
                    <div key={folder.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
                        {folder.coverImage ? (
                          <img
                            src={folder.coverImage}
                            alt={folder.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => {
                              setFolderFilter(folder.id)
                              setViewMode('images')
                            }}
                          />
                        ) : (
                          <Folder className="w-16 h-16 text-gray-400" />
                        )}
                        {!folder.isPublic && (
                          <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            Private
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          {folder.imageCount} images
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm mb-1 truncate text-gray-900">{folder.name}</h3>
                        {folder.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{folder.description}</p>
                        )}
                        
                        {/* Event and Date */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <Calendar className="w-3 h-3" />
                          {formatDateConsistent(new Date(folder.createdAt))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFolderFilter(folder.id)
                                setViewMode('images')
                              }}
                              className="h-6 px-2"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditFolder(folder)}
                              className="h-6 px-2"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="h-6 px-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {folders.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No folders found. Create your first folder to organize your images.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Images View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images ({images.length})
                {folderFilter && (
                  <span className="text-sm font-normal text-gray-500">
                    in {folders.find(f => f.id === folderFilter)?.name || 'Selected Folder'}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-600">Loading images...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-square relative bg-gray-100">
                        <img
                          src={image.imageUrl}
                          alt={image.title}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => handleViewImage(image)}
                        />
                        {!image.isPublic && (
                          <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            Private
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm mb-1 truncate text-gray-900">{image.title}</h3>
                        {image.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{image.description}</p>
                        )}
                        
                        {/* Event and Date */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <Calendar className="w-3 h-3" />
                          {formatDateConsistent(new Date(image.uploadedAt))}
                        </div>

                        {/* Folder info */}
                        {image.folderId && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Folder className="w-3 h-3" />
                            {image.folderId.name}
                          </div>
                        )}

                        {/* Tags */}
                        {image.tags && image.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {image.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {image.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{image.tags.length - 2}</span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewImage(image)}
                              className="h-6 px-2"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditImage(image)}
                              className="h-6 px-2"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteImage(image.id)}
                              className="h-6 px-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {images.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No images found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Edit File' : 'Upload New File'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
              
              {!isEditing && (
                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File
                    </label>
                    
                    {/* Simplified File Input Approach */}
                    <div className="space-y-3">
                      {/* Primary visible file input */}
                      <div>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
                          className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      
                      {/* Drag and drop zone as alternative */}
                      <div 
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="text-4xl">📁</div>
                          <div className="text-lg font-medium text-gray-700">
                            Or drag and drop files here
                          </div>
                          <div className="text-xs text-gray-400">
                            📸 Images: JPEG, PNG, GIF, WebP, SVG<br/>
                            🎥 Videos: MP4, AVI, MOV, WMV, MKV, WebM<br/>
                            🎵 Audio: MP3, WAV, OGG, M4A, FLAC, AAC<br/>
                            📄 Documents: PDF, Word, Excel, PowerPoint, TXT, CSV<br/>
                            📦 Archives: ZIP, RAR, 7Z
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* File Selection Feedback */}
                    {selectedFile && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span className="text-sm font-medium text-green-800">
                            File Selected: {selectedFile.name}
                          </span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB | 
                          Type: {selectedFile.type} | 
                          Category: {getFileCategory(selectedFile.type)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Name (Auto-fetched) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Name
                    </label>
                    <Input
                      value={formData.fileName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fileName: e.target.value }))}
                      placeholder="File name will be auto-populated"
                      className="bg-gray-50"
                    />
                  </div>

                  {/* File Type (Auto-detected) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Type
                    </label>
                    <Input
                      value={formData.fileType || ''}
                      readOnly
                      placeholder="File type will be auto-detected"
                      className="bg-gray-50"
                    />
                  </div>

                  {/* Folder Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Folder
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.selectedFolder || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, selectedFolder: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select existing folder</option>
                        {availableFolders.map(folder => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                        className="whitespace-nowrap"
                      >
                        {showNewFolderInput ? 'Cancel' : 'Create New'}
                      </Button>
                    </div>
                    
                    {showNewFolderInput && (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="New folder name"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={createNewFolder}
                          size="sm"
                        >
                          Create
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div>
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploading}
                      className="w-full"
                    >
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                  </div>

                  {/* File URL (Auto-populated after upload) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File URL
                    </label>
                    <Input
                      value={formData.fileUrl || ''}
                      readOnly
                      placeholder="File URL will appear here after upload"
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveFile}
                      disabled={!formData.fileUrl}
                    >
                      Save to Database
                    </Button>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Image title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Image description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event (Optional)
                    </label>
                    <select
                      value={formData.eventId}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No specific event</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Folder (Optional)
                    </label>
                    <select
                      value={formData.folderId}
                      onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No specific folder</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma separated)
                    </label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="church, worship, fellowship"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="isPublic" className="text-sm text-gray-700">
                      Make image publicly visible
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveImage}>
                      Update Image
                    </Button>
                  </div>
                </div>
              )}
              </div>
              
              {!isEditing && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setIsViewModalOpen(false)}>
            <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-lg overflow-hidden">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 text-white">{selectedImage.title}</h3>
                  {selectedImage.description && (
                    <p className="text-gray-600 mb-3">{selectedImage.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>Uploaded: {formatDateConsistent(new Date(selectedImage.uploadedAt))}</span>
                      {selectedImage.eventId && (
                        <span>Event: {selectedImage.eventId.name}</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsViewModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Folder Modal */}
        {isFolderModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Folder' : 'Create New Folder'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder Name
                  </label>
                  <Input
                    value={folderFormData.name}
                    onChange={(e) => setFolderFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Christmas 2023, Youth Camp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={folderFormData.description}
                    onChange={(e) => setFolderFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this photo collection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Event (Optional)
                  </label>
                  <select
                    value={folderFormData.eventId}
                    onChange={(e) => setFolderFormData(prev => ({ ...prev, eventId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No specific event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="folderIsPublic"
                    checked={folderFormData.isPublic}
                    onChange={(e) => setFolderFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="folderIsPublic" className="ml-2 block text-sm text-gray-900">
                    Make this folder public
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsFolderModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveFolder}>
                  {isEditing ? 'Update' : 'Create'} Folder
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer */}
        {selectedFile && isDocumentViewerOpen && (
          <DocumentViewer
            file={{
              id: 'temp-preview',
              filename: selectedFile.name,
              originalName: selectedFile.name,
              url: URL.createObjectURL(selectedFile),
              fileType: getFileCategory(selectedFile.type) as 'image' | 'document' | 'audio' | 'video' | 'other',
              mimeType: selectedFile.type,
              size: selectedFile.size,
              folder: 'temp',
              description: 'Preview file',
              tags: [],
              uploadedBy: 'temp' as any,
              createdAt: new Date().toISOString()
            }}
            isOpen={isDocumentViewerOpen}
            onClose={() => {
              setIsDocumentViewerOpen(false)
              setSelectedFile(null)
            }}
          />
        )}
        
        <OnboardingTour steps={galleryTourSteps} storageKey="gallery-tour-completed" />
      </div>
    </DashboardLayout>
  )
}
