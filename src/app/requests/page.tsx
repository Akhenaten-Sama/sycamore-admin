'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText,
  Baby,
  Heart,
  Briefcase,
  Settings,
  Check,
  X,
  Eye,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { RequestForm, RequestSubmission, RequestSubmissionPopulated } from '@/types'
import { formatDateConsistent, parseApiRequestForm } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Request Forms' }
]

const formTypeIcons = {
  'baby_dedication': Baby,
  'prayer_request': Heart,
  'business_dedication': Briefcase,
  'custom': FileText
}

export default function RequestFormsPage() {
  const [forms, setForms] = useState<RequestForm[]>([])
  const [submissions, setSubmissions] = useState<RequestSubmissionPopulated[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'forms' | 'submissions'>('forms')
  const [selectedForm, setSelectedForm] = useState<RequestForm | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<RequestSubmissionPopulated | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'baby_dedication' as RequestForm['type'],
    title: '',
    description: '',
    fields: [] as RequestForm['fields'],
    isActive: true,
    requiresApproval: true
  })

  useEffect(() => {
    loadForms()
    loadSubmissions()
  }, [])

  const loadForms = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getRequestForms({
        type: typeFilter || undefined
      })
      if (response.success && response.data) {
        const rawForms = Array.isArray(response.data) ? response.data : []
        const parsedForms = rawForms.map(form => parseApiRequestForm(form))
        setForms(parsedForms)
      }
    } catch (error) {
      console.error('Error loading forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      const response = await apiClient.getRequestSubmissions()
      if (response.success && response.data) {
        setSubmissions(Array.isArray(response.data) ? response.data as RequestSubmissionPopulated[] : [])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const handleCreateForm = () => {
    setSelectedForm(null)
    setIsEditing(false)
    setFormData({
      type: 'baby_dedication',
      title: '',
      description: '',
      fields: [],
      isActive: true,
      requiresApproval: true
    })
    setIsModalOpen(true)
  }

  const handleEditForm = (form: RequestForm) => {
    setSelectedForm(form)
    setIsEditing(true)
    setFormData({
      type: form.type,
      title: form.title,
      description: form.description,
      fields: form.fields,
      isActive: form.isActive,
      requiresApproval: form.requiresApproval
    })
    setIsModalOpen(true)
  }

  const handleSaveForm = async () => {
    try {
      // Validate form data
      if (!formData.title.trim()) {
        alert('Please enter a form title')
        return
      }
      
      if (!formData.description.trim()) {
        alert('Please enter a form description')
        return
      }

      // Validate all fields have required properties
      for (let i = 0; i < formData.fields.length; i++) {
        const field = formData.fields[i]
        if (!field.label.trim()) {
          alert(`Please enter a label for field ${i + 1}`)
          return
        }
        if (!field.type) {
          alert(`Please select a type for field ${i + 1}`)
          return
        }
      }

      const formDataToSave = {
        ...formData,
        ...(isEditing ? {} : { createdBy: '507f1f77bcf86cd799439011' }) // Only add createdBy for new forms
      }

      if (isEditing && selectedForm) {
        const response = await apiClient.updateRequestForm(selectedForm.id, formDataToSave)
        if (response.success) {
          loadForms()
          setIsModalOpen(false)
          setIsEditing(false)
          setSelectedForm(null)
        } else {
          alert(response.error || 'Failed to update request form')
        }
      } else {
        const response = await apiClient.createRequestForm(formDataToSave)
        if (response.success) {
          loadForms()
          setIsModalOpen(false)
        } else {
          // Show the specific error message from the server
          alert(response.error || 'Failed to create request form')
        }
      }
    } catch (error) {
      console.error('Error saving form:', error)
      alert('An error occurred while saving the form. Please try again.')
    }
  }

  const handleViewSubmission = (submission: RequestSubmissionPopulated) => {
    setSelectedSubmission(submission)
    setIsSubmissionModalOpen(true)
  }

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, {
        id: Date.now().toString(),
        label: '',
        type: 'text',
        required: false,
        placeholder: ''
      }]
    }))
  }

  const updateField = (index: number, field: Partial<RequestForm['fields'][0]>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }))
  }

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const getFormTypeLabel = (type: string) => {
    switch (type) {
      case 'baby_dedication': return 'Baby Dedication'
      case 'prayer_request': return 'Prayer Request'
      case 'business_dedication': return 'Business Dedication'
      case 'custom': return 'Custom'
      default: return type
    }
  }

  const handleShareForm = (form: RequestForm) => {
    setSelectedForm(form)
    setIsShareModalOpen(true)
  }

  const getFormPublicUrl = (formId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/forms/${formId}`
    }
    return `/forms/${formId}`
  }

  const copyFormLink = (formId: string) => {
    const url = getFormPublicUrl(formId)
    navigator.clipboard.writeText(url).then(() => {
      alert('Form link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link. Please copy manually: ' + url)
    })
  }

  const openFormInNewTab = (formId: string) => {
    const url = getFormPublicUrl(formId)
    window.open(url, '_blank')
  }

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSubmissions = submissions.filter(submission => {
    const formTitle = submission.formId?.title || ''
    const submitterName = submission.submitterId ? 
      `${submission.submitterId.firstName} ${submission.submitterId.lastName}` : ''
    
    return formTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
           submitterName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Request Forms</h1>
            <p className="text-gray-600 mt-1">Manage forms and submissions for church requests</p>
          </div>
          <Button onClick={handleCreateForm} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Form
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('forms')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'forms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Forms ({forms.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Submissions ({submissions.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={activeTab === 'forms' ? "Search forms..." : "Search submissions..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {activeTab === 'forms' && (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="baby_dedication">Baby Dedication</option>
                  <option value="prayer_request">Prayer Request</option>
                  <option value="business_dedication">Business Dedication</option>
                  <option value="custom">Custom</option>
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Request Forms ({filteredForms.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading forms...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Fields</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval Required</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.map((form) => {
                      const Icon = formTypeIcons[form.type]
                      return (
                        <TableRow key={form.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{form.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {form.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {getFormTypeLabel(form.type)}
                            </span>
                          </TableCell>
                          <TableCell>{form.fields.length} fields</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              form.isActive 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-red-600 bg-red-50'
                            }`}>
                              {form.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {form.requiresApproval ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDateConsistent(new Date(form.createdAt))}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditForm(form)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShareForm(form)}
                                title="Share form"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {/* Delete logic */}}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredForms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No forms found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Form Submissions ({filteredSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        {submission.formId?.title || 'Unknown Form'}
                      </TableCell>
                      <TableCell>
                        {submission.submitterId ? 
                          `${submission.submitterId.firstName} ${submission.submitterId.lastName}` :
                          'Unknown Submitter'
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'approved' ? 'text-green-600 bg-green-50' :
                          submission.status === 'rejected' ? 'text-red-600 bg-red-50' :
                          submission.status === 'completed' ? 'text-blue-600 bg-blue-50' :
                          'text-yellow-600 bg-yellow-50'
                        }`}>
                          {submission.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDateConsistent(new Date(submission.submittedAt))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSubmission(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No submissions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Form Creation/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Form' : 'Create New Form'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as RequestForm['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baby_dedication">Baby Dedication</option>
                    <option value="prayer_request">Prayer Request</option>
                    <option value="business_dedication">Business Dedication</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Form title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Form description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Form Fields */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Form Fields
                    </label>
                    <Button onClick={addField} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <div key={field.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Field label"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as any })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <div className="mt-2 flex items-center justify-between">
                          <Input
                            placeholder="Placeholder text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                            className="flex-1 mr-2"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                              />
                              Required
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeField(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Form is active
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requiresApproval"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="requiresApproval" className="text-sm text-gray-700">
                      Requires approval
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveForm}>
                  {isEditing ? 'Update' : 'Create'} Form
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Submission View Modal */}
        {isSubmissionModalOpen && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Submission Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Form</p>
                    <p className="font-medium">
                      {selectedSubmission.formId?.title || 'Unknown Form'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Submitter</p>
                    <p className="font-medium">
                      {selectedSubmission.submitterId ? 
                        `${selectedSubmission.submitterId.firstName} ${selectedSubmission.submitterId.lastName}` :
                        'Unknown Submitter'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium capitalize">{selectedSubmission.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Submitted</p>
                    <p className="font-medium">{formatDateConsistent(new Date(selectedSubmission.submittedAt))}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 mb-2">Responses</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm">{JSON.stringify(selectedSubmission.responses, null, 2)}</pre>
                  </div>
                </div>

                {selectedSubmission.notes && (
                  <div>
                    <p className="text-gray-600 mb-2">Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedSubmission.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsSubmissionModalOpen(false)}
                >
                  Close
                </Button>
                {selectedSubmission.status === 'pending' && (
                  <>
                    <Button variant="outline">
                      Reject
                    </Button>
                    <Button>
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {isShareModalOpen && selectedForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                Share Form: {selectedForm.title}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public Form URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={getFormPublicUrl(selectedForm.id)}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyFormLink(selectedForm.id)}
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Users can access this form directly using this link
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openFormInNewTab(selectedForm.id)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview Form
                  </Button>
                  <Button
                    onClick={() => copyFormLink(selectedForm.id)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-sm mb-2">Sharing Options:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Share the link via email, WhatsApp, or social media</li>
                    <li>• Embed in your church website or bulletin</li>
                    <li>• QR code generation (coming soon)</li>
                    <li>• Form is {selectedForm.isActive ? 'currently active' : 'currently inactive'}</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsShareModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
