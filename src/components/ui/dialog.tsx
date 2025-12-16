'use client'

import { cn } from '@/lib/utils'
import { ReactNode, createContext, useContext, useState } from 'react'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

interface DialogProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const handleOpenChange = onOpenChange || setUncontrolledOpen

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogContent({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  const context = useContext(DialogContext)
  if (!context) throw new Error('DialogContent must be used within Dialog')

  const { open, onOpenChange } = context

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={cn(
            'bg-white rounded-lg shadow-lg p-6 w-full max-h-[90vh] overflow-y-auto',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  )
}

export function DialogHeader({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <h2 className={cn('text-xl font-semibold text-gray-900', className)}>
      {children}
    </h2>
  )
}

export function DialogDescription({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <p className={cn('text-sm text-gray-500 mt-1', className)}>
      {children}
    </p>
  )
}

export function DialogFooter({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={cn('mt-6 flex justify-end gap-3', className)}>
      {children}
    </div>
  )
}
