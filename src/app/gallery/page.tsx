'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    eventId: '',
    folderId: '',
    tags: '',
    isPublic: true
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

  const handleUploadImage = () => {
    setSelectedImage(null)
    setIsEditing(false)
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      eventId: '',
      folderId: '',
      tags: '',
      isPublic: true
    })
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
      isPublic: image.isPublic
    })
    setIsModalOpen(true)
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
  }, [])

  useEffect(() => {
    loadImages()
  }, [searchTerm, eventFilter, folderFilter])

  const loadFolders = async () => {
    try {
      // TODO: Implement API endpoint for folders
      // const response = await apiClient.getGalleryFolders()
      // if (response.success && response.data) {
      //   setFolders(response.data)
      // }
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
        // Update existing folder - simplified for now
        console.log('Updating folder:', folderData)
        loadFolders()
        setIsFolderModalOpen(false)
        setIsEditing(false)
        setFolderFormData({ name: '', description: '', eventId: '', isPublic: false })
      } else {
        // Create new folder - simplified for now
        console.log('Creating folder:', folderData)
        const newFolder = {
          id: Date.now().toString(),
          ...folderData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          eventId: null,
          imageCount: 0
        }
        setFolders(prev => [...prev, newFolder as any])
        setIsFolderModalOpen(false)
        setIsEditing(false)
        setFolderFormData({ name: '', description: '', eventId: '', isPublic: false })
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
        // TODO: Implement API endpoint for deleting folders
        // const response = await apiClient.deleteGalleryFolder(folderId)
        // if (response.success) {
        //   loadFolders()
        // }
      } catch (error) {
        console.error('Error deleting folder:', error)
      }
    }
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
            <Button onClick={handleUploadImage} className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Image
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Image' : 'Upload New Image'}
              </h2>
              
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
                    Image URL *
                  </label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
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
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveImage}>
                  {isEditing ? 'Update' : 'Upload'} Image
                </Button>
              </div>
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
      </div>
    </DashboardLayout>
  )
}
