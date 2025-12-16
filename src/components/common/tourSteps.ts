import { TourStep } from './OnboardingTour'

// Dashboard main page tour
export const dashboardTourSteps: TourStep[] = [
  {
    target: '[data-tour="stats-cards"]',
    title: 'Overview Statistics',
    content: 'Get a quick snapshot of your church\'s key metrics including members, events, attendance, and giving.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation Menu',
    content: 'Access all management sections from here: members, events, devotionals, giving, and more.',
    placement: 'right'
  },
  {
    target: '[data-tour="quick-actions"]',
    title: 'Quick Actions',
    content: 'Perform common tasks quickly like adding members, creating events, or sending notifications.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="recent-activity"]',
    title: 'Recent Activity',
    content: 'Stay updated with the latest member registrations, event check-ins, and donations.',
    placement: 'top'
  }
]

// Members page tour
export const membersTourSteps: TourStep[] = [
  {
    target: '[data-tour="add-member"]',
    title: 'Add New Members',
    content: 'Click here to add new church members. You can enter their details and optionally create a user account for them.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="search"]',
    title: 'Search Members',
    content: 'Quickly find members by name, email, or phone number using the search bar.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="member-list"]',
    title: 'Members Directory',
    content: 'View all members with their key information. Click on any member to see full details, edit, or assign to teams.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="filters"]',
    title: 'Filter Options',
    content: 'Filter members by status (active, inactive), team membership, or other criteria.',
    placement: 'bottom'
  }
]

// Events page tour
export const eventsTourSteps: TourStep[] = [
  {
    target: '[data-tour="create-event"]',
    title: 'Create Events',
    content: 'Create church events like services, conferences, or special programs. Set dates, locations, and manage attendees.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="event-calendar"]',
    title: 'Event Calendar',
    content: 'View all upcoming events in calendar or list view. Track attendance and manage registrations.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="event-stats"]',
    title: 'Event Metrics',
    content: 'Monitor event performance with stats on registrations, check-ins, and attendance trends.',
    placement: 'bottom'
  }
]

// Devotionals page tour
export const devotionalsTourSteps: TourStep[] = [
  {
    target: '[data-tour="add-devotional"]',
    title: 'Create Devotionals',
    content: 'Add daily devotionals with scripture, content, and reflection questions to inspire your congregation.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="devotional-stats"]',
    title: 'Engagement Metrics',
    content: 'Track how many members are reading devotionals, liking, and commenting on them.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="devotional-list"]',
    title: 'Manage Content',
    content: 'View, edit, or delete devotionals. Click to see full content and engagement statistics.',
    placement: 'bottom'
  }
]

// Giving page tour
export const givingTourSteps: TourStep[] = [
  {
    target: '[data-tour="giving-stats"]',
    title: 'Giving Overview',
    content: 'Track total donations, monthly trends, and top givers to understand your church\'s financial health.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="record-donation"]',
    title: 'Record Donations',
    content: 'Manually record offline donations like cash or check offerings.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="donation-history"]',
    title: 'Transaction History',
    content: 'View all giving transactions with details on donor, amount, payment method, and purpose.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="export"]',
    title: 'Export Reports',
    content: 'Generate and download giving reports for accounting or tax purposes.',
    placement: 'bottom'
  }
]

// Testimonies/Praise Reports page tour
export const testimoniesTourSteps: TourStep[] = [
  {
    target: '[data-tour="testimony-filters"]',
    title: 'Filter Testimonies',
    content: 'View pending, approved, or rejected testimonies. Use categories to organize praise reports.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="testimony-list"]',
    title: 'Review Submissions',
    content: 'Read member testimonies and approve or reject them for public display in the mobile app.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="approve-reject"]',
    title: 'Moderation Actions',
    content: 'Approve testimonies to share with the congregation, or reject inappropriate submissions with a reason.',
    placement: 'left'
  }
]

// Teams page tour
export const teamsTourSteps: TourStep[] = [
  {
    target: '[data-tour="create-team"]',
    title: 'Create Teams',
    content: 'Set up ministry teams like choir, ushers, media, or prayer teams to organize volunteers.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="team-list"]',
    title: 'Manage Teams',
    content: 'View all teams with member counts. Click to see details, add members, or assign team leaders.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="team-members"]',
    title: 'Team Members',
    content: 'Assign members to teams and designate team leaders to manage specific ministries.',
    placement: 'bottom'
  }
]

// Notifications page tour
export const notificationsTourSteps: TourStep[] = [
  {
    target: '[data-tour="send-notification"]',
    title: 'Send Notifications',
    content: 'Send push notifications to all members or specific groups about events, announcements, or urgent updates.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="notification-type"]',
    title: 'Notification Types',
    content: 'Choose between push notifications, emails, or SMS based on urgency and importance.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="notification-history"]',
    title: 'Sent Notifications',
    content: 'View history of all sent notifications with delivery status and read rates.',
    placement: 'bottom'
  }
]

// Forms page tour
export const formsTourSteps: TourStep[] = [
  {
    target: '[data-tour="create-form"]',
    title: 'Create Forms',
    content: 'Build custom forms for prayer requests, baby dedications, business dedications, or any custom needs.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="form-builder"]',
    title: 'Form Builder',
    content: 'Add fields, set validation rules, and customize your forms without any coding required.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="form-submissions"]',
    title: 'View Submissions',
    content: 'Access all form submissions, review responses, and take appropriate actions.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="share-form"]',
    title: 'Share Forms',
    content: 'Get shareable links to distribute forms via social media, email, or embed on your website.',
    placement: 'left'
  }
]

// Media page tour
export const mediaTourSteps: TourStep[] = [
  {
    target: '[data-tour="upload-media"]',
    title: 'Upload Media',
    content: 'Upload sermon videos, audio messages, or other media content to share with your congregation.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="media-categories"]',
    title: 'Organize Content',
    content: 'Categorize media by type (sermon, worship, teaching) and add tags for easy discovery.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="media-list"]',
    title: 'Manage Media',
    content: 'View all uploaded media with playback stats. Edit details, add sermon notes, or delete content.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="media-stats"]',
    title: 'Engagement Metrics',
    content: 'Track views, likes, comments, and shares to see which content resonates most with members.',
    placement: 'top'
  }
]

// Gallery page tour
export const galleryTourSteps: TourStep[] = [
  {
    target: '[data-tour="upload-photos"]',
    title: 'Upload Photos',
    content: 'Upload event photos, church activities, or special occasions to create a visual timeline.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="create-folder"]',
    title: 'Organize Albums',
    content: 'Create folders to organize photos by event, date, or category for easy navigation.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="gallery-grid"]',
    title: 'Photo Gallery',
    content: 'Browse all images in grid view. Click to view full size, edit details, or delete photos.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="bulk-actions"]',
    title: 'Batch Operations',
    content: 'Select multiple photos to move, delete, or tag in bulk for efficient management.',
    placement: 'top'
  }
]

// Junior Church page tour
export const juniorChurchTourSteps: TourStep[] = [
  {
    target: '[data-tour="add-child"]',
    title: 'Register Children',
    content: 'Add children to Junior Church with parent/guardian information and emergency contacts.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="check-in"]',
    title: 'Check-In System',
    content: 'Use the barcode scanner or manual check-in to track attendance and ensure child safety.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="attendance-stats"]',
    title: 'Attendance Tracking',
    content: 'View attendance history, patterns, and generate reports for Junior Church programs.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="children-list"]',
    title: 'Manage Children',
    content: 'View all registered children with age groups, attendance records, and parent contact information.',
    placement: 'top'
  }
]
