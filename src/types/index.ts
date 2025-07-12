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
