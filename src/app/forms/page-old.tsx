'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
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
  FileText,
  Share2,
  Copy,
  Eye,
  Download,
  Settings,
  Link as LinkIcon
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Forms' }
]

interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface Form {
  id: string
  title: string
  description: string
  fields: FormField[]
  isActive: boolean
  shareableLink?: string
  submissionCount: number
  createdAt: string
  updatedAt: string
}

export default function FormsPage() {
  const { user } = useAuth()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    fields: [] as FormField[]
  })

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      const response = await fetch('/api/forms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setForms(data.data || [])
      }
    } catch (error) {
      console.error('Error loading forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const createForm = async () => {
    if (!newForm.title) return

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newForm)
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewForm({ title: '', description: '', fields: [] })
        loadForms()
      }
    } catch (error) {
      console.error('Error creating form:', error)
    }
  }

  const generateShareableLink = (formId: string) => {
    return `${window.location.origin}/forms/${formId}/submit`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadSubmissions = async (formId: string, formTitle: string) => {
    try {
      const response = await fetch(`/api/forms/${formId}/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${formTitle.replace(/[^a-zA-Z0-9]/g, '_')}_submissions.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading submissions:', error)
    }
  }

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forms Management</h1>
            <p className="text-gray-600 mt-1">Create and manage shareable forms for data collection</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Form title"
                value={newForm.title}
                onChange={(e) => setNewForm({...newForm, title: e.target.value})}
              />
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Form description"
                rows={3}
                value={newForm.description}
                onChange={(e) => setNewForm({...newForm, description: e.target.value})}
              />
              <div className="flex space-x-2">
                <Button onClick={createForm}>Create Form</Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Submissions:</span>
                    <span className="font-medium">{form.submissionCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Fields:</span>
                    <span className="font-medium">{form.fields.length}</span>
                  </div>

                  {/* Shareable Link */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Shareable Link:</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-50 p-2 rounded text-xs font-mono truncate">
                        {generateShareableLink(form.id)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateShareableLink(form.id))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generateShareableLink(form.id), '_blank')}
                      >
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadSubmissions(form.id, form.title)}
                      disabled={form.submissionCount === 0}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredForms.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Create your first form to get started.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
