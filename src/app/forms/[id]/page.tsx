'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  FileText,
  Baby,
  Heart,
  Briefcase,
  Send,
  CheckCircle
} from 'lucide-react'
import { RequestForm, FormField } from '@/types'
import { apiClient } from '@/lib/api-client'

const formTypeIcons = {
  'baby_dedication': Baby,
  'prayer_request': Heart,
  'business_dedication': Briefcase,
  'custom': FileText
}

export default function PublicFormPage() {
  const params = useParams()
  const formId = params.id as string
  
  const [form, setForm] = useState<RequestForm | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadForm()
  }, [formId])

  const loadForm = async () => {
    try {
      const response = await apiClient.getRequestForm(formId)
      if (response.success && response.data) {
        const formData = response.data as RequestForm
        if (!formData.isActive) {
          setError('This form is no longer accepting responses.')
          return
        }
        setForm(formData)
        // Initialize responses object
        const initialResponses: Record<string, any> = {}
        formData.fields.forEach(field => {
          initialResponses[field.id] = field.type === 'checkbox' ? false : ''
        })
        setResponses(initialResponses)
      } else {
        setError('Form not found')
      }
    } catch (error) {
      console.error('Error loading form:', error)
      setError('Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const validateForm = () => {
    if (!form) return false
    
    for (const field of form.fields) {
      if (field.required && !responses[field.id]) {
        alert(`Please fill in the required field: ${field.label}`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    try {
      const submissionData = {
        formId: formId,
        responses: responses,
        submitterId: null // For public forms, allow anonymous submissions
      }
      
      const response = await apiClient.submitRequestForm(submissionData)
      if (response.success) {
        setSubmitted(true)
      } else {
        alert(response.error || 'Failed to submit form')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = responses[field.id] || ''
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
          />
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        )
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        )
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Unavailable</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-green-500 mb-4">
              <CheckCircle className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600">
              Your form has been submitted successfully. 
              {form?.requiresApproval && " We will review your submission and get back to you soon."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Form not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const Icon = formTypeIcons[form.type]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Icon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {form.title}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {form.description}
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id}>
                  {field.type !== 'checkbox' && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  {renderField(field)}
                </div>
              ))}
              
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Form
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by Sycamore Church Admin</p>
        </div>
      </div>
    </div>
  )
}
