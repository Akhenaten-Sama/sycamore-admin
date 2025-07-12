import { 
  mockMembers, 
  mockEvents, 
  mockBlogPosts, 
  mockTeams, 
  mockAnniversaries, 
  mockAttendanceRecords 
} from './mock-data'

// Shared in-memory data store for all API routes
// In production, this would be replaced with a database
export const dataStore = {
  members: [...mockMembers],
  events: [...mockEvents],
  blogPosts: [...mockBlogPosts],
  teams: [...mockTeams],
  anniversaries: [...mockAnniversaries],
  attendanceRecords: [...mockAttendanceRecords]
}

export default dataStore
