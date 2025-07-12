'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  UserCheck,
  Heart,
  Activity,
  Clock
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { formatDateConsistent, getCurrentDate, parseApiMember, parseApiEvent, parseApiBlogPost, parseApiAttendanceRecord } from '@/lib/utils'
import { Member, Event } from '@/types'

const breadcrumbItems = [
  { label: 'Dashboard' }
]

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalMembers: 0,
    newMembersThisMonth: 0,
    upcomingEvents: 0,
    totalBlogPosts: 0,
    recentAttendance: 0
  })
  const [recentMembers, setRecentMembers] = useState<Member[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [membersRes, eventsRes, blogRes, attendanceRes] = await Promise.all([
        apiClient.getMembers(),
        apiClient.getEvents(),
        apiClient.getBlogPosts(),
        apiClient.getAttendanceRecords()
      ])

      const currentDate = getCurrentDate()

      // Process members data
      if (membersRes.success && membersRes.data) {
        const members = Array.isArray(membersRes.data) ? membersRes.data.map(parseApiMember) : []
        const thisMonth = new Date()
        thisMonth.setDate(1)
        const newThisMonth = members.filter(m => new Date(m.dateJoined) >= thisMonth)
        
        // Get 5 most recent members
        const recent = members
          .sort((a, b) => new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime())
          .slice(0, 5)
        setRecentMembers(recent)

        // Get upcoming anniversaries (members with birthdays or wedding anniversaries)
        const anniversaries = members
          .filter(member => member.dateOfBirth || member.weddingAnniversary)
          .slice(0, 5)
        setUpcomingAnniversaries(anniversaries)
        
        setStats(prev => ({
          ...prev,
          totalMembers: members.length,
          newMembersThisMonth: newThisMonth.length
        }))
      }

      // Process events data
      if (eventsRes.success && eventsRes.data) {
        const events = Array.isArray(eventsRes.data) ? eventsRes.data.map(parseApiEvent) : []
        const upcoming = events.filter(e => new Date(e.date) > currentDate)
        
        // Get 5 upcoming events
        const upcomingList = upcoming
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5)
        setUpcomingEvents(upcomingList)
        
        setStats(prev => ({
          ...prev,
          upcomingEvents: upcoming.length
        }))
      }

      // Process blog data
      if (blogRes.success && blogRes.data) {
        const posts = Array.isArray(blogRes.data) ? blogRes.data.map(parseApiBlogPost) : []
        
        setStats(prev => ({
          ...prev,
          totalBlogPosts: posts.length
        }))
      }

      // Process attendance data
      if (attendanceRes.success && attendanceRes.data) {
        const attendance = Array.isArray(attendanceRes.data) ? attendanceRes.data.map(parseApiAttendanceRecord) : []
        const last7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        const recent = attendance.filter(r => new Date(r.date) > last7Days)
        
        setStats(prev => ({
          ...prev,
          recentAttendance: recent.length
        }))
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Quick action handlers
  const handleAddMember = () => {
    router.push('/members')
  }

  const handleCreateEvent = () => {
    router.push('/events')
  }

  const handleNewBlogPost = () => {
    router.push('/blog')
  }

  const handleTakeAttendance = () => {
    router.push('/attendance')
  }

  // Create dynamic stats array based on loaded data
  const statsArray = [
    {
      name: 'Total Members',
      value: stats.totalMembers.toString(),
      icon: Users,
      change: `+${stats.newMembersThisMonth}`,
      changeType: 'positive' as const,
    },
    {
      name: 'Upcoming Events',
      value: stats.upcomingEvents.toString(),
      icon: Calendar,
      change: '+' + stats.upcomingEvents,
      changeType: 'positive' as const,
    },
    {
      name: 'Blog Posts',
      value: stats.totalBlogPosts.toString(),
      icon: FileText,
      change: '+' + stats.totalBlogPosts,
      changeType: 'positive' as const,
    },
    {
      name: 'Recent Attendance',
      value: stats.recentAttendance.toString(),
      icon: UserCheck,
      change: '+' + stats.recentAttendance,
      changeType: 'positive' as const,
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening at Sycamore Church.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsArray.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <TrendingUp className="h-4 w-4 flex-shrink-0 self-center" />
                          <span className="ml-1">{stat.change}</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Recent Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Joined {formatDateConsistent(member.dateJoined)}
                      </p>
                    </div>
                    {member.isFirstTimer && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        First Timer
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {event.name}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDateConsistent(event.date)} at {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {event.isRecurring && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Recurring
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleAddMember}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Users className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Add Member</span>
                </button>
                <button 
                  onClick={handleCreateEvent}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Calendar className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Create Event</span>
                </button>
                <button 
                  onClick={handleNewBlogPost}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FileText className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">New Blog Post</span>
                </button>
                <button 
                  onClick={handleTakeAttendance}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <UserCheck className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Take Attendance</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Anniversaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Upcoming Anniversaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAnniversaries.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-pink-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.dateOfBirth && `Birthday: ${formatDateConsistent(member.dateOfBirth)}`}
                        {member.weddingAnniversary && `Wedding: ${formatDateConsistent(member.weddingAnniversary)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
