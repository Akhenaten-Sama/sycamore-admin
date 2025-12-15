'use client'

import { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl'
}

/**
 * Reusable Modal component with proper text colors and consistent styling
 * Use this instead of raw Dialog components to ensure consistent UX
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClasses[size]} max-h-[85vh] overflow-y-auto`}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-gray-900 text-xl font-semibold">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-gray-600 mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={() => onOpenChange(false)}
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </DialogHeader>
        <div className="text-gray-700">
          {children}
        </div>
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void | Promise<void>
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
}

/**
 * Reusable confirmation modal for delete/destructive actions
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  const buttonVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
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
            variant={buttonVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </>
      }
    >
      <div className="py-4">
        <p className="text-gray-700">{description}</p>
      </div>
    </Modal>
  )
}

interface ViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string | ReactNode
  data: Array<{
    label: string
    value: ReactNode
    fullWidth?: boolean
  }>
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children?: ReactNode
  footer?: ReactNode
}

/**
 * Reusable view/details modal for displaying data
 */
export function ViewModal({
  open,
  onOpenChange,
  title,
  description,
  data,
  size = 'lg',
  children,
  footer
}: ViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClasses[size]} max-h-[85vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-gray-900 text-xl font-semibold">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="text-gray-700">
          {children}
          <div className="space-y-4 py-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={item.fullWidth ? 'col-span-2' : ''}
              >
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  {item.label}
                </label>
                <div className="text-sm text-gray-700">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          {footer || (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
