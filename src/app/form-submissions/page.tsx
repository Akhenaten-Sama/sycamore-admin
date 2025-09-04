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
  FileText,
  Baby,
  Heart,
  Briefcase,
  Settings,
  Eye,
  Share2,
  Copy,
  ExternalLink,
  Download,
  Calendar,
  User,
  Filter,
  BarChart3
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Form Submissions' }
]

interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface RequestForm {
  id: string
  type: 'baby_dedication' | 'prayer_request' | 'business_dedication' | 'custom'
  title: string
  description: string
  fields: FormField[]
  isActive: boolean
  requiresApproval: boolean
  createdAt: Date
}

interface FormSubmission {
  id: string
  formId: string
  formTitle: string
  submitterId: string | null
  submitterName?: string
  submitterEmail?: string
  responses: Record<string, any>
  submittedAt: Date
  notes?: string
}

export default function FormSubmissionsPage() {
  const [forms, setForms] = useState<RequestForm[]>([])
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadForms()
    loadSubmissions()
  }, [])

  const loadForms = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockForms: RequestForm[] = [
        {
          id: '1',
          type: 'baby_dedication',
          title: 'Baby Dedication Request',
          description: 'Request form for baby dedication ceremony',
          fields: [
            { id: 'parent_name', label: 'Parent Name', type: 'text', required: true },
            { id: 'parent_email', label: 'Email', type: 'email', required: true },
            { id: 'parent_phone', label: 'Phone', type: 'phone', required: true },
            { id: 'baby_name', label: 'Baby Name', type: 'text', required: true },
            { id: 'baby_dob', label: 'Baby Date of Birth', type: 'date', required: true },
            { id: 'preferred_date', label: 'Preferred Dedication Date', type: 'date', required: true },
            { id: 'special_requests', label: 'Special Requests', type: 'textarea', required: false }
          ],
          isActive: true,
          requiresApproval: false,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          type: 'prayer_request',
          title: 'Prayer Request',
          description: 'Submit a prayer request to the church',
          fields: [
            { id: 'requester_name', label: 'Your Name', type: 'text', required: false },
            { id: 'contact_email', label: 'Email (optional)', type: 'email', required: false },
            { id: 'prayer_type', label: 'Prayer Type', type: 'select', required: true, options: ['Personal', 'Family', 'Health', 'Work', 'Other'] },
            { id: 'prayer_request', label: 'Prayer Request', type: 'textarea', required: true },
            { id: 'is_urgent', label: 'Urgent Request', type: 'checkbox', required: false },
            { id: 'is_confidential', label: 'Keep Confidential', type: 'checkbox', required: false }
          ],
          isActive: true,
          requiresApproval: false,
          createdAt: new Date('2024-01-02')
        },
        {
          id: '3',
          type: 'business_dedication',
          title: 'Business Dedication',
          description: 'Request business blessing and dedication',
          fields: [
            { id: 'owner_name', label: 'Business Owner', type: 'text', required: true },
            { id: 'owner_email', label: 'Email', type: 'email', required: true },
            { id: 'owner_phone', label: 'Phone', type: 'phone', required: true },
            { id: 'business_name', label: 'Business Name', type: 'text', required: true },
            { id: 'business_address', label: 'Business Address', type: 'textarea', required: true },
            { id: 'business_type', label: 'Type of Business', type: 'text', required: true },
            { id: 'preferred_date', label: 'Preferred Date', type: 'date', required: true },
            { id: 'special_notes', label: 'Additional Notes', type: 'textarea', required: false }
          ],
          isActive: true,
          requiresApproval: false,
          createdAt: new Date('2024-01-03')
        }
      ]
      setForms(mockForms)
    } catch (error) {
      console.error('Error loading forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSubmissions: FormSubmission[] = [
        {
          id: '1',
          formId: '1',
          formTitle: 'Baby Dedication Request',
          submitterId: 'member1',
          submitterName: 'John Smith',
          submitterEmail: 'john.smith@email.com',
          responses: {
            parent_name: 'John Smith',
            parent_email: 'john.smith@email.com',
            parent_phone: '+1234567890',
            baby_name: 'Emma Grace Smith',
            baby_dob: '2024-06-15',
            preferred_date: '2024-12-29',
            special_requests: 'Would like grandparents to participate in the ceremony'
          },
          submittedAt: new Date('2024-12-20T10:30:00'),
          notes: ''
        },
        {
          id: '2',
          formId: '2',
          formTitle: 'Prayer Request',
          submitterId: null, // Anonymous submission
          submitterName: 'Anonymous',
          responses: {
            prayer_type: 'Health',
            prayer_request: 'Please pray for my mother\'s recovery from surgery',
            is_urgent: true,
            is_confidential: true
          },
          submittedAt: new Date('2024-12-21T14:15:00')
        },
        {
          id: '3',
          formId: '1',
          formTitle: 'Baby Dedication Request',
          submitterId: 'member2',
          submitterName: 'Mary Johnson',
          submitterEmail: 'mary.johnson@email.com',
          responses: {
            parent_name: 'Mary Johnson',
            parent_email: 'mary.johnson@email.com',
            parent_phone: '+1234567891',
            baby_name: 'David Michael Johnson',
            baby_dob: '2024-08-10',
            preferred_date: '2025-01-05',
            special_requests: 'No special requests'
          },
          submittedAt: new Date('2024-12-21T16:45:00')
        },
        {
          id: '4',
          formId: '3',
          formTitle: 'Business Dedication',
          submitterId: 'member3',
          submitterName: 'Robert Wilson',
          submitterEmail: 'robert.wilson@email.com',
          responses: {
            owner_name: 'Robert Wilson',
            owner_email: 'robert.wilson@email.com',
            owner_phone: '+1234567892',
            business_name: 'Wilson\'s Coffee Shop',
            business_address: '123 Main Street, Downtown',
            business_type: 'Coffee Shop and Bakery',
            preferred_date: '2025-01-15',
            special_notes: 'New business opening, would appreciate church community support'
          },
          submittedAt: new Date('2024-12-22T09:20:00')
        },
        {
          id: '5',
          formId: '2',
          formTitle: 'Prayer Request',
          submitterId: 'member4',
          submitterName: 'Sarah Davis',
          submitterEmail: 'sarah.davis@email.com',
          responses: {
            requester_name: 'Sarah Davis',
            contact_email: 'sarah.davis@email.com',
            prayer_type: 'Family',
            prayer_request: 'Prayers for family unity and healing of relationships',
            is_urgent: false,
            is_confidential: false
          },
          submittedAt: new Date('2024-12-22T11:30:00')
        }
      ]
      setSubmissions(mockSubmissions)
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const getFormIcon = (type: string) => {
    switch (type) {
      case 'baby_dedication': return <Baby className="w-4 h-4" />
      case 'prayer_request': return <Heart className="w-4 h-4" />
      case 'business_dedication': return <Briefcase className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getFormColor = (type: string) => {
    switch (type) {
      case 'baby_dedication': return 'bg-pink-100 text-pink-800'
      case 'prayer_request': return 'bg-blue-100 text-blue-800'
      case 'business_dedication': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFilteredSubmissions = () => {
    let filtered = submissions

    // Filter by selected form
    if (selectedFormId) {
      filtered = filtered.filter(submission => submission.formId === selectedFormId)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.submitterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.submitterEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(submission.responses).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter(submission => {
        const submissionDate = new Date(submission.submittedAt)
        return submissionDate.toDateString() === filterDate.toDateString()
      })
    }

    return filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  }

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission)
    setIsModalOpen(true)
  }

  const exportToCSV = () => {
    const filteredSubmissions = getFilteredSubmissions()
    if (filteredSubmissions.length === 0) {
      alert('No submissions to export')
      return
    }

    // Get the selected form to understand field structure
    const selectedForm = selectedFormId ? forms.find(f => f.id === selectedFormId) : null
    
    // Create CSV headers
    const headers = ['Submission ID', 'Form Title', 'Submitter', 'Email', 'Submitted At']
    
    if (selectedForm) {
      // Add specific form field headers
      selectedForm.fields.forEach(field => {
        headers.push(field.label)
      })
    } else {
      // Add all possible response keys for mixed forms
      const allKeys = new Set<string>()
      filteredSubmissions.forEach(submission => {
        Object.keys(submission.responses).forEach(key => allKeys.add(key))
      })
      headers.push(...Array.from(allKeys))
    }

    // Create CSV rows
    const csvRows = [headers.join(',')]
    
    filteredSubmissions.forEach(submission => {
      const row = [
        submission.id,
        `"${submission.formTitle}"`,
        `"${submission.submitterName || 'Anonymous'}"`,
        `"${submission.submitterEmail || 'N/A'}"`,
        new Date(submission.submittedAt).toLocaleString()
      ]

      if (selectedForm) {
        selectedForm.fields.forEach(field => {
          const value = submission.responses[field.id] || ''
          row.push(`"${String(value).replace(/"/g, '""')}"`)
        })
      } else {
        const allKeys = new Set<string>()
        filteredSubmissions.forEach(s => {
          Object.keys(s.responses).forEach(key => allKeys.add(key))
        })
        Array.from(allKeys).forEach(key => {
          const value = submission.responses[key] || ''
          row.push(`"${String(value).replace(/"/g, '""')}"`)
        })
      }

      csvRows.push(row.join(','))
    })

    // Download CSV
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const formName = selectedFormId ? 
      forms.find(f => f.id === selectedFormId)?.title.replace(/[^a-zA-Z0-9]/g, '_') : 
      'all_forms'
    link.download = `${formName}_submissions_${new Date().toISOString().split('T')[0]}.csv`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getSubmissionsByForm = () => {
    const groupedSubmissions = forms.map(form => ({
      form,
      submissions: submissions.filter(s => s.formId === form.id),
      count: submissions.filter(s => s.formId === form.id).length
    }))
    return groupedSubmissions.sort((a, b) => b.count - a.count)
  }

  const filteredSubmissions = getFilteredSubmissions()
  const submissionsByForm = getSubmissionsByForm()

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
            <p className="text-gray-600 mt-1">View and manage form submissions from your congregation</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold">{submissions.length}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">
                    {submissions.filter(s => {
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return new Date(s.submittedAt) > weekAgo
                    }).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Anonymous</p>
                  <p className="text-2xl font-bold">
                    {submissions.filter(s => !s.submitterId).length}
                  </p>
                </div>
                <User className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Forms</p>
                  <p className="text-2xl font-bold">{forms.filter(f => f.isActive).length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Submissions by Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissionsByForm.map(({ form, count }) => (
                <div
                  key={form.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFormId === form.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFormId(selectedFormId === form.id ? '' : form.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getFormIcon(form.type)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFormColor(form.type)}`}>
                        {form.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{count}</span>
                  </div>
                  <h3 className="font-medium text-gray-900">{form.title}</h3>
                  <p className="text-sm text-gray-600">
                    {count} submission{count !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40"
                />
              </div>
              {selectedFormId && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedFormId('')}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {selectedFormId 
                  ? `${forms.find(f => f.id === selectedFormId)?.title} Submissions` 
                  : 'All Submissions'}
                ({filteredSubmissions.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Form</th>
                    <th className="text-left py-3 px-4">Submitter</th>
                    <th className="text-left py-3 px-4">Submitted</th>
                    <th className="text-left py-3 px-4">Preview</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => {
                    const form = forms.find(f => f.id === submission.formId)
                    const firstResponse = Object.values(submission.responses)[0]
                    return (
                      <tr key={submission.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {form && getFormIcon(form.type)}
                            <div>
                              <div className="font-medium">{submission.formTitle}</div>
                              {form && (
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getFormColor(form.type)}`}>
                                  {form.type.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">
                              {submission.submitterName || 'Anonymous'}
                            </div>
                            {submission.submitterEmail && (
                              <div className="text-sm text-gray-600">{submission.submitterEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div>{new Date(submission.submittedAt).toLocaleDateString()}</div>
                            <div className="text-gray-500">
                              {new Date(submission.submittedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {String(firstResponse || 'No data')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {filteredSubmissions.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No submissions found</p>
                  {selectedFormId && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedFormId('')}
                      className="mt-2"
                    >
                      View all submissions
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submission Detail Modal */}
        {isModalOpen && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedSubmission.formTitle}</h2>
                  <p className="text-gray-600">
                    Submitted by {selectedSubmission.submitterName || 'Anonymous'} on{' '}
                    {new Date(selectedSubmission.submittedAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                {Object.entries(selectedSubmission.responses).map(([key, value]) => {
                  const form = forms.find(f => f.id === selectedSubmission.formId)
                  const field = form?.fields.find(f => f.id === key)
                  const label = field?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  
                  return (
                    <div key={key} className="border-b border-gray-200 pb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <div className="text-gray-900">
                        {field?.type === 'checkbox' ? (
                          <span className={`px-2 py-1 rounded text-sm ${
                            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {value ? 'Yes' : 'No'}
                          </span>
                        ) : field?.type === 'textarea' ? (
                          <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded">
                            {String(value || 'No response')}
                          </div>
                        ) : (
                          <p>{String(value || 'No response')}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
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
