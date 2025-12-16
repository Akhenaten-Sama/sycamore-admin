'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface TourStep {
  target: string // CSS selector
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingTourProps {
  steps: TourStep[]
  storageKey: string
  onComplete?: () => void
  showOnMount?: boolean
}

export function OnboardingTour({ 
  steps, 
  storageKey, 
  onComplete,
  showOnMount = true 
}: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (showOnMount) {
      const hasSeenTour = localStorage.getItem(storageKey)
      if (!hasSeenTour) {
        // Delay to ensure DOM is ready
        setTimeout(() => setIsActive(true), 500)
      }
    }
  }, [storageKey, showOnMount])

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      positionTooltip()
    }
  }, [isActive, currentStep, steps])

  const positionTooltip = () => {
    const step = steps[currentStep]
    const element = document.querySelector(step.target)
    
    if (element) {
      const rect = element.getBoundingClientRect()
      const placement = step.placement || 'bottom'
      
      let top = 0
      let left = 0
      
      switch (placement) {
        case 'top':
          top = rect.top - 20
          left = rect.left + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + 20
          left = rect.left + rect.width / 2
          break
        case 'left':
          top = rect.top + rect.height / 2
          left = rect.left - 20
          break
        case 'right':
          top = rect.top + rect.height / 2
          left = rect.right + 20
          break
      }
      
      setPosition({ top, left })
      
      // Highlight the target element
      element.classList.add('onboarding-highlight')
      
      // Remove highlight from previous element
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        if (el !== element) {
          el.classList.remove('onboarding-highlight')
        }
      })
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true')
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight')
    })
    setIsActive(false)
    onComplete?.()
  }

  if (!isActive || !steps[currentStep]) return null

  const step = steps[currentStep]

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[9998]" />
      
      {/* Tooltip */}
      <div
        className="fixed z-[9999] bg-white rounded-lg shadow-2xl p-6 max-w-md animate-in fade-in slide-in-from-bottom-5"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, 0)'
        }}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="text-xs text-gray-500 mb-2">
          Step {currentStep + 1} of {steps.length}
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          {step.content}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
          >
            Skip Tour
          </Button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                'Finish'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Add highlight CSS */}
      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 9997;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6),
                      0 0 0 9999px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }
      `}</style>
    </>
  )
}

// Restart tour function for manual triggering
export function restartTour(storageKey: string) {
  localStorage.removeItem(storageKey)
  window.location.reload()
}
