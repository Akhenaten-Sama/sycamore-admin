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
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Mail,
  X
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Forms Management' }
]

interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface FormSubmission {
  id: string
  data: Record<string, any>
  submittedAt: string
  submitterName?: string
  submitterEmail?: string
}

interface Form {
  id: string
  title: string
  description: string
  fields: FormField[]
  isActive: boolean
  submissions?: FormSubmission[]
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
  const [expandedForms, setExpandedForms] = useState<Record<string, boolean>>({})
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    fields: [] as FormField[]
  })
  const [newField, setNewField] = useState<Partial<FormField>>({
    label: '',
    type: 'text' as const,
    required: false,
    options: [],
    placeholder: ''
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
        // Fetch full form data including submissions for each form
        const formsWithSubmissions = await Promise.all(
          (data.data || []).map(async (form: Form) => {
            try {
              const formResponse = await fetch(`/api/forms/${form.id}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              })
              if (formResponse.ok) {
                const fullFormData = await formResponse.json()
                return {
                  ...form,
                  submissions: fullFormData.data?.submissions || []
                }
              }
            } catch (err) {
              console.error(`Error fetching form ${form.id}:`, err)
            }
            return form
          })
        )
        setForms(formsWithSubmissions)
      }
    } catch (error) {
      console.error('Error loading forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const addField = () => {
    if (!newField.label) return

    const field: FormField = {
      id: Date.now().toString(),
      label: newField.label,
      type: newField.type || 'text',
      required: newField.required || false,
      options: newField.type === 'select' || newField.type === 'checkbox' 
        ? (newField.options || []).filter(opt => opt.trim()) 
        : undefined,
      placeholder: newField.placeholder || undefined
    }

    setNewForm(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }))

    setNewField({
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: ''
    })
  }

  const removeField = (fieldId: string) => {
    setNewForm(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }))
  }

  const createForm = async () => {
    if (!newForm.title || newForm.fields.length === 0) return

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

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        loadForms()
      }
    } catch (error) {
      console.error('Error updating form status:', error)
    }
  }

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        loadForms()
      }
    } catch (error) {
      console.error('Error deleting form:', error)
    }
  }

  const generateShareableLink = (formId: string) => {
    return `${window.location.origin}/forms/${formId}/submit`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Link copied to clipboard!')
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

  const toggleFormExpansion = (formId: string) => {
    setExpandedForms(prev => ({
      ...prev,
      [formId]: !prev[formId]
    }))
  }

  const renderFieldValue = (field: FormField, value: any) => {
    if (!value) return <span className="text-gray-400">No response</span>
    
    if (field.type === 'checkbox' && Array.isArray(value)) {
      return <span>{value.join(', ')}</span>
    }
    
    if (field.type === 'date') {
      return <span>{new Date(value).toLocaleDateString()}</span>
    }
    
    return <span>{String(value)}</span>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Create New Form</h2>
                <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Form Title *
                    </label>
                    <Input
                      value={newForm.title}
                      onChange={(e) => setNewForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter form title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={newForm.description}
                      onChange={(e) => setNewForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter form description"
                    />
                  </div>
                </div>

                {/* Form Fields Builder */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Form Fields</h3>
                  
                  {/* Add New Field */}
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-base">Add New Field</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                          <Input
                            value={newField.label}
                            onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                            placeholder="Field label"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={newField.type}
                            onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="date">Date</option>
                            <option value="select">Select</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="file">File</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                          <Input
                            value={newField.placeholder}
                            onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                            placeholder="Placeholder text"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newField.required}
                              onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                              className="mr-2"
                            />
                            Required
                          </label>
                        </div>
                      </div>
                      
                      {(newField.type === 'select' || newField.type === 'checkbox') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                          <textarea
                            value={(newField.options || []).join('\n')}
                            onChange={(e) => setNewField(prev => ({ 
                              ...prev, 
                              options: e.target.value.split('\n').filter(opt => opt.trim()) 
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                          />
                        </div>
                      )}
                      
                      <Button onClick={addField} disabled={!newField.label}>
                        Add Field
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Fields */}
                  {newForm.fields.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Form Fields ({newForm.fields.length}):</h4>
                      {newForm.fields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div>
                            <span className="font-medium">{field.label}</span>
                            <span className="text-gray-500 text-sm ml-2">({field.type})</span>
                            {field.required && <span className="text-red-500 text-sm ml-1">*</span>}
                            {field.placeholder && <span className="text-gray-400 text-sm ml-2">"{field.placeholder}"</span>}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeField(field.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createForm}
                  disabled={!newForm.title || newForm.fields.length === 0}
                >
                  Create Form
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Forms List */}
        <div className="space-y-6">
          {filteredForms.length === 0 ? (
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
          ) : (
            filteredForms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-xl">{form.title}</CardTitle>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {form.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      {form.description && (
                        <p className="text-gray-600 mt-1">{form.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{form.submissionCount} submissions</span>
                        <span>{form.fields.length} fields</span>
                        <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateShareableLink(form.id))}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFormStatus(form.id, form.isActive)}
                      >
                        {form.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteForm(form.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Shareable Link */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Shareable Link:</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-xs text-blue-600 bg-white px-2 py-1 rounded border">
                        {generateShareableLink(form.id)}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generateShareableLink(form.id), '_blank')}
                      >
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Form Fields:</h4>
                    <div className="flex flex-wrap gap-2">
                      {form.fields.map((field) => (
                        <span
                          key={field.id}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                        >
                          {field.label} ({field.type})
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Submissions Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Submissions ({form.submissionCount})
                      </h4>
                      {form.submissionCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFormExpansion(form.id)}
                        >
                          {expandedForms[form.id] ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Responses
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show Responses
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {form.submissionCount === 0 ? (
                      <p className="text-gray-500 text-sm">No submissions yet</p>
                    ) : (
                      expandedForms[form.id] && (
                        <div className="space-y-4">
                          {(form.submissions || []).map((submission) => (
                            <div key={submission.id} className="border rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-1" />
                                    {submission.submitterName || 'Anonymous'}
                                  </div>
                                  {submission.submitterEmail && (
                                    <div className="flex items-center">
                                      <Mail className="h-4 w-4 mr-1" />
                                      {submission.submitterEmail}
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(submission.submittedAt).toLocaleDateString()} {new Date(submission.submittedAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {form.fields.map((field) => (
                                  <div key={field.id} className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">
                                      {field.label}
                                      {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <div className="text-sm text-gray-900">
                                      {renderFieldValue(field, submission.data[field.id])}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
