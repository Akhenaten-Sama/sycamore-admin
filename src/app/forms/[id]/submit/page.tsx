'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'email' | 'phone' | 'select' | 'checkbox' | 'date' | 'file'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface FormData {
  id: string
  title: string
  description?: string
  fields: FormField[]
  isActive: boolean
}

export default function FormSubmissionPage() {
  const params = useParams()
  const id = params?.id as string
  const [form, setForm] = useState<FormData | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${id}`)
        const data = await response.json()
        
        if (data.success) {
          setForm(data.data)
          if (!data.data.isActive) {
            setError('This form is no longer accepting submissions.')
          }
        } else {
          setError('Form not found.')
        }
      } catch (err) {
        setError('Failed to load form.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchForm()
    }
  }, [id])

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/forms/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses,
          submitterName,
          submitterEmail
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Failed to submit form.')
      }
    } catch (err) {
      setError('Failed to submit form.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const baseProps = {
      id: field.id,
      required: field.required,
      className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            {...baseProps}
            type={field.type}
            placeholder={field.placeholder}
            value={responses[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            {...baseProps}
            rows={4}
            placeholder={field.placeholder}
            value={responses[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )
      
      case 'select':
        return (
          <select
            {...baseProps}
            value={responses[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <div className="mt-2 space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={(responses[field.id] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = responses[field.id] || []
                    if (e.target.checked) {
                      handleFieldChange(field.id, [...currentValues, option])
                    } else {
                      handleFieldChange(field.id, currentValues.filter((v: string) => v !== option))
                    }
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        )
      
      case 'date':
        return (
          <input
            {...baseProps}
            type="date"
            value={responses[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )
      
      case 'file':
        return (
          <input
            {...baseProps}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleFieldChange(field.id, file.name)
              }
            }}
          />
        )
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600">Your form submission has been received successfully.</p>
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submitter Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="submitterName" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="submitterName"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="submitterEmail" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="submitterEmail"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
