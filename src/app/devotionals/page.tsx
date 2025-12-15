'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ViewModal, FormModal, ConfirmModal, OnboardingTour } from '@/components/common'
import { devotionalsTourSteps } from '@/components/common/tourSteps'
import { 
  Search, 
  Eye,
  Plus,
  Edit,
  Trash2,
  Heart,
  Calendar,
  User,
  BookOpen
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Devotionals' }
]

interface Devotional {
  _id: string
  id: string
  title: string
  verse: string
  content: string
  date: string
  author: string
  category: string
  readingPlan: string
  tags: string[]
  likes: number
  comments: number
  readTime: number
  questions: string[]
  isRead?: boolean
}

export default function DevotionalsPage() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([])
  const [filteredDevotionals, setFilteredDevotionals] = useState<Devotional[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    verse: '',
    content: '',
    author: 'Pastor Johnson',
    category: 'daily_bread',
    readingPlan: 'Through the Bible in a Year',
    tags: '',
    readTime: 5,
    questions: ''
  })

  useEffect(() => {
    loadDevotionals()
  }, [])

  useEffect(() => {
    filterDevotionals()
  }, [devotionals, searchTerm])

  const loadDevotionals = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/mobile/devotionals?limit=30`)
      const data = await response.json()
      
      if (data.success) {
        setDevotionals(data.data)
      }
    } catch (error) {
      console.error('Error loading devotionals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDevotionals = () => {
    let filtered = devotionals

    if (searchTerm) {
      filtered = filtered.filter(devotional =>
        devotional.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        devotional.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        devotional.verse.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredDevotionals(filtered)
  }

  const viewDevotional = (devotional: Devotional) => {
    setSelectedDevotional(devotional)
    setIsViewModalOpen(true)
  }

  const openEditModal = (devotional: Devotional) => {
    setSelectedDevotional(devotional)
    setFormData({
      title: devotional.title,
      verse: devotional.verse,
      content: devotional.content,
      author: devotional.author,
      category: devotional.category,
      readingPlan: devotional.readingPlan,
      tags: devotional.tags.join(', '),
      readTime: devotional.readTime,
      questions: devotional.questions.join('\\n')
    })
    setIsEditModalOpen(true)
  }

  const openAddModal = () => {
    setSelectedDevotional(null)
    setFormData({
      title: '',
      verse: '',
      content: '',
      author: 'Pastor Johnson',
      category: 'daily_bread',
      readingPlan: 'Through the Bible in a Year',
      tags: '',
      readTime: 5,
      questions: ''
    })
    setIsAddModalOpen(true)
  }

  const handleSaveDevotional = async () => {
    setSaving(true)
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        questions: formData.questions.split('\\n').filter(Boolean),
        readTime: Number(formData.readTime)
      }

      if (isEditModalOpen && selectedDevotional) {
        // Update existing devotional
        const response = await fetch('/api/mobile/devotionals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedDevotional.id, ...payload })
        })

        const data = await response.json()
        
        if (data.success) {
          alert('Devotional updated successfully!')
          loadDevotionals()
          setIsEditModalOpen(false)
        } else {
          alert('Failed to update devotional: ' + data.message)
        }
      } else {
        // Create new devotional
        const response = await fetch('/api/mobile/devotionals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const data = await response.json()
        
        if (data.success) {
          alert('Devotional created successfully!')
          loadDevotionals()
          setIsAddModalOpen(false)
        } else {
          alert('Failed to create devotional: ' + data.message)
        }
      }
    } catch (error) {
      console.error('Error saving devotional:', error)
      alert('Failed to save devotional')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDevotional = async (devotional: Devotional) => {
    if (!confirm(`Are you sure you want to delete "${devotional.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/mobile/devotionals?id=${devotional.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Devotional deleted successfully!')
        loadDevotionals()
      } else {
        alert('Failed to delete devotional: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting devotional:', error)
      alert('Failed to delete devotional')
    }
  }

  const stats = {
    total: devotionals.length,
    thisWeek: devotionals.filter(d => {
      const date = new Date(d.date)
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      return date >= weekAgo && date <= today
    }).length,
    totalLikes: devotionals.reduce((sum, d) => sum + (d.likes || 0), 0),
    totalComments: devotionals.reduce((sum, d) => sum + (d.comments || 0), 0)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Devotionals</h1>
            <p className="text-gray-600 mt-1">
              Manage daily devotionals and spiritual content
            </p>
          </div>
          <Button onClick={openAddModal} data-tour="add-devotional">
            <Plus className="h-4 w-4 mr-2" />
            Add Devotional
          </Button>
        </div>

        {/* Onboarding Tour */}
        <OnboardingTour steps={devotionalsTourSteps} storageKey="devotionals-tour-completed" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-tour="devotional-stats">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devotionals</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.thisWeek}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalLikes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalComments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devotionals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
        </Card>

        {/* Devotionals List */}
        <Card data-tour="devotional-list">
          <CardHeader>
            <CardTitle>Devotionals ({filteredDevotionals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-900">Loading devotionals...</div>
            ) : filteredDevotionals.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No devotionals found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDevotionals.map((devotional) => (
                  <div
                    key={devotional._id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{devotional.title}</h3>
                          <Badge className="bg-blue-100 text-blue-800">
                            {devotional.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>{devotional.verse}</strong>
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {devotional.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(devotional.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {devotional.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {devotional.likes || 0} likes
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {devotional.readTime} min read
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDevotional(devotional)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(devotional)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteDevotional(devotional)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Devotional Modal */}
        {selectedDevotional && (
          <ViewModal
            open={isViewModalOpen}
            onOpenChange={setIsViewModalOpen}
            title={selectedDevotional.title}
            size="lg"
            data={[
              {
                label: 'Category',
                value: <Badge className="bg-blue-100 text-blue-800">{selectedDevotional.category}</Badge>
              },
              {
                label: 'Scripture Reference',
                value: <span className="font-semibold">{selectedDevotional.verse}</span>,
                fullWidth: true
              },
              {
                label: 'Content',
                value: <p className="whitespace-pre-wrap">{selectedDevotional.content}</p>,
                fullWidth: true
              },
              ...(selectedDevotional.questions && selectedDevotional.questions.length > 0 ? [{
                label: 'Reflection Questions',
                value: (
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedDevotional.questions.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                ),
                fullWidth: true
              }] : []),
              {
                label: 'Author',
                value: selectedDevotional.author
              },
              {
                label: 'Date',
                value: new Date(selectedDevotional.date).toLocaleDateString()
              },
              {
                label: 'Likes',
                value: selectedDevotional.likes || 0
              },
              {
                label: 'Comments',
                value: selectedDevotional.comments || 0
              },
              {
                label: 'Read Time',
                value: `${selectedDevotional.readTime} minutes`
              },
              ...(selectedDevotional.tags && selectedDevotional.tags.length > 0 ? [{
                label: 'Tags',
                value: (
                  <div className="flex flex-wrap gap-2">
                    {selectedDevotional.tags.map((tag: string, i: number) => (
                      <Badge key={i}>{tag}</Badge>
                    ))}
                  </div>
                ),
                fullWidth: true
              }] : [])
            ]}
          />
        )}

        {/* Add/Edit Devotional Modal */}
        <FormModal
          open={isAddModalOpen || isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddModalOpen(false)
              setIsEditModalOpen(false)
              setSelectedDevotional(null)
            }
          }}
          title={isEditModalOpen ? 'Edit Devotional' : 'Add New Devotional'}
          description={isEditModalOpen ? 'Update devotional content and details' : 'Create a new daily devotional'}
          size="lg"
          loading={saving}
          saveText={isEditModalOpen ? 'Update' : 'Create'}
          onSave={handleSaveDevotional}
          fields={[
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              placeholder: 'Enter devotional title',
              required: true,
              value: formData.title,
              onChange: (val) => setFormData(prev => ({ ...prev, title: val })),
              fullWidth: true
            },
            {
              name: 'verse',
              label: 'Scripture Reference',
              type: 'text',
              placeholder: 'e.g., John 3:16',
              required: true,
              value: formData.verse,
              onChange: (val) => setFormData(prev => ({ ...prev, verse: val })),
              fullWidth: true
            },
            {
              name: 'content',
              label: 'Content',
              type: 'textarea',
              placeholder: 'Enter devotional content...',
              required: true,
              rows: 8,
              value: formData.content,
              onChange: (val) => setFormData(prev => ({ ...prev, content: val })),
              fullWidth: true
            },
            {
              name: 'author',
              label: 'Author',
              type: 'text',
              placeholder: 'Author name',
              required: true,
              value: formData.author,
              onChange: (val) => setFormData(prev => ({ ...prev, author: val }))
            },
            {
              name: 'category',
              label: 'Category',
              type: 'text',
              placeholder: 'e.g., daily_bread',
              required: true,
              value: formData.category,
              onChange: (val) => setFormData(prev => ({ ...prev, category: val }))
            },
            {
              name: 'readTime',
              label: 'Read Time (minutes)',
              type: 'number',
              min: 1,
              max: 30,
              required: true,
              value: formData.readTime,
              onChange: (val) => setFormData(prev => ({ ...prev, readTime: parseInt(val) || 5 }))
            },
            {
              name: 'tags',
              label: 'Tags (comma separated)',
              type: 'text',
              placeholder: 'faith, prayer, trust',
              value: formData.tags,
              onChange: (val) => setFormData(prev => ({ ...prev, tags: val })),
              fullWidth: true
            },
            {
              name: 'questions',
              label: 'Reflection Questions (one per line)',
              type: 'textarea',
              placeholder: 'Enter reflection questions, one per line...',
              rows: 4,
              value: formData.questions,
              onChange: (val) => setFormData(prev => ({ ...prev, questions: val })),
              fullWidth: true
            }
          ]}
        />
      </div>
    </DashboardLayout>
  )
}
