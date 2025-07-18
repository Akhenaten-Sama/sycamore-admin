import { Member, Team, Event, BlogPost, Anniversary, AttendanceRecord, User } from '@/types'

// Mock data for development
export const mockMembers: Member[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    dateJoined: new Date('2023-01-15'),
    isFirstTimer: false,
    teamId: '1',
    isTeamLead: false,
    isAdmin: false,
    dateOfBirth: new Date('1990-05-15'),
    address: '123 Main St, City',
    maritalStatus: 'single',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    dateJoined: new Date('2022-11-20'),
    isFirstTimer: false,
    teamId: '1',
    isTeamLead: true,
    isAdmin: false,
    dateOfBirth: new Date('1985-08-22'),
    weddingAnniversary: new Date('2015-06-10'),
    maritalStatus: 'married',
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    phone: '+1234567892',
    dateJoined: new Date('2024-01-01'),
    isFirstTimer: true,
    isTeamLead: false,
    isAdmin: false,
    dateOfBirth: new Date('1992-12-03'),
    maritalStatus: 'divorced',
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1234567893',
    dateJoined: new Date('2021-09-10'),
    isFirstTimer: false,
    teamId: '2',
    isTeamLead: false,
    isAdmin: true,
    dateOfBirth: new Date('1988-03-17'),
    maritalStatus: 'single',
  },
]

export const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Worship Team',
    description: 'Leading worship and music ministry',
    teamLeadId: '2',
    members: ['1', '2'],
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-01'),
  },
  {
    id: '2',
    name: 'Youth Ministry',
    description: 'Ministry focused on young people',
    teamLeadId: '4',
    members: ['4'],
    createdAt: new Date('2022-02-01'),
    updatedAt: new Date('2022-02-01'),
  },
]

export const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Sunday Service',
    description: 'Weekly Sunday worship service',
    date: new Date('2024-12-22T10:00:00'),
    endDate: new Date('2024-12-22T12:00:00'),
    location: 'Main Sanctuary',
    isRecurring: true,
    createdBy: '4',
    maxAttendees: 500,
  },
  {
    id: '2',
    name: 'Christmas Celebration',
    description: 'Special Christmas service and celebration',
    date: new Date('2024-12-25T18:00:00'),
    endDate: new Date('2024-12-25T21:00:00'),
    location: 'Main Sanctuary',
    isRecurring: false,
    createdBy: '4',
    maxAttendees: 800,
  },
  {
    id: '3',
    name: 'Youth Camp 2025',
    description: 'Annual youth summer camp',
    date: new Date('2025-07-15T09:00:00'),
    endDate: new Date('2025-07-20T16:00:00'),
    location: 'Camp Galilee',
    isRecurring: true,
    createdBy: '4',
    maxAttendees: 100,
  },
]

export const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Welcome to Sycamore Church',
    content: 'We are excited to welcome you to our church family...',
    excerpt: 'A warm welcome to our church community',
    author: 'Pastor John',
    publishedAt: new Date('2024-12-01'),
    isDraft: false,
    tags: ['welcome', 'community'],
    slug: 'welcome-to-sycamore-church',
  },
  {
    id: '2',
    title: 'Christmas Service Schedule',
    content: 'Join us for our special Christmas services...',
    excerpt: 'Special Christmas service times and events',
    author: 'Admin',
    publishedAt: new Date('2024-12-15'),
    isDraft: false,
    tags: ['christmas', 'schedule'],
    slug: 'christmas-service-schedule',
  },
]

export const mockAnniversaries: Anniversary[] = [
  {
    id: '1',
    memberId: '1',
    type: 'birthday',
    date: new Date('1990-05-15'),
    recurring: true,
  },
  {
    id: '2',
    memberId: '2',
    type: 'wedding',
    date: new Date('2015-06-10'),
    recurring: true,
  },
  {
    id: '3',
    memberId: '2',
    type: 'birthday',
    date: new Date('1985-08-22'),
    recurring: true,
  },
]

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    memberId: '1',
    eventId: '1',
    date: new Date('2024-12-15T10:00:00'),
    status: 'present',
    checkedInAt: new Date('2024-12-15T09:45:00'),
  },
  {
    id: '2',
    memberId: '2',
    eventId: '1',
    date: new Date('2024-12-15T10:00:00'),
    status: 'present',
    checkedInAt: new Date('2024-12-15T09:50:00'),
  },
]

export const mockUser: User = {
  id: '4',
  email: 'admin@sycamore.church',
  firstName: 'Sarah',
  lastName: 'Wilson',
  isAdmin: true,
  teamIds: ['2'],
  isTeamLead: true,
  preferences: {
    theme: 'light',
    notifications: true,
  },
}
