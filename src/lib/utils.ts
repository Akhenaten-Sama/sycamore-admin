import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Member, Anniversary, Event, BlogPost, AttendanceRecord, Team } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Consistent date formatting to avoid hydration errors
export function formatDateConsistent(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  
  let dateObj: Date
  
  if (date instanceof Date) {
    dateObj = date
  } else if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    return 'N/A'
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'N/A'
  }
  
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const year = dateObj.getFullYear()
  return `${month}/${day}/${year}`
}

export function formatDateTimeConsistent(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  
  let dateObj: Date
  
  if (date instanceof Date) {
    dateObj = date
  } else if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    return 'N/A'
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'N/A'
  }
  
  const dateStr = formatDateConsistent(dateObj)
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  return `${dateStr} ${hours}:${minutes}`
}

// Get current date in a consistent way for SSR
export function getCurrentDate(): Date {
  if (typeof window === 'undefined') {
    // Server side - use a fixed date to avoid hydration mismatch
    return new Date('2025-07-01T00:00:00.000Z')
  }
  // Client side - use actual current date
  return new Date()
}

// Utility functions for parsing API response dates
export function parseApiDate(dateString: string | Date | null | undefined): Date {
  if (!dateString) {
    return new Date()
  }
  
  if (dateString instanceof Date) {
    return dateString
  }
  
  const parsed = new Date(dateString)
  
  // Check if the parsed date is valid
  if (isNaN(parsed.getTime())) {
    return new Date()
  }
  
  return parsed
}

export function parseApiMember(member: any): Member {
  return {
    ...member,
    id: member._id || member.id, // Handle MongoDB _id
    dateJoined: parseApiDate(member.dateJoined),
    dateOfBirth: member.dateOfBirth ? parseApiDate(member.dateOfBirth) : undefined,
    weddingAnniversary: member.weddingAnniversary ? parseApiDate(member.weddingAnniversary) : undefined
  }
}

export function parseApiAnniversary(anniversary: any): Anniversary {
  return {
    ...anniversary,
    id: anniversary._id || anniversary.id,
    date: parseApiDate(anniversary.date)
  }
}

export function parseApiEvent(event: any): Event {
  return {
    ...event,
    id: event._id || event.id,
    date: parseApiDate(event.date),
    endDate: event.endDate ? parseApiDate(event.endDate) : undefined
  }
}

export function parseApiBlogPost(post: any): BlogPost {
  return {
    ...post,
    id: post._id || post.id,
    publishedAt: post.publishedAt ? parseApiDate(post.publishedAt) : undefined
  }
}

export function parseApiAttendanceRecord(record: any): AttendanceRecord {
  return {
    ...record,
    id: record._id || record.id,
    date: parseApiDate(record.date),
    checkedInAt: parseApiDate(record.checkedInAt)
  }
}

export function parseApiTeam(team: any): Team {
  return {
    ...team,
    id: team._id || team.id,
    // Handle potentially missing or invalid timestamps
    createdAt: team.createdAt ? parseApiDate(team.createdAt) : new Date(),
    updatedAt: team.updatedAt ? parseApiDate(team.updatedAt) : new Date()
  }
}
