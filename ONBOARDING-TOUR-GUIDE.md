# Onboarding Tour System

Complete guide to the onboarding/tour system for both admin dashboard and mobile app.

## Overview

The onboarding system helps new users understand how to use the platform effectively with interactive, step-by-step tours that highlight key features.

## Features

- ✅ Step-by-step guided tours
- ✅ Highlighting of UI elements
- ✅ LocalStorage tracking (shows only once per user)
- ✅ Skip/Next/Previous navigation
- ✅ Progress indicators
- ✅ Customizable steps and content
- ✅ Responsive design
- ✅ Automatic positioning

---

## Admin Dashboard (sycamore-admin)

### Components

#### 1. OnboardingTour Component
**Location:** `src/components/common/OnboardingTour.tsx`

**Props:**
- `steps`: TourStep[] - Array of tour steps
- `storageKey`: string - LocalStorage key to track completion
- `onComplete?`: () => void - Callback when tour finishes
- `showOnMount?`: boolean - Show tour on component mount (default: true)

**Usage:**
```tsx
import { OnboardingTour, dashboardTourSteps } from '@/components/common'

<OnboardingTour 
  steps={dashboardTourSteps}
  storageKey="dashboard-tour-completed"
  onComplete={() => console.log('Tour completed!')}
/>
```

#### 2. Tour Steps Definition
**Location:** `src/components/common/tourSteps.ts`

**Available Tours:**
- `dashboardTourSteps` - Main dashboard overview
- `membersTourSteps` - Members management
- `eventsTourSteps` - Events management
- `devotionalsTourSteps` - Devotionals management
- `givingTourSteps` - Giving/donations
- `testimoniesTourSteps` - Praise reports
- `teamsTourSteps` - Team management
- `notificationsTourSteps` - Push notifications
- `formsTourSteps` - Custom forms

**Step Structure:**
```typescript
interface TourStep {
  target: string        // CSS selector (e.g., '[data-tour="stats-cards"]')
  title: string        // Step title
  content: string      // Step description
  placement?: 'top' | 'bottom' | 'left' | 'right'  // Tooltip position
}
```

### Implementation Example

**1. Add OnboardingTour to a page:**
```tsx
import { OnboardingTour, membersTourSteps } from '@/components/common'

export default function MembersPage() {
  return (
    <DashboardLayout>
      <OnboardingTour 
        steps={membersTourSteps}
        storageKey="members-tour-completed"
      />
      
      {/* Your page content */}
    </DashboardLayout>
  )
}
```

**2. Add data-tour attributes to UI elements:**
```tsx
<Button data-tour="add-member">
  Add Member
</Button>

<div data-tour="member-list">
  {/* Member list content */}
</div>

<input data-tour="search" placeholder="Search..." />
```

**3. Tour will automatically:**
- Show on first visit (LocalStorage check)
- Highlight each element with `data-tour` attribute
- Position tooltip based on `placement` setting
- Track user's progress through steps
- Save completion status to LocalStorage

### Restart Tour

To manually restart a tour (useful for testing or "Show me around" button):

```tsx
import { restartTour } from '@/components/common'

<Button onClick={() => restartTour('dashboard-tour-completed')}>
  Show Tour Again
</Button>
```

### Creating Custom Tours

1. **Define tour steps:**
```typescript
// src/components/common/tourSteps.ts
export const myCustomTourSteps: TourStep[] = [
  {
    target: '[data-tour="step1"]',
    title: 'Step 1 Title',
    content: 'Description of what this does...',
    placement: 'bottom'
  },
  {
    target: '[data-tour="step2"]',
    title: 'Step 2 Title',
    content: 'Next feature explanation...',
    placement: 'right'
  }
]
```

2. **Add tour to your page:**
```tsx
import { OnboardingTour } from '@/components/common'
import { myCustomTourSteps } from '@/components/common/tourSteps'

<OnboardingTour 
  steps={myCustomTourSteps}
  storageKey="my-custom-tour-completed"
/>
```

3. **Add data-tour attributes:**
```tsx
<div data-tour="step1">Feature 1</div>
<div data-tour="step2">Feature 2</div>
```

---

## Mobile App (sycamore)

### Components

#### 1. MobileOnboardingTour Component
**Location:** `src/components/onboarding/MobileOnboardingTour.jsx`

**Props:**
- `steps`: TourStep[] - Array of tour steps
- `storageKey`: string - LocalStorage key
- `onComplete?`: () => void - Completion callback
- `showOnMount?`: boolean - Auto-show (default: true)

**Usage:**
```jsx
import { MobileOnboardingTour } from '@/components/onboarding/MobileOnboardingTour'
import { homePageTourSteps } from '@/components/onboarding/mobileTourSteps'

<MobileOnboardingTour 
  steps={homePageTourSteps}
  storageKey="home-tour-completed"
/>
```

#### 2. Mobile Tour Steps
**Location:** `src/components/onboarding/mobileTourSteps.ts`

**Available Tours:**
- `mobileTourSteps` - App introduction
- `homePageTourSteps` - Home page features
- `eventsPageTourSteps` - Events browsing
- `devotionalsPageTourSteps` - Daily devotionals
- `givingPageTourSteps` - Tithes & offerings
- `prayerPageTourSteps` - Prayer requests
- `communitiesPageTourSteps` - Life groups
- `profilePageTourSteps` - User profile
- `mediaPageTourSteps` - Sermons & media

