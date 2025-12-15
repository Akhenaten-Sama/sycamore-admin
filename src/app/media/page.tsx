'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/common'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Play,
  Music,
  Video,
  ExternalLink,
  Calendar,
  User,
  Eye
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Media Library' }
]

interface MediaItem {
  id: string
  title: string
  description: string
  type: 'video' | 'audio' | 'photo' | 'document' | 'other'
  category: 'sermon' | 'worship' | 'announcement' | 'teaching' | 'testimony' | 'other'
  url: string
  thumbnailUrl?: string
  speaker?: string
  date: Date
  duration?: string
  tags: string[]
  viewCount: number
  isActive: boolean
  isLive: boolean
  createdAt: Date
}

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video' as MediaItem['type'],
    category: 'sermon' as MediaItem['category'],
    url: '',
    thumbnailUrl: '',
    speaker: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    tags: '',
    isActive: true,
    isLive: false
  })

  useEffect(() => {
    loadMediaItems()
  }, [searchTerm, typeFilter, categoryFilter])

  const loadMediaItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/media?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch media items')
      }
      
      const result = await response.json()
      if (result.success) {
        const formattedItems = result.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          type: item.type,
          category: item.category || 'other',
          url: item.url,
          thumbnailUrl: item.thumbnailUrl,
          speaker: item.speaker || '',
          date: new Date(item.date),
          duration: item.duration || '',
          tags: item.tags || [],
          viewCount: item.viewCount || 0,
          isActive: item.isActive,
          isLive: item.isLive || false,
          createdAt: new Date(item.createdAt)
        }))
        setMediaItems(formattedItems)
      }
    } catch (error) {
      console.error('Error loading media items:', error)
      // Show fallback message or empty state
      setMediaItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMedia = () => {
    setSelectedMedia(null)
    setIsEditing(false)
    setFormData({
      title: '',
      description: '',
      type: 'video',
      category: 'sermon',
      url: '',
      thumbnailUrl: '',
      speaker: '',
      date: new Date().toISOString().split('T')[0],
      duration: '',
      tags: '',
      isActive: true,
      isLive: false
    })
    setIsModalOpen(true)
  }

  const handleEditMedia = (media: MediaItem) => {
    setSelectedMedia(media)
    setIsEditing(true)
    setFormData({
      title: media.title,
      description: media.description,
      type: media.type,
      category: media.category,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl || '',
      speaker: media.speaker || '',
      date: new Date(media.date).toISOString().split('T')[0],
      duration: media.duration || '',
      tags: media.tags.join(', '),
      isActive: media.isActive,
      isLive: media.isLive
    })
    setIsModalOpen(true)
  }

  const handleSaveMedia = async () => {
    // Basic validation
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!formData.url.trim()) {
      alert('Please enter a URL')
      return
    }
    if (!formData.date) {
      alert('Please select a date')
      return
    }

    try {
      setLoading(true)
      
      const mediaData: any = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        date: formData.date
      }

      const url = '/api/media'
      const method = isEditing ? 'PUT' : 'POST'
      
      if (isEditing && selectedMedia) {
        mediaData.id = selectedMedia.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(mediaData)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} media`)
      }

      const result = await response.json()
      if (result.success) {
        setIsModalOpen(false)
        await loadMediaItems()
      } else {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} media`)
      }
    } catch (error) {
      console.error('Error saving media:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (confirm('Are you sure you want to delete this media item?')) {
      try {
        setLoading(true)
        
        const response = await fetch(`/api/media?id=${mediaId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to delete media')
        }

        const result = await response.json()
        if (result.success) {
          await loadMediaItems()
        } else {
          throw new Error(result.error || 'Failed to delete media')
        }
      } catch (error) {
        console.error('Error deleting media:', error)
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio': return Music
      case 'video': return Video
      case 'photo': return Play
      case 'document': return Play
      default: return Video
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sermon': return 'bg-blue-100 text-blue-800'
      case 'worship': return 'bg-purple-100 text-purple-800'
      case 'announcement': return 'bg-green-100 text-green-800'
      case 'teaching': return 'bg-yellow-100 text-yellow-800'
      case 'testimony': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredMedia = mediaItems.filter(media => {
    const matchesSearch = media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.speaker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || media.type === typeFilter
    const matchesCategory = !categoryFilter || media.category === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600 mt-1">Manage worship songs, sermons, and ministry content</p>
          </div>
          <Button onClick={handleCreateMedia} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Media
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { key: 'sermon', label: 'Sermons', icon: Video },
            { key: 'worship', label: 'Worship', icon: Music },
            { key: 'teaching', label: 'Teachings', icon: Play },
            { key: 'announcement', label: 'Announcements', icon: Video },
            { key: 'testimony', label: 'Testimonies', icon: Video },
            { key: 'other', label: 'Other', icon: Video }
          ].map(({ key, label, icon: Icon }) => {
            const count = mediaItems.filter(m => m.category === key).length
            return (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{label}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <Icon className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search media..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Media Types</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="photo">Photos</option>
                <option value="document">Documents</option>
                <option value="other">Other</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="sermon">Sermons</option>
                <option value="worship">Worship</option>
                <option value="teaching">Teachings</option>
                <option value="announcement">Announcements</option>
                <option value="testimony">Testimonies</option>
                <option value="other">Other</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((media) => {
            const TypeIcon = getTypeIcon(media.type)
            return (
              <Card key={media.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <TypeIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-600 capitalize">{media.type}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(media.category)}`}>
                        {media.category}
                      </span>
                      {media.isLive && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                          🔴 LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{media.viewCount}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900">{media.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{media.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    {media.speaker && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{media.speaker}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(media.date).toLocaleDateString()}
                      </span>
                    </div>
                    {media.duration && (
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{media.duration}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {media.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(media.url, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Watch
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMedia(media)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMedia(media.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          
          {filteredMedia.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No media items found</p>
              <Button onClick={handleCreateMedia} className="mt-4">
                Add your first media item
              </Button>
            </div>
          )}
        </div>

        {/* Media Modal */}
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={isEditing ? 'Edit Media Item' : 'Add New Media Item'}
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="media-form">
                {isEditing ? 'Update' : 'Add'} Media
              </Button>
            </>
          }
        >
          <form id="media-form" onSubmit={(e) => { e.preventDefault(); handleSaveMedia(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter media title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Media Type * (Format)
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as MediaItem['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="photo">Photo</option>
                <option value="document">Document</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">The format of the media file</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category * (Content Type)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as MediaItem['category'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sermon">Sermon</option>
                <option value="worship">Worship</option>
                <option value="teaching">Teaching</option>
                <option value="announcement">Announcement</option>
                <option value="testimony">Testimony</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">What type of content this is</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speaker/Artist
              </label>
              <Input
                value={formData.speaker}
                onChange={(e) => setFormData(prev => ({ ...prev, speaker: e.target.value }))}
                placeholder="Speaker or artist name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <Input
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="45:30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="worship, praise, sunday (comma separated)"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active (visible to users)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLive"
                checked={formData.isLive}
                onChange={(e) => setFormData(prev => ({ ...prev, isLive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isLive" className="text-sm text-gray-700">
                🔴 Live Stream (shows in "Sundays at Sycamore" section)
              </label>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
