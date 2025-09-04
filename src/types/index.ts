export interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateJoined: Date
  isFirstTimer: boolean
  teamId?: string
  isTeamLead: boolean
  isAdmin: boolean
  avatar?: string
  address?: string
  dateOfBirth?: Date
  weddingAnniversary?: Date
  maritalStatus: 'single' | 'married' | 'divorced'
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  // New fields for tracking user journey
  communityIds: string[] // communities they belong to
  attendanceStreak: number
  totalAttendance: number
  totalGiving: number
  lastActivityDate?: Date
  skills?: string[]
  interests?: string[]
  availability?: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}

export interface Team {
  id: string
  name: string
  description: string
  teamLeadId: string
  members: string[] // member IDs
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  title: string
  description: string
  teamId: string
  assigneeId?: string // member assigned to task
  creatorId: string // team leader who created it
  status: 'open' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date // renamed from expectedDeliveryDate for clarity
  createdAt: Date
  updatedAt: Date
  completedAt?: Date // when task was marked complete
  tags?: string[]
  isPublic: boolean // whether task is visible on frontend
  pickupDate?: Date // when member picked up the task
}

// Populated version for frontend use
export interface TaskPopulated {
  id: string
  title: string
  description: string
  teamId: Team
  assigneeId?: Member // member assigned to task
  creatorId: Member // team leader who created it
  status: 'open' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  tags?: string[]
  isPublic: boolean
  pickupDate?: Date
}

export interface Community {
  id: string
  name: string
  description: string
  type: 'team' | 'life-group' | 'ministry' | 'custom'
  leaderId: string
  members: string[]
  isActive: boolean
  meetingSchedule?: string
  createdAt: Date
  updatedAt: Date
}

// Populated version for frontend use
export interface CommunityPopulated {
  id: string
  name: string
  description: string
  type: 'team' | 'life-group' | 'ministry' | 'custom'
  leaderId: Member
  members: Member[]
  isActive: boolean
  meetingSchedule?: string
  createdAt: Date
  updatedAt: Date
}

export interface GalleryFolder {
  id: string
  name: string
  description?: string
  coverImage?: string
  eventId?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  imageCount: number
  isPublic: boolean
}

export interface GalleryImage {
  id: string
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  folderId?: string // Added folder support
  eventId?: string
  uploadedBy: string
  uploadedAt: Date
  tags?: string[]
  isPublic: boolean
}

// Populated version for frontend use
export interface GalleryFolderPopulated {
  id: string
  name: string
  description?: string
  coverImage?: string
  eventId?: Event
  createdBy: Member
  createdAt: Date
  updatedAt: Date
  imageCount: number
  isPublic: boolean
}

export interface GalleryImagePopulated {
  id: string
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  folderId?: GalleryFolder
  eventId?: Event
  uploadedBy: Member
  uploadedAt: Date
  tags?: string[]
  isPublic: boolean
}

export interface Comment {
  id: string
  content: string
  authorId: string
  targetType: 'event' | 'blog' | 'gallery' | 'announcement'
  targetId: string
  parentCommentId?: string // for nested comments
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserActivity {
  id: string
  userId: string
  activityType: 'login' | 'event_attendance' | 'team_joined' | 'task_completed' | 'comment_posted' | 'giving_made'
  description: string
  metadata?: Record<string, any>
  timestamp: Date
}

export interface Giving {
  id: string
  memberId: string
  amount: number
  currency: string
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other'
  category: 'tithe' | 'offering' | 'special_offering' | 'building_fund' | 'missions' | 'other'
  description?: string
  date: Date
  isRecurring: boolean
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly'
  createdAt: Date
}

// Populated version for frontend use
export interface GivingPopulated {
  id: string
  memberId: Member
  amount: number
  currency: string
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other'
  category: 'tithe' | 'offering' | 'special_offering' | 'building_fund' | 'missions' | 'other'
  description?: string
  date: Date
  isRecurring: boolean
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly'
  createdAt: Date
}

export interface RequestForm {
  id: string
  type: 'baby_dedication' | 'prayer_request' | 'business_dedication' | 'custom'
  title: string
  description: string
  fields: FormField[]
  isActive: boolean
  requiresApproval: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file'
  required: boolean
  options?: string[] // for select fields
  placeholder?: string
}

export interface RequestSubmission {
  id: string
  formId: string
  submitterId: string | null // Allow null for anonymous submissions
  responses: Record<string, any>
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  submittedAt: Date
  processedAt?: Date
  processedBy?: string
  notes?: string
}

// Populated versions for frontend use
export interface RequestSubmissionPopulated {
  id: string
  formId: RequestForm
  submitterId: Member | null // Allow null for anonymous submissions
  responses: Record<string, any>
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  submittedAt: Date
  processedAt?: Date
  processedBy?: string
  notes?: string
}

export interface Event {
  id: string
  name: string
  description: string
  date: Date
  endDate?: Date
  location?: string
  banner?: string
  bannerType?: 'image' | 'video'
  isRecurring: boolean
  createdBy: string
  attendees?: string[] // member IDs
  maxAttendees?: number
}

export interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  publishedAt?: Date
  isDraft: boolean
  featuredImage?: string
  tags: string[]
  slug: string
}

export interface Anniversary {
  id: string
  memberId: string
  type: 'birthday' | 'wedding'
  date: Date
  recurring: boolean
  notes?: string
}

export interface AttendanceRecord {
  id: string
  memberId: string
  eventId: string
  date: Date
  status: 'present' | 'absent' | 'excused'
  checkedInAt: Date
  notes?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
  teamIds: string[]
  isTeamLead: boolean
  avatar?: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
  }
}

export type UserRole = 'admin' | 'team-lead' | 'member' | 'first-timer'

export interface BreadcrumbItem {
  label: string
  href?: string
}
