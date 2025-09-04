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
  type: 'worship' | 'sermon' | 'podcast' | 'other'
  url: string
  thumbnailUrl?: string
  speaker?: string
  date: Date
  duration?: string
  tags: string[]
  viewCount: number
  isActive: boolean
  createdAt: Date
}

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'sermon' as MediaItem['type'],
    url: '',
    thumbnailUrl: '',
    speaker: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    tags: '',
    isActive: true
  })

  useEffect(() => {
    loadMediaItems()
  }, [])

  const loadMediaItems = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockData: MediaItem[] = [
        {
          id: '1',
          title: 'Sunday Worship Service',
          description: 'Powerful worship session with amazing songs',
          type: 'worship',
          url: 'https://youtube.com/watch?v=example1',
          speaker: 'Worship Team',
          date: new Date('2024-01-07'),
          duration: '45:30',
          tags: ['worship', 'praise', 'sunday'],
          viewCount: 234,
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '2',
          title: 'Faith and Purpose - Part 1',
          description: 'Deep dive into understanding God\'s purpose for your life',
          type: 'sermon',
          url: 'https://youtube.com/watch?v=example2',
          speaker: 'Pastor John',
          date: new Date('2024-01-07'),
          duration: '52:15',
          tags: ['faith', 'purpose', 'teaching'],
          viewCount: 456,
          isActive: true,
          createdAt: new Date()
        }
      ]
      setMediaItems(mockData)
    } catch (error) {
      console.error('Error loading media items:', error)
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
      type: 'sermon',
      url: '',
      thumbnailUrl: '',
      speaker: '',
      date: new Date().toISOString().split('T')[0],
      duration: '',
      tags: '',
      isActive: true
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
      url: media.url,
      thumbnailUrl: media.thumbnailUrl || '',
      speaker: media.speaker || '',
      date: new Date(media.date).toISOString().split('T')[0],
      duration: media.duration || '',
      tags: media.tags.join(', '),
      isActive: media.isActive
    })
    setIsModalOpen(true)
  }

  const handleSaveMedia = async () => {
    try {
      const mediaData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        date: new Date(formData.date)
      }

      // Replace with actual API call
      console.log('Saving media:', mediaData)
      setIsModalOpen(false)
      loadMediaItems()
    } catch (error) {
      console.error('Error saving media:', error)
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (confirm('Are you sure you want to delete this media item?')) {
      try {
        // Replace with actual API call
        console.log('Deleting media:', mediaId)
        loadMediaItems()
      } catch (error) {
        console.error('Error deleting media:', error)
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'worship': return Music
      case 'sermon': return Video
      case 'podcast': return Play
      default: return Video
    }
  }

  const filteredMedia = mediaItems.filter(media => {
    const matchesSearch = media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.speaker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || media.type === typeFilter
    return matchesSearch && matchesType
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['worship', 'sermon', 'podcast', 'other'].map((type) => {
            const count = mediaItems.filter(m => m.type === type).length
            const Icon = getTypeIcon(type)
            return (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 capitalize">{type}s</p>
                      <p className="text-2xl font-bold">{count}</p>
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
                <option value="">All Types</option>
                <option value="worship">Worship</option>
                <option value="sermon">Sermons</option>
                <option value="podcast">Podcasts</option>
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
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600 capitalize">{media.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{media.viewCount}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{media.title}</h3>
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
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Media Item' : 'Add New Media Item'}
              </h2>
              
              <div className="space-y-4">
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
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as MediaItem['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sermon">Sermon</option>
                    <option value="worship">Worship</option>
                    <option value="podcast">Podcast</option>
                    <option value="other">Other</option>
                  </select>
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
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveMedia}>
                  {isEditing ? 'Update' : 'Add'} Media
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