### Implementation Example

**1. Add tour to a component:**
```jsx
import { MobileOnboardingTour } from '@/components/onboarding/MobileOnboardingTour'
import { devotionalsPageTourSteps } from '@/components/onboarding/mobileTourSteps'

export function Devotionals() {
  return (
    <div>
      <MobileOnboardingTour 
        steps={devotionalsPageTourSteps}
        storageKey="devotionals-tour-completed"
      />
      
      {/* Your component JSX */}
    </div>
  )
}
```

**2. Add data-tour attributes:**
```jsx
<div data-tour="todays-devotional">
  Today's Devotional
</div>

<button data-tour="devotional-actions">
  Like & Share
</button>
```

### Mobile Tour Styling

The mobile tour uses a centered modal approach (better for touch interfaces):
- Centered overlay modal
- Progress dots indicator
- Large touch-friendly buttons
- Smooth animations
- Mobile-optimized text sizes

### Restart Mobile Tour

```jsx
import { restartMobileTour } from '@/components/onboarding/MobileOnboardingTour'

<button onClick={() => restartMobileTour('home-tour-completed')}>
  Replay Tutorial
</button>
```

---

## Best Practices

### 1. Keep Tours Short
- **Ideal:** 3-5 steps per tour
- **Maximum:** 7 steps
- Focus on essential features only

### 2. Clear, Concise Content
- **Title:** 3-5 words max
- **Content:** 1-2 short sentences
- Use active voice
- Avoid jargon

### 3. Logical Flow
- Start with overview/context
- Progress from basic to advanced
- End with a call-to-action

### 4. Strategic Placement
- Highlight most important features first
- Group related features together
- Consider user's natural workflow

### 5. data-tour Naming
- Use descriptive, kebab-case names
- Be specific: `add-member` not `button1`
- Consistent across similar features

### 6. Testing
- Test on different screen sizes
- Verify all targets exist in DOM
- Check tooltip positioning
- Test skip/complete functionality

---

## Examples

### Dashboard Welcome Tour
```tsx
// pages/dashboard/page.tsx
<OnboardingTour 
  steps={dashboardTourSteps}
  storageKey="dashboard-tour-completed"
/>

<div data-tour="stats-cards">
  {/* Stats cards */}
</div>
<aside data-tour="sidebar">
  {/* Navigation */}
</aside>
<div data-tour="quick-actions">
  {/* Action buttons */}
</div>
```

### Mobile First-Time User Experience
```jsx
// App.jsx or main component
<MobileOnboardingTour 
  steps={mobileTourSteps}
  storageKey="app-intro-completed"
  onComplete={() => {
    // Track analytics
    analytics.track('onboarding_completed')
  }}
/>
```

### Feature-Specific Tour
```tsx
// When introducing a new feature
const newFeatureTourSteps = [
  {
    target: '[data-tour="new-feature"]',
    title: '✨ New: AI Prayer Suggestions',
    content: 'Get AI-powered prayer suggestions based on your needs.',
    placement: 'bottom'
  }
]

<OnboardingTour 
  steps={newFeatureTourSteps}
  storageKey="ai-prayer-feature-seen"
  showOnMount={isNewFeatureReleased}
/>
```

---

## Troubleshooting

### Tour doesn't show
- Check LocalStorage - clear key if needed
- Verify `data-tour` attributes exist
- Ensure component renders after DOM ready
- Check `showOnMount` prop

### Tooltip positioning issues
- Try different `placement` values
- Ensure target element is visible
- Check for CSS conflicts
- Add `position: relative` to target

### Tour shows every time
- Verify `storageKey` is consistent
- Check localStorage.setItem is called
- Clear browser cache if testing

### Target not found
- Use browser DevTools to verify selector
- Ensure element renders before tour
- Add delay with setTimeout if needed

---

## Analytics Integration

Track tour engagement:

```tsx
<OnboardingTour 
  steps={dashboardTourSteps}
  storageKey="dashboard-tour-completed"
  onComplete={() => {
    // Google Analytics
    gtag('event', 'onboarding_completed', {
      tour_name: 'dashboard'
    })
    
    // Custom analytics
    trackEvent('Tour Completed', {
      tour: 'dashboard',
      steps_viewed: dashboardTourSteps.length
    })
  }}
/>
```

---

## Accessibility

The tour system includes:
- ✅ Keyboard navigation (ESC to close, Enter for next)
- ✅ Clear visual focus indicators
- ✅ Screen reader friendly text
- ✅ High contrast overlay
- ✅ Touch-friendly buttons (mobile)

---

## Future Enhancements

Potential improvements:
- [ ] Multi-language support
- [ ] Video/GIF in tour steps
- [ ] Branching tours (different paths)
- [ ] Analytics dashboard
- [ ] A/B testing variants
- [ ] Voice-guided tours
- [ ] Gamification (badges for completion)

---

## Support

For questions or issues:
1. Check this documentation
2. Review component source code
3. Test in isolation
4. Check browser console for errors

Happy touring! 🚀
