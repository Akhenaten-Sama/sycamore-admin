'use client'

import { ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface FormField {
  name: string
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'custom'
  placeholder?: string
  required?: boolean
  value: any
  onChange: (value: any) => void
  options?: Array<{ label: string; value: string | number }>
  rows?: number
  min?: number
  max?: number
  customRender?: () => ReactNode
  disabled?: boolean
  fullWidth?: boolean
}

interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: FormField[]
  onSave: () => void | Promise<void>
  saveText?: string
  cancelText?: string
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

/**
 * Reusable form modal for add/edit operations
 * Handles common form patterns with proper styling
 */
export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSave,
  saveText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  size = 'lg'
}: FormModalProps) {
  const handleSave = async () => {
    await onSave()
  }

  const renderField = (field: FormField) => {
    if (field.customRender) {
      return field.customRender()
    }

    const commonProps = {
      value: field.value,
      onChange: (e: any) => field.onChange(e.target.value),
      placeholder: field.placeholder,
      disabled: field.disabled || loading,
      className: 'mt-1'
    }

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={field.rows || 4}
          />
        )
      
      case 'select':
        return (
          <select
            {...commonProps}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
          >
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      
      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            min={field.min}
            max={field.max}
          />
        )
      
      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
          />
        )
      
      default:
        return (
          <Input
            {...commonProps}
            type={field.type || 'text'}
          />
        )
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : saveText}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.name}
            className={field.fullWidth ? 'col-span-2' : ''}
          >
            <Label className="text-sm font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </Modal>
  )
}
